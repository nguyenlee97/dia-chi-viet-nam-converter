// api/lookup.js
import { checkRateLimit } from './_lib/rate-limiter.js';
import { getWardsCollection } from './_lib/db.js';

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

    const { oldProvince, oldDistrict, oldWard, userCoordinates } = req.body;

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

        // Case 2: Split (Geospatial Case)
        if (!userCoordinates || !userCoordinates.lat || !userCoordinates.lon) {
            return res.status(200).json({
                type: 'SPLITTED_REQUIRES_COORDS',
                messageKey: 'INFO_SPLIT_NEEDS_COORDS',
                potentialNewWards: wardData.new_address.new_ward_name || []
            });
        }

        // Perform the geospatial query using MongoDB's $geoIntersects
        const point = {
            type: 'Point',
            coordinates: [userCoordinates.lon, userCoordinates.lat]
        };

        const result = await wardsCollection.findOne({
             // Match the same old ward again
            _id: wardData._id,
            // And find which new polygon the user's point is in
            geo: {
                $geoIntersects: {
                    $geometry: point
                }
            }
        }, {
            // Only return the part of the geo collection that matched
            projection: { 'geo.geometries.$': 1, 'new_address.new_province_name': 1 }
        });

        if (result && result.geo && result.geo.geometries.length > 0) {
            const matchedGeometry = result.geo.geometries[0];
            const { new_ward_name, old_merge_ward, new_ward_bbox } = matchedGeometry.properties;
            
            return res.status(200).json({
                type: 'SPLITTED_MATCH_FOUND',
                newAddress: {
                    new_ward_name: new_ward_name,
                    new_province_name: result.new_address.new_province_name
                },
                geoDetails: {
                    ...matchedGeometry.properties,
                    centroid: [userCoordinates.lon, userCoordinates.lat] // Use the provided coordinates
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