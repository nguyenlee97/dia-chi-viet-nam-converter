// api/lookup.js
import { checkRateLimit } from './_lib/rate-limiter.js';
import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';

// Load detailed ward data from JSON file instead of MongoDB for now
let detailedWardDataArray = null;
let detailedWardMap = null;

try {
    const dataPath = path.resolve('./api/_data/detailed_ward_data.json');
    const fileContents = fs.readFileSync(dataPath, 'utf-8');
    detailedWardDataArray = JSON.parse(fileContents);
    detailedWardMap = new Map(detailedWardDataArray);
    console.log("✅ Detailed ward data loaded and cached in memory.");
} catch (error) {
    console.error("❌ Failed to load detailed_ward_data.json:", error);
}

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

    if (!detailedWardMap) {
        return res.status(500).json({ messageKey: 'ERROR_UNKNOWN', details: "Server data is not available." });
    }

    try {
        const lookupKey = `${oldProvince}|${oldDistrict}|${oldWard}`;
        const wardData = detailedWardMap.get(lookupKey);

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

        try {
            const userPoint = turf.point([userCoordinates.lon, userCoordinates.lat]);
            const splittedWards = wardData.new_address.new_ward_name;
            let foundWard = null;

            for (const newWard of splittedWards) {
                // Create a polygon from the coordinates
                const wardPolygon = turf.multiPolygon(newWard.new_ward_coordinate);
                if (turf.booleanPointInPolygon(userPoint, wardPolygon)) {
                    foundWard = newWard;
                    break;
                }
            }

            if (foundWard) {
                return res.status(200).json({
                    type: 'SPLITTED_MATCH_FOUND',
                    newAddress: {
                        new_ward_name: foundWard.new_ward_name,
                        new_province_name: wardData.new_address.new_province_name
                    },
                    geoDetails: foundWard,
                    oldAddress: { oldProvince, oldDistrict, oldWard }
                });
            } else {
                return res.status(404).json({
                    type: 'SPLITTED_NO_MATCH',
                    messageKey: 'ERROR_SPLIT_NO_MATCH'
                });
            }
        } catch (geoError) {
            console.error("Geospatial query error:", geoError);
            return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
        }
    } catch (error) {
        console.error('Lookup error:', error);
        return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
    }
}