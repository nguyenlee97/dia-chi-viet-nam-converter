import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ messageKey: 'ERROR_METHOD_NOT_ALLOWED' });
    }

    try {
        // Load the pre-processed selection tree data
        const dataPath = path.resolve('./api/_data/selection_tree.json');
        const selectionTreeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        
        res.status(200).json(selectionTreeData);
    } catch (error) {
        console.error('Error loading selection data:', error);
        res.status(500).json({ messageKey: 'ERROR_UNKNOWN' });
    }
}