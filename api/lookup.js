import { checkRateLimit } from './_lib/rate-limiter.js';
import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

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
        // Load the detailed ward data
        const dataPath = path.resolve('./api/_data/detailed_ward_data.json');
        const detailedWardDataArray = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const detailedWardMap = new Map(detailedWardDataArray);
        
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

        // Real geospatial matching using Turf.js
        const userPoint = turf.point([userCoordinates.lon, userCoordinates.lat]);
        const splittedWards = wardData.new_address.new_ward_name;
        let foundWard = null;

        for (const newWard of splittedWards) {
            try {
                const wardPolygon = turf.multiPolygon(newWard.new_ward_coordinate);
                if (turf.booleanPointInPolygon(userPoint, wardPolygon)) {
                    foundWard = newWard;
                    break;
                }
            } catch (geoError) {
                console.error('Geospatial error for ward:', newWard.new_ward_name, geoError);
                continue;
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
    } catch (error) {
        console.error('Lookup error:', error);
        return res.status(500).json({ messageKey: 'ERROR_SERVER_GEO' });
    }
}