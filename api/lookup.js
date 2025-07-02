// api/lookup.js
import { checkRateLimit } from './_lib/rate-limiter.js';
import { getWardsCollection } from './_lib/db.js';
import axios from 'axios';
import * as turf from '@turf/turf';

const geocodingHeaders = {
    'User-Agent': 'VietNamAddressConverter/1.0 (https://dia-chi-viet-nam-converter.vercel.app/)'
};

export default async function handler(req, res) {
    // ... (Rate limiting and other checks remain the same) ...

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const limitResult = checkRateLimit(ip);

    if (!limitResult.allowed) {
        return res.status(429).json({
            messageKey: limitResult.messageKey,
            meta: limitResult.meta
        });
    }

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

        if (!wardData.is_splitted) {
            return res.status(200).json({
                type: 'MERGED',
                newAddress: wardData.new_address,
                oldAddress: { oldProvince, oldDistrict, oldWard }
            });
        }

        if (!streetInfo || streetInfo.trim() === '') {
            return res.status(400).json({
                messageKey: 'INFO_SPLIT_NEEDS_STREET_INFO'
            });
        }
        
        // --- MODIFICATION START ---
        // Create a more detailed list of potential new addresses.
        const potentialNewWards = wardData.new_address.new_ward_name.map(w => ({
            new_ward_name: w.new_ward_name,
            new_province_name: wardData.new_address.new_province_name 
            // Note: In the future, you could also add the new district here if it's available in your data.
        }));
        // --- MODIFICATION END ---
        
        let userCoordinates;
        try {
            // ... (Geocoding logic remains the same) ...
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
                    return res.status(404).json({ 
                        messageKey: 'ERROR_GEOCODING_FAILED',
                        potentialNewWards: potentialNewWards // Return the detailed list
                    });
                }
            }
        } catch (geoError) {
            console.error('Backend Geocoding Error:', geoError);
            return res.status(500).json({ 
                messageKey: 'ERROR_GEOCODING_FAILED',
                potentialNewWards: potentialNewWards // Return the detailed list
            });
        }

        // ... (Turf.js logic remains the same) ...
        const userPoint = turf.point([userCoordinates.lon, userCoordinates.lat]);
        let foundWardDetails = null;

        if (wardData.geo && wardData.geo.geometries) {
            for (const newWardGeometry of wardData.geo.geometries) {
                const wardPolygon = turf.multiPolygon(newWardGeometry.coordinates);
                if (turf.booleanPointInPolygon(userPoint, wardPolygon)) {
                    foundWardDetails = newWardGeometry.properties;
                    break;
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
            return res.status(404).json({
                type: 'SPLITTED_NO_MATCH',
                messageKey: 'ERROR_SPLIT_NO_MATCH',
                potentialNewWards: potentialNewWards // Return the detailed list
            });
        }

    } catch (error) {
        console.error('Lookup error:', error);
        return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
    }
}