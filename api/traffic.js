// Vercel Serverless Function - Google Maps Distance Matrix proxy
// Avoids CORS issues when calling from browser

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { origins, destinations, mode } = req.query;

    if (!origins || !destinations) {
        return res.status(400).json({ error: 'Missing origins or destinations' });
    }

    const GM_KEY = process.env.GMAPS_KEY || '***REDACTED***';

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origins);
    url.searchParams.set('destinations', destinations);
    url.searchParams.set('departure_time', 'now');
    url.searchParams.set('traffic_model', 'best_guess');
    url.searchParams.set('mode', mode || 'driving');
    url.searchParams.set('key', GM_KEY);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
