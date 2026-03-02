// Vercel Serverless Function - Google Routes API proxy
// Uses Routes API v2 (computeRouteMatrix) replacing legacy Distance Matrix

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { origins, destinations } = req.query;

    if (!origins || !destinations) {
        return res.status(400).json({ error: 'Missing origins or destinations' });
    }

    const GM_KEY = process.env.GMAPS_KEY;
    if (!GM_KEY) {
        return res.status(500).json({ error: 'GMAPS_KEY not configured' });
    }

    // Parse "lat,lng|lat,lng" format into waypoint arrays
    const parsePoints = (str) => str.split('|').map(p => {
        const [lat, lng] = p.split(',').map(Number);
        return { waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } };
    });

    const body = {
        origins: parsePoints(origins),
        destinations: parsePoints(destinations),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
    };

    try {
        const response = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GM_KEY,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,condition'
            },
            body: JSON.stringify(body)
        });

        const rawText = await response.text();
        let routesData;
        try {
            routesData = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({ error: 'Invalid JSON from Routes API', raw: rawText.slice(0, 500) });
        }

        // Debug mode: return raw response
        if (req.query.debug === '1') {
            return res.status(200).json({ raw: routesData, body });
        }

        // Handle API errors
        if (routesData.error) {
            return res.status(response.status).json(routesData);
        }

        // Convert Routes API response to legacy Distance Matrix format
        // so the frontend doesn't need changes
        const origCount = origins.split('|').length;
        const destCount = destinations.split('|').length;

        const rows = [];
        for (let i = 0; i < origCount; i++) {
            const elements = [];
            for (let j = 0; j < destCount; j++) {
                elements.push({ status: 'ZERO_RESULTS' });
            }
            rows.push({ elements });
        }

        // routesData is an array of route matrix entries
        const entries = Array.isArray(routesData) ? routesData : [];
        for (const entry of entries) {
            const oi = entry.originIndex || 0;
            const di = entry.destinationIndex || 0;
            if (oi < origCount && di < destCount) {
                const durationSec = parseInt(entry.duration) || 0;
                const distMeters = entry.distanceMeters || 0;
                rows[oi].elements[di] = {
                    status: 'OK',
                    duration: { value: durationSec, text: `${Math.round(durationSec / 60)} mins` },
                    duration_in_traffic: { value: durationSec, text: `${Math.round(durationSec / 60)} mins` },
                    distance: { value: distMeters, text: `${(distMeters / 1000).toFixed(1)} km` }
                };
            }
        }

        return res.status(200).json({
            status: 'OK',
            origin_addresses: origins.split('|'),
            destination_addresses: destinations.split('|'),
            rows
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
