// api/_lib/db.js
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'address_data';

if (!MONGODB_URI) {
  throw new Error('Please define the VITE_MONGODB_URI environment variable');
}

// Create a cached connection promise
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI);
  cachedClient = await client.connect();
  
  console.log("⚡️ New MongoDB connection established.");
  
  return cachedClient;
}

export async function getDb() {
  const client = await connectToDatabase();
  return client.db(DB_NAME);
}

export async function getWardsCollection() {
    const db = await getDb();
    return db.collection('wards');
}