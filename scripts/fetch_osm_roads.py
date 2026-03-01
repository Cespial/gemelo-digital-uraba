"""
Fetch road network from OpenStreetMap Overpass API for Uraba region.
Bounding box: Chigorodo (south) to Turbo/Puerto Antioquia (north)

Source: OpenStreetMap via Overpass API
"""
import json
import urllib.request

BBOX = "7.60,-76.85,8.10,-76.50"

QUERY = f"""
[out:json][timeout:60];
(
  way["highway"~"primary|secondary|tertiary|trunk"]({BBOX});
);
out body;
>;
out skel qt;
"""

def fetch_roads():
    url = "https://overpass-api.de/api/interpreter"
    data = f"data={QUERY}".encode()
    req = urllib.request.Request(url, data=data, method="POST")

    print("Fetching OSM roads for Uraba region...")
    response = urllib.request.urlopen(req, timeout=60)
    result = json.loads(response.read())

    elements = result.get("elements", [])
    nodes = {e["id"]: e for e in elements if e["type"] == "node"}
    ways = [e for e in elements if e["type"] == "way"]

    print(f"Found {len(ways)} road segments, {len(nodes)} nodes")

    # Convert to GeoJSON
    features = []
    for way in ways:
        coords = []
        for nid in way.get("nodes", []):
            if nid in nodes:
                n = nodes[nid]
                coords.append([n["lon"], n["lat"]])

        if len(coords) >= 2:
            tags = way.get("tags", {})
            features.append({
                "type": "Feature",
                "properties": {
                    "highway": tags.get("highway", "unknown"),
                    "name": tags.get("name", ""),
                    "ref": tags.get("ref", ""),
                    "surface": tags.get("surface", ""),
                    "osm_id": way["id"]
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                }
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "source": "OpenStreetMap via Overpass API",
            "bbox": BBOX,
            "road_types": "primary, secondary, tertiary, trunk",
            "total_ways": len(ways),
            "total_features": len(features)
        }
    }

    outpath = "/Users/cristianespinal/gemelo-digital-uraba/data/osm_roads.geojson"
    with open(outpath, "w") as f:
        json.dump(geojson, f)

    print(f"Saved to {outpath}")

    # Summary by road type
    from collections import Counter
    types = Counter(f["properties"]["highway"] for f in features)
    for t, c in types.most_common():
        print(f"  {t}: {c} segments")

if __name__ == "__main__":
    fetch_roads()
