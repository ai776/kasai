export default function handler(req, res) {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエストに対応
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GETリクエストでAPIキーを返す
    if (req.method === 'GET') {
        const apiKey = process.env.DIFY_API_KEY;
        
        if (!apiKey) {
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        res.status(200).json({ 
            DIFY_API_KEY: apiKey 
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}