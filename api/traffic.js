// Vercel Serverless Function - Google Maps Distance Matrix proxy
// Tries Routes API v2 first, falls back to legacy Distance Matrix API

export default async function handler(req, res) {
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

    const GM_KEY = process.env.GMAPS_KEY;
    if (!GM_KEY) {
        return res.status(500).json({ error: 'GMAPS_KEY not configured' });
    }

    // Try Routes API v2 first (new)
    try {
        const result = await tryRoutesAPI(GM_KEY, origins, destinations);
        if (result) return res.status(200).json(result);
    } catch (e) {
        // Routes API failed, try legacy
    }

    // Fallback: legacy Distance Matrix API
    try {
        const result = await tryLegacyAPI(GM_KEY, origins, destinations, mode);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function tryRoutesAPI(key, origins, destinations) {
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

    const response = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,condition'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    // If there's an error (API not enabled, etc), return null to trigger fallback
    if (!Array.isArray(data) || data.length === 0 || data[0].error) {
        return null;
    }

    // Convert to legacy format for frontend compatibility
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

    for (const entry of data) {
        const oi = entry.originIndex || 0;
        const di = entry.destinationIndex || 0;
        if (oi < origCount && di < destCount) {
            // duration comes as "1234s" string
            const durationSec = parseInt(String(entry.duration).replace('s', '')) || 0;
            const distMeters = entry.distanceMeters || 0;
            rows[oi].elements[di] = {
                status: 'OK',
                duration: { value: durationSec, text: `${Math.round(durationSec / 60)} mins` },
                duration_in_traffic: { value: durationSec, text: `${Math.round(durationSec / 60)} mins` },
                distance: { value: distMeters, text: `${(distMeters / 1000).toFixed(1)} km` }
            };
        }
    }

    return {
        status: 'OK',
        origin_addresses: origins.split('|'),
        destination_addresses: destinations.split('|'),
        rows
    };
}

async function tryLegacyAPI(key, origins, destinations, mode) {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origins);
    url.searchParams.set('destinations', destinations);
    url.searchParams.set('departure_time', 'now');
    url.searchParams.set('traffic_model', 'best_guess');
    url.searchParams.set('mode', mode || 'driving');
    url.searchParams.set('key', key);

    const response = await fetch(url.toString());
    return await response.json();
}
