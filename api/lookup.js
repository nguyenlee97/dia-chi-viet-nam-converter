// api/lookup.js
import { checkRateLimit } from './_lib/rate-limiter.js';
import { getWardsCollection } from './_lib/db.js';
import axios from 'axios';
import * as turf from '@turf/turf'; // We need turf.js on the backend now

const geocodingHeaders = {
    'User-Agent': 'VietNamAddressConverter/1.0 (https://dia-chi-viet-nam-converter.vercel.app/)' // Please keep this updated with your actual URL
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

        // Geocoding logic
        let userCoordinates;
        try {
            const structuredParams = new URLSearchParams({
                street: streetInfo,
                city: oldProvince,
                country: 'Vietnam',
                format: 'jsonv2',
                polygon_geojson: '1'
            });
            const structuredUrl = `https://nominatim.openstreetmap.org/search?${structuredParams.toString()}`;
            const structuredResponse = await axios.get(structuredUrl, { headers: geocodingHeaders });

            if (structuredResponse.data && structuredResponse.data.length > 0) {
                const { lat, lon } = structuredResponse.data[0];
                userCoordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
            } else {
                const unstructuredQuery = `${streetInfo}, ${oldWard}, ${oldDistrict}, ${oldProvince}, Vietnam`;
                const unstructuredUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(unstructuredQuery)}`;
                const fallbackResponse = await axios.get(unstructuredUrl, { headers: geocodingHeaders });

                if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                    const { lat, lon } = fallbackResponse.data[0];
                    userCoordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
                } else {
                    return res.status(404).json({ messageKey: 'ERROR_GEOCODING_FAILED' });
                }
            }
        } catch (geoError) {
            console.error('Backend Geocoding Error:', geoError);
            return res.status(500).json({ messageKey: 'ERROR_GEOCODING_FAILED' });
        }

        // --- NEW, CORRECTED GEOSPATIAL LOGIC ---
        const userPoint = turf.point([userCoordinates.lon, userCoordinates.lat]);
        let foundWardDetails = null;

        // The wardData we fetched earlier contains the full 'geo.geometries' array.
        // We now iterate through it in memory to find the exact match.
        if (wardData.geo && wardData.geo.geometries) {
            for (const newWardGeometry of wardData.geo.geometries) {
                // Reconstruct the polygon for turf.js to check
                const wardPolygon = turf.multiPolygon(newWardGeometry.coordinates);
                if (turf.booleanPointInPolygon(userPoint, wardPolygon)) {
                    // We found the specific new ward!
                    foundWardDetails = newWardGeometry.properties;
                    break; // Exit the loop once a match is found
                }
            }
        }
        
        if (foundWardDetails) {
            return res.status(200).json({
                type: 'SPLITTED_MATCH_FOUND',
                newAddress: {
                    new_ward_name: foundWardDetails.new_ward_name,
                    new_province_name: wardData.new_address.new_province_name,
                },
                geoDetails: {
                    ...foundWardDetails,
                    centroid: [userCoordinates.lon, userCoordinates.lat]
                },
                oldAddress: { oldProvince, oldDistrict, oldWard }
            });
        } else {
            // This means the point was not inside any of the new ward polygons
            return res.status(404).json({
                type: 'SPLITTED_NO_MATCH',
                messageKey: 'ERROR_SPLIT_NO_MATCH'
            });
        }
        // --- END OF CORRECTED LOGIC ---

    } catch (error) {
        console.error('Lookup error:', error);
        return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
    }
}