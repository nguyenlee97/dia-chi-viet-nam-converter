// scripts/import-to-mongo.js
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

// This script reads your large JSON, transforms it, SIMPLIFIES GEOMETRIES,
// and uploads it to your MongoDB Atlas database.
// RUN THIS SCRIPT ONCE to populate your database.

const originalDataPath = path.join(process.cwd(), 'wards_tree_with_geo.json');
const rawData = fs.readFileSync(originalDataPath, 'utf8');
const provincesData = JSON.parse(rawData);

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'address_data';
const COLLECTION_NAME = 'wards';

if (!MONGODB_URI) {
  console.error('❌ Error: VITE_MONGODB_URI is not defined in your environment variables.');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas');

    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    console.log('🧹 Clearing existing documents in the collection...');
    await collection.deleteMany({});
    console.log('✅ Existing documents cleared.');

    const transformedWards = [];

    for (const province of provincesData) {
      for (const district of province.old_district_list) {
        for (const ward of district.old_ward_list) {
          const wardDocument = {
            old_province_name: province.old_province_name,
            old_district_name: district.old_district_name,
            old_ward_name: ward.old_ward_name,
            is_splitted: ward.is_splitted,
            new_address: ward.new_address,
            geo: null,
          };

          if (ward.is_splitted && ward.new_address.new_ward_name) {
            const geometries = ward.new_address.new_ward_name
              .map(newWard => {
                // Basic validation
                if (!newWard.new_ward_coordinate || newWard.new_ward_coordinate.length === 0) {
                  return null;
                }

                try {
                  // --- 🚀 GEOSPATIAL SIMPLIFICATION START 🚀 ---
                  const originalPolygon = turf.multiPolygon(newWard.new_ward_coordinate);
                  
                  // Tolerance determines how much to simplify. Higher number = more simplification.
                  // 0.0001 is ~11 meters. This is a good starting point to significantly reduce
                  // vertex count without losing too much geographic detail.
                  const simplificationOptions = { tolerance: 0.0001, highQuality: false };
                  const simplifiedPolygon = turf.simplify(originalPolygon, simplificationOptions);
                  // --- 🚀 GEOSPATIAL SIMPLIFICATION END 🚀 ---

                  return {
                    type: 'MultiPolygon',
                    // Use the simplified coordinates for the indexed 'geo' field
                    coordinates: simplifiedPolygon.geometry.coordinates,
                    properties: {
                      new_ward_name: newWard.new_ward_name,
                      old_merge_ward: newWard.old_merge_ward,
                      new_ward_bbox: newWard.new_ward_bbox
                    }
                  };
                } catch (e) {
                    console.warn(`⚠️  Could not process geometry for ${newWard.new_ward_name}. Skipping. Error: ${e.message}`);
                    return null;
                }
              })
              .filter(g => g !== null); // Filter out any failed conversions

            if (geometries.length > 0) {
              wardDocument.geo = {
                type: 'GeometryCollection',
                geometries: geometries,
              };
            }
          }
          transformedWards.push(wardDocument);
        }
      }
    }
    
    console.log(`✨ Transformed ${transformedWards.length} ward documents.`);

    if (transformedWards.length > 0) {
        console.log('📦 Inserting documents into MongoDB... (this may take a moment)');
        const result = await collection.insertMany(transformedWards, { ordered: false });
        console.log(`🚀 Successfully inserted ${result.insertedCount} documents.`);
    }

    console.log('⚡ Creating compound index for address lookups...');
    await collection.createIndex({
        old_province_name: 1,
        old_district_name: 1,
        old_ward_name: 1,
    });
    console.log('✅ Compound index created.');

    console.log('🌍 Creating 2dsphere index for geospatial queries...');
    await collection.createIndex({ geo: "2dsphere" });
    console.log('✅ Geospatial index created successfully!');

    console.log('\n🎉 Database setup and data migration complete!');

  } catch (err) {
    console.error('❌ An error occurred during migration:', err);
  } finally {
    await client.close();
    console.log('🔌 Connection to MongoDB closed.');
  }
}

// HOW TO RUN:
// `node -r dotenv/config scripts/import-to-mongo.js dotenv_config_path=.env.local`
run().catch(console.dir);