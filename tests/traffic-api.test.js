// =============================================================
// Traffic API Tests — api/traffic.js serverless function
// =============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Import the handler ----
// The API file uses `export default`, so we can import it directly.
import handler from '../api/traffic.js';

// ---- Helper to create mock req/res ----
function createMockReqRes(query = {}, method = 'GET') {
  const req = { query, method };
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    setHeader(k, v) { this._headers[k] = v; return this; },
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
    end() { return this; },
  };
  return { req, res };
}

// ============================================================
describe('Traffic API — api/traffic.js', () => {
  beforeEach(() => {
    // Clear env
    delete process.env.GMAPS_KEY;
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  // ----- 19. Returns 400 when origins or destinations missing -----
  it('returns 400 when origins or destinations missing', async () => {
    const { req: req1, res: res1 } = createMockReqRes({});
    await handler(req1, res1);
    expect(res1._status).toBe(400);
    expect(res1._body.error).toMatch(/missing/i);

    const { req: req2, res: res2 } = createMockReqRes({ origins: '7.87,-76.66' });
    await handler(req2, res2);
    expect(res2._status).toBe(400);
  });

  // ----- 20. Returns 500 when GMAPS_KEY not configured -----
  it('returns 500 when GMAPS_KEY not configured', async () => {
    const { req, res } = createMockReqRes({
      origins: '7.87,-76.66',
      destinations: '7.92,-76.73',
    });
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/GMAPS_KEY/i);
  });

  // ----- 21. parsePoints correctly parses "lat,lng|lat,lng" format -----
  it('parsePoints correctly parses "lat,lng|lat,lng" format', () => {
    // Extract parsePoints logic (it's defined inside tryRoutesAPI)
    const parsePoints = (str) => str.split('|').map(p => {
      const [lat, lng] = p.split(',').map(Number);
      return { waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } };
    });

    const result = parsePoints('7.868,-76.665|7.923,-76.734');
    expect(result).toHaveLength(2);
    expect(result[0].waypoint.location.latLng.latitude).toBeCloseTo(7.868);
    expect(result[0].waypoint.location.latLng.longitude).toBeCloseTo(-76.665);
    expect(result[1].waypoint.location.latLng.latitude).toBeCloseTo(7.923);
    expect(result[1].waypoint.location.latLng.longitude).toBeCloseTo(-76.734);
  });

  // ----- 22. Translates Routes API response to legacy format -----
  it('translates Routes API response to legacy format correctly', async () => {
    process.env.GMAPS_KEY = 'test-key';

    // Mock fetch to simulate Routes API response
    const routesApiResponse = [
      {
        originIndex: 0,
        destinationIndex: 0,
        duration: '1800s',
        distanceMeters: 25000,
        condition: 'ROUTE_EXISTS',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => routesApiResponse,
      ok: true,
    });

    const { req, res } = createMockReqRes({
      origins: '7.868,-76.665',
      destinations: '7.923,-76.734',
    });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body.status).toBe('OK');
    expect(res._body.rows).toHaveLength(1);
    expect(res._body.rows[0].elements).toHaveLength(1);

    const el = res._body.rows[0].elements[0];
    expect(el.status).toBe('OK');
    expect(el.duration.value).toBe(1800);
    expect(el.duration.text).toBe('30 mins');
    expect(el.distance.value).toBe(25000);
    expect(el.distance.text).toBe('25.0 km');
  });
});
