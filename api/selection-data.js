// api/selection-data.js
import fs from 'fs';
import path from 'path';

// --- PERFORMANCE FIX: Load and parse data ONCE, outside the handler ---
// This code runs only when the serverless function initializes (cold start).
// The 'selectionTree' variable will be cached in memory for all subsequent
// "warm" requests, making them incredibly fast.
let selectionTree = null;
try {
    const dataPath = path.resolve('./api/_data/selection_tree.json');
    const fileContents = fs.readFileSync(dataPath, 'utf-8');
    selectionTree = JSON.parse(fileContents);
    console.log("✅ Selection tree data loaded and cached in memory.");
} catch (error) {
    console.error("❌ Failed to load or parse selection_tree.json:", error);
    // If the data fails to load, the function will fail, which is intended.
}
// --- END PERFORMANCE FIX ---

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ messageKey: 'ERROR_METHOD_NOT_ALLOWED' });
    }

    if (!selectionTree) {
        // This will only happen if the initial load failed.
        return res.status(500).json({ messageKey: 'ERROR_UNKNOWN', details: "Server data is not available." });
    }

    try {
        res.status(200).json(selectionTree);
    } catch (error) {
        // This catch block is for very rare cases, like network errors during response sending.
        console.error('Error sending selection data:', error);
        res.status(500).json({ messageKey: 'ERROR_UNKNOWN' });
    }
}