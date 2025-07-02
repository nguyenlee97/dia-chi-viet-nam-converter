// api/lookup.js
import { checkRateLimit } from './_lib/rate-limiter.js';
import { getWardsCollection } from './_lib/db.js';
import axios from 'axios';

// --- IMPORTANT: Nominatim Usage Policy ---
// Nominatim requires a valid User-Agent header that identifies your application.
// Replace 'YOUR_APP_URL_HERE' with your actual Vercel app URL.
// This helps them contact you if there's an issue.
const geocodingHeaders = {
    'User-Agent': 'VietNamAddressConverter/1.0 (https://dia-chi-viet-nam-converter.vercel.app)'
};

export default async function handler(req, res) {
    // 1. Enforce Rate Limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const limitResult = checkRateLimit(ip);

    if (!limitResult.allowed) {
        return res.status(429).json({
            messageKey: limitResult.messageKey,
            meta: limitResult.meta
        });
    }

    // 2. Process the request
    if (req.method !== 'POST') {
        return res.status(405).json({ messageKey: 'ERROR_METHOD_NOT_ALLOWED' });
    }

    const { oldProvince, oldDistrict, oldWard, streetInfo } = req.body;

    if (!oldProvince || !oldDistrict || !oldWard) {
        return res.status(400).json({ messageKey: 'ERROR_MISSING_ADDRESS' });
    }

    try {
        const wardsCollection = await getWardsCollection();
        
        const wardData = await wardsCollection.findOne({
            old_province_name: oldProvince,
            old_district_name: oldDistrict,
            old_ward_name: oldWard
        });

        if (!wardData) {
            return res.status(404).json({ messageKey: 'ERROR_NOT_FOUND' });
        }

        // Case 1: Merged (Simple Case)
        if (!wardData.is_splitted) {
            return res.status(200).json({
                type: 'MERGED',
                newAddress: wardData.new_address,
                oldAddress: { oldProvince, oldDistrict, oldWard }
            });
        }

        // Case 2: Split (Complex Case)
        if (!streetInfo || streetInfo.trim() === '') {
            return res.status(400).json({
                messageKey: 'INFO_SPLIT_NEEDS_STREET_INFO'
            });
        }

        // --- NEW: Structured Geocoding with Fallback ---
        let userCoordinates;
        try {
            // 1. Attempt Structured Search (more accurate)
            const structuredParams = new URLSearchParams({
                street: streetInfo,
                city: oldProvince,
                country: 'Vietnam',
                format: 'jsonv2',
                polygon_geojson: '1'
            });
            const structuredUrl = `https://nominatim.openstreetmap.org/search?${structuredParams.toString()}`;
            console.log(`[GEOCODING] Attempting structured search: ${structuredUrl}`);
            const structuredResponse = await axios.get(structuredUrl, { headers: geocodingHeaders });

            if (structuredResponse.data && structuredResponse.data.length > 0) {
                const { lat, lon } = structuredResponse.data[0];
                userCoordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
                console.log(`[GEOCODING] Structured search SUCCESS.`);
            } else {
                // 2. Fallback to Unstructured Search
                console.warn(`[GEOCODING] Structured search failed. Falling back to unstructured.`);
                const unstructuredQuery = `${streetInfo}, ${oldWard}, ${oldDistrict}, ${oldProvince}, Vietnam`;
                const unstructuredUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(unstructuredQuery)}`;
                const fallbackResponse = await axios.get(unstructuredUrl, { headers: geocodingHeaders });

                if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                    const { lat, lon } = fallbackResponse.data[0];
                    userCoordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
                    console.log(`[GEOCODING] Unstructured fallback SUCCESS.`);
                } else {
                    // Both methods failed
                    console.error(`[GEOCODING] All geocoding methods failed.`);
                    return res.status(404).json({ messageKey: 'ERROR_GEOCODING_FAILED' });
                }
            }
        } catch (geoError) {
            console.error('Backend Geocoding Error:', geoError);
            return res.status(500).json({ messageKey: 'ERROR_GEOCODING_FAILED' });
        }
        // --- End of Geocoding logic ---

        const point = {
            type: 'Point',
            coordinates: [userCoordinates.lon, userCoordinates.lat]
        };

        const result = await wardsCollection.findOne({
            _id: wardData._id,
            geo: { $geoIntersects: { $geometry: point } }
        }, {
            projection: { 'geo.geometries.$': 1, 'new_address.new_province_name': 1 }
        });

        if (result && result.geo && result.geo.geometries.length > 0) {
            const matchedGeometry = result.geo.geometries[0];
            const { new_ward_name } = matchedGeometry.properties;
            
            return res.status(200).json({
                type: 'SPLITTED_MATCH_FOUND',
                newAddress: {
                    new_ward_name: new_ward_name,
                    new_province_name: result.new_address.new_province_name
                },
                geoDetails: {
                    ...matchedGeometry.properties,
                    centroid: [userCoordinates.lon, userCoordinates.lat]
                },
                oldAddress: { oldProvince, oldDistrict, oldWard }
            });
        } else {
            return res.status(404).json({
                type: 'SPLITTED_NO_MATCH',
                messageKey: 'ERROR_SPLIT_NO_MATCH'
            });
        }

    } catch (error) {
        console.error('Lookup error:', error);
        return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
    }
}