#!/usr/bin/env python3
"""
Comprehensive analysis of OSRM route data and farm locations
for the Gemelo Digital Uraba project.
"""

import json
import math
import sys

# ============================================================
# 1. DATA EXTRACTION
# ============================================================

FARMS = [
    {"id":"F01","name":"La Sierra","lat":7.7920,"lng":-76.6480,"prod":7200,"cl":"sur"},
    {"id":"F02","name":"Villa Fresia","lat":7.7780,"lng":-76.6620,"prod":5100,"cl":"sur"},
    {"id":"F03","name":"El Retiro","lat":7.7650,"lng":-76.6530,"prod":4800,"cl":"sur"},
    {"id":"F04","name":"Santa Ana","lat":7.8050,"lng":-76.6380,"prod":6500,"cl":"sur"},
    {"id":"F05","name":"La Esperanza","lat":7.7890,"lng":-76.6750,"prod":5900,"cl":"sur"},
    {"id":"F06","name":"El Paraiso","lat":7.8400,"lng":-76.6350,"prod":6100,"cl":"central"},
    {"id":"F07","name":"La Fortuna","lat":7.8550,"lng":-76.6500,"prod":5500,"cl":"central"},
    {"id":"F08","name":"San Jose","lat":7.8620,"lng":-76.6280,"prod":4900,"cl":"central"},
    {"id":"F09","name":"Chinita","lat":7.8950,"lng":-76.6580,"prod":7800,"cl":"norte"},
    {"id":"F10","name":"Santa Marta","lat":7.9050,"lng":-76.6720,"prod":6700,"cl":"norte"},
    {"id":"F11","name":"La Llave","lat":7.9150,"lng":-76.6450,"prod":5400,"cl":"norte"},
    {"id":"F12","name":"El Progreso","lat":7.9280,"lng":-76.6600,"prod":4600,"cl":"norte"},
    {"id":"F13","name":"Las Dunas","lat":7.8720,"lng":-76.6780,"prod":6300,"cl":"hub"},
    {"id":"F14","name":"Oasis","lat":7.8580,"lng":-76.6700,"prod":5800,"cl":"hub"},
    {"id":"F15","name":"Guadalupe","lat":7.8800,"lng":-76.6850,"prod":6000,"cl":"hub"},
    {"id":"F16","name":"El Eden","lat":7.8650,"lng":-76.6900,"prod":5200,"cl":"hub"},
    {"id":"F17","name":"Monteverde","lat":7.8300,"lng":-76.6650,"prod":4500,"cl":"central"},
    {"id":"F18","name":"Bella Vista","lat":7.8100,"lng":-76.6800,"prod":5600,"cl":"sur"},
    {"id":"F19","name":"Los Almendros","lat":7.8450,"lng":-76.6950,"prod":5100,"cl":"central"},
    {"id":"F20","name":"Rio Claro","lat":7.8750,"lng":-76.6400,"prod":4800,"cl":"hub"},
]

HUB = {"lat": 7.8680, "lng": -76.6650}
PUERTO = {"lat": 7.9230, "lng": -76.7341}

# Route data (coordinates are [lat, lng])
R = {
    "hp":{"d":25.38,"t":34.8,"c":[[7.867637,-76.665365],[7.867191,-76.65854],[7.868556,-76.652128],[7.903174,-76.64037],[7.913967,-76.624772],[7.914028,-76.623684],[7.928845,-76.621019],[7.938495,-76.622796],[7.930444,-76.62485],[7.938252,-76.67202],[7.93271,-76.713427],[7.933212,-76.71583],[7.931448,-76.717956],[7.93332,-76.72237],[7.930898,-76.728431],[7.923281,-76.734233]]},
    "F01":{"h":{"d":11.53,"t":14.1,"c":[[7.792164,-76.648589],[7.80055,-76.651911],[7.821102,-76.649313],[7.846605,-76.642488],[7.851567,-76.643896],[7.866698,-76.652153],[7.867585,-76.665313],[7.867637,-76.665365]]},"p":{"d":33.71,"t":41.0,"c":[[7.792164,-76.648589],[7.823728,-76.648609],[7.851333,-76.642019],[7.893182,-76.651499],[7.914951,-76.628892],[7.924372,-76.6214],[7.938594,-76.62277],[7.930811,-76.627195],[7.933979,-76.709673],[7.931035,-76.72829],[7.923281,-76.734233]]}},
    "F02":{"h":{"d":16.47,"t":15.1,"c":[[7.778301,-76.658089],[7.786497,-76.653904],[7.792041,-76.663255],[7.830966,-76.652953],[7.851526,-76.641756],[7.858883,-76.648643],[7.867428,-76.665045],[7.867637,-76.665365]]},"p":{"d":38.65,"t":41.9,"c":[[7.778301,-76.658089],[7.786744,-76.654204],[7.830966,-76.652953],[7.851905,-76.644461],[7.904599,-76.639177],[7.927156,-76.621148],[7.935141,-76.700181],[7.933281,-76.722132],[7.923281,-76.734233]]}},
    "F03":{"h":{"d":16.01,"t":16.4,"c":[[7.765413,-76.652014],[7.786105,-76.653924],[7.803849,-76.662233],[7.83078,-76.65329],[7.851219,-76.641277],[7.868556,-76.652128],[7.867428,-76.665045],[7.867637,-76.665365]]},"p":{"d":38.19,"t":43.3,"c":[[7.765413,-76.652014],[7.786724,-76.65414],[7.830287,-76.653851],[7.851526,-76.641756],[7.894159,-76.651],[7.913923,-76.624672],[7.935658,-76.62204],[7.933979,-76.709673],[7.93334,-76.722782],[7.923281,-76.734233]]}},
    "F04":{"h":{"d":11.36,"t":16.1,"c":[[7.802548,-76.636945],[7.802333,-76.651045],[7.821102,-76.649313],[7.84527,-76.642842],[7.851333,-76.642019],[7.868507,-76.653],[7.867585,-76.665313],[7.867637,-76.665365]]},"p":{"d":33.54,"t":43.0,"c":[[7.802548,-76.636945],[7.806712,-76.651168],[7.846605,-76.642488],[7.896511,-76.646916],[7.91386,-76.624584],[7.92834,-76.621019],[7.932429,-76.714257],[7.933281,-76.722132],[7.923281,-76.734233]]}},
    "F05":{"h":{"d":16.96,"t":18.7,"c":[[7.789959,-76.679321],[7.791223,-76.662505],[7.808873,-76.659422],[7.83031,-76.647113],[7.851219,-76.641277],[7.865773,-76.652073],[7.867478,-76.663228],[7.867637,-76.665365]]},"p":{"d":39.14,"t":45.6,"c":[[7.789959,-76.679321],[7.786608,-76.654849],[7.831375,-76.651784],[7.851155,-76.642145],[7.896194,-76.647721],[7.913865,-76.623607],[7.936979,-76.622213],[7.934013,-76.70954],[7.925452,-76.731799],[7.923281,-76.734233]]}},
    "F06":{"h":{"d":4.99,"t":6.9,"c":[[7.845431,-76.639843],[7.851388,-76.641344],[7.858883,-76.648643],[7.868556,-76.652128],[7.867308,-76.656286],[7.867176,-76.66159],[7.867637,-76.665365]]},"p":{"d":27.17,"t":33.8,"c":[[7.845431,-76.639843],[7.852368,-76.645013],[7.895533,-76.649323],[7.914883,-76.629391],[7.927373,-76.621125],[7.93867,-76.622701],[7.938252,-76.67202],[7.932548,-76.713905],[7.933366,-76.724131],[7.923281,-76.734233]]}},
    "F07":{"h":{"d":3.07,"t":5.5,"c":[[7.856814,-76.65035],[7.858883,-76.648643],[7.868556,-76.652128],[7.867308,-76.656286],[7.867212,-76.659248],[7.867478,-76.663228],[7.867637,-76.665365]]},"p":{"d":25.25,"t":32.4,"c":[[7.856814,-76.65035],[7.892103,-76.651756],[7.91386,-76.624584],[7.914028,-76.623684],[7.92834,-76.621019],[7.930383,-76.624149],[7.936514,-76.661422],[7.934013,-76.70954],[7.933294,-76.724511],[7.923281,-76.734233]]}},
    "F08":{"h":{"d":6.35,"t":8.9,"c":[[7.863039,-76.630586],[7.858141,-76.639359],[7.851473,-76.641852],[7.851905,-76.644461],[7.865773,-76.652073],[7.867063,-76.656995],[7.867478,-76.663228],[7.867637,-76.665365]]},"p":{"d":23.3,"t":33.6,"c":[[7.863039,-76.630586],[7.881656,-76.632809],[7.898121,-76.62827],[7.91322,-76.623997],[7.935658,-76.62204],[7.930873,-76.627568],[7.935114,-76.700425],[7.932602,-76.716411],[7.933294,-76.724511],[7.923281,-76.734233]]}},
    "F09":{"h":{"d":4.74,"t":7.3,"c":[[7.891527,-76.657772],[7.890922,-76.651825],[7.868556,-76.652128],[7.867308,-76.656286],[7.867212,-76.659248],[7.867478,-76.663228],[7.867637,-76.665365]]},"p":{"d":21.98,"t":30.7,"c":[[7.891527,-76.657772],[7.896724,-76.646521],[7.914951,-76.628892],[7.924372,-76.6214],[7.936979,-76.622213],[7.930811,-76.627195],[7.935429,-76.697584],[7.93332,-76.72237],[7.923281,-76.734233]]}},
    "F10":{"h":{"d":19.44,"t":28.0,"c":[[7.900451,-76.666299],[7.918788,-76.665153],[7.932793,-76.639138],[7.930444,-76.62485],[7.922637,-76.621657],[7.914951,-76.628892],[7.892103,-76.651756],[7.868137,-76.654505],[7.867478,-76.663228],[7.867637,-76.665365]]},"p":{"d":13.18,"t":27.6,"c":[[7.900451,-76.666299],[7.91845,-76.665225],[7.936514,-76.661422],[7.935807,-76.694073],[7.932429,-76.714257],[7.933281,-76.722132],[7.925657,-76.731396],[7.923281,-76.734233]]}},
    "F11":{"h":{"d":6.33,"t":7.8,"c":[[7.905158,-76.642151],[7.903174,-76.64037],[7.894159,-76.651],[7.868556,-76.652128],[7.867308,-76.656286],[7.867329,-76.660632],[7.867404,-76.66399],[7.867637,-76.665365]]},"p":{"d":19.68,"t":28.6,"c":[[7.905158,-76.642151],[7.91386,-76.624584],[7.913865,-76.623607],[7.927156,-76.621148],[7.938543,-76.62237],[7.930811,-76.627195],[7.935807,-76.694073],[7.932548,-76.713905],[7.932585,-76.720301],[7.923281,-76.734233]]}},
    "F12":{"h":{"d":16.08,"t":19.6,"c":[[7.929652,-76.659304],[7.936514,-76.661422],[7.930383,-76.624149],[7.922637,-76.621657],[7.914154,-76.624208],[7.89752,-76.64548],[7.868556,-76.652128],[7.867346,-76.66277],[7.867637,-76.665365]]},"p":{"d":9.82,"t":19.2,"c":[[7.929652,-76.659304],[7.935999,-76.661548],[7.938245,-76.672621],[7.934218,-76.708478],[7.932557,-76.716471],[7.93334,-76.722782],[7.931475,-76.72783],[7.923281,-76.734233]]}},
    "F13":{"h":{"d":2.33,"t":7.4,"c":[[7.869775,-76.677444],[7.864918,-76.67122],[7.864603,-76.66836],[7.865877,-76.666402],[7.867465,-76.665213],[7.867637,-76.665365]]},"p":{"d":27.64,"t":41.8,"c":[[7.869775,-76.677444],[7.865877,-76.666402],[7.867611,-76.659959],[7.906112,-76.637918],[7.913599,-76.623633],[7.927833,-76.621069],[7.938216,-76.622749],[7.934218,-76.708478],[7.93334,-76.722782],[7.923281,-76.734233]]}},
    "F14":{"h":{"d":1.27,"t":5.0,"c":[[7.857752,-76.669758],[7.860773,-76.667959],[7.863745,-76.666779],[7.866747,-76.666079],[7.867465,-76.665213],[7.867637,-76.665365]]},"p":{"d":26.58,"t":39.5,"c":[[7.857752,-76.669758],[7.867163,-76.665542],[7.867063,-76.656995],[7.895533,-76.649323],[7.914951,-76.628892],[7.914275,-76.623716],[7.932851,-76.621626],[7.936514,-76.661422],[7.933089,-76.715993],[7.932957,-76.72533],[7.923281,-76.734233]]}},
    "F15":{"h":{"d":23.98,"t":39.4,"c":[[7.882613,-76.688401],[7.892481,-76.687167],[7.892107,-76.67235],[7.911321,-76.664719],[7.935632,-76.656115],[7.930375,-76.624345],[7.914899,-76.628174],[7.892103,-76.651756],[7.867176,-76.66159],[7.867637,-76.665365]]},"p":{"d":17.72,"t":38.9,"c":[[7.882613,-76.688401],[7.892204,-76.673766],[7.900586,-76.663689],[7.91863,-76.665187],[7.938245,-76.672621],[7.933755,-76.710337],[7.932795,-76.716213],[7.932639,-76.720488],[7.928205,-76.73072],[7.923281,-76.734233]]}},
    "F16":{"h":{"d":3.36,"t":10.6,"c":[[7.862342,-76.687823],[7.863474,-76.683078],[7.864635,-76.679628],[7.867152,-76.679066],[7.864918,-76.67122],[7.864578,-76.666666],[7.867465,-76.665213],[7.867637,-76.665365]]},"p":{"d":28.66,"t":45.0,"c":[[7.862342,-76.687823],[7.867152,-76.679066],[7.864578,-76.666666],[7.867346,-76.66277],[7.906112,-76.637918],[7.913951,-76.623637],[7.932793,-76.621617],[7.9382,-76.671433],[7.932401,-76.714398],[7.933281,-76.722132],[7.923281,-76.734233]]}},
    "F17":{"h":{"d":8.42,"t":11.1,"c":[[7.834712,-76.66259],[7.83078,-76.65329],[7.830723,-76.646699],[7.847899,-76.642145],[7.851333,-76.642019],[7.865773,-76.652073],[7.867186,-76.661053],[7.867637,-76.665365]]},"p":{"d":30.6,"t":37.9,"c":[[7.834712,-76.66259],[7.831626,-76.646459],[7.851505,-76.641485],[7.864944,-76.651869],[7.913653,-76.624438],[7.927833,-76.621069],[7.930873,-76.627568],[7.934013,-76.70954],[7.933178,-76.724816],[7.923281,-76.734233]]}},
    "F18":{"h":{"d":17.27,"t":18.4,"c":[[7.804437,-76.685327],[7.795566,-76.67063],[7.791121,-76.662113],[7.792041,-76.663255],[7.830438,-76.653695],[7.849741,-76.641657],[7.864944,-76.651869],[7.867531,-76.663614],[7.867637,-76.665365]]},"p":{"d":39.45,"t":45.2,"c":[[7.804437,-76.685327],[7.787519,-76.654312],[7.829171,-76.654571],[7.851505,-76.641485],[7.89121,-76.651815],[7.914899,-76.628174],[7.931858,-76.62147],[7.934118,-76.70912],[7.924945,-76.732485],[7.923281,-76.734233]]}},
    "F19":{"h":{"d":22.45,"t":30.3,"c":[[7.835807,-76.694891],[7.820289,-76.683535],[7.806815,-76.689609],[7.794242,-76.668495],[7.805695,-76.661404],[7.830438,-76.653695],[7.847899,-76.642145],[7.867308,-76.656286],[7.867637,-76.665365]]},"p":{"d":44.63,"t":57.2,"c":[[7.835807,-76.694891],[7.811852,-76.688076],[7.791223,-76.662505],[7.829171,-76.654571],[7.851905,-76.644461],[7.914212,-76.630953],[7.938313,-76.622348],[7.932648,-76.715045],[7.923281,-76.734233]]}},
    "F20":{"h":{"d":7.17,"t":9.2,"c":[[7.875943,-76.639614],[7.858141,-76.639359],[7.851905,-76.644461],[7.868556,-76.652128],[7.867063,-76.656995],[7.867176,-76.66159],[7.867637,-76.665365]]},"p":{"d":22.02,"t":32.3,"c":[[7.875943,-76.639614],[7.884215,-76.632167],[7.903352,-76.626801],[7.913775,-76.623596],[7.938706,-76.622604],[7.937667,-76.668531],[7.933755,-76.710337],[7.932222,-76.727043],[7.923281,-76.734233]]}},
}

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def haversine_km(lat1, lon1, lat2, lon2):
    """Haversine distance in km between two points."""
    R_EARTH = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R_EARTH * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def point_to_segment_distance_km(plat, plng, alat, alng, blat, blng):
    """Minimum distance from point (plat,plng) to line segment (a->b), in km.
    Uses a flat-earth approximation for projection (valid at this scale)."""
    # Convert to approximate meters (at this latitude, 1 deg lat ~ 111km, 1 deg lng ~ 111*cos(lat) km)
    cos_lat = math.cos(math.radians(plat))

    # Work in a local coordinate system (km)
    px = (plng - alng) * 111.32 * cos_lat
    py = (plat - alat) * 111.32
    bx = (blng - alng) * 111.32 * cos_lat
    by = (blat - alat) * 111.32

    seg_len_sq = bx*bx + by*by
    if seg_len_sq < 1e-12:
        return math.sqrt(px*px + py*py)

    t = max(0, min(1, (px*bx + py*by) / seg_len_sq))
    proj_x = t * bx
    proj_y = t * by
    dx = px - proj_x
    dy = py - proj_y
    return math.sqrt(dx*dx + dy*dy)

def compute_route_distance_km(coords):
    """Sum of haversine distances between consecutive route points."""
    total = 0
    for i in range(len(coords) - 1):
        total += haversine_km(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    return total

# ============================================================
# LOAD OSM ROADS
# ============================================================
print("=" * 80)
print("OSRM ROUTE & FARM LOCATION ANALYSIS")
print("Gemelo Digital Uraba")
print("=" * 80)

osm_roads_path = "/Users/cristianespinal/gemelo-digital-uraba/data/osm_roads.geojson"
with open(osm_roads_path, 'r') as f:
    osm_data = json.load(f)

road_segments = []  # Each is a list of [lng, lat] pairs
for feat in osm_data['features']:
    if feat['geometry']['type'] == 'LineString':
        coords = feat['geometry']['coordinates']  # [lng, lat]
        for i in range(len(coords) - 1):
            road_segments.append((
                coords[i][1], coords[i][0],   # lat, lng of point A
                coords[i+1][1], coords[i+1][0] # lat, lng of point B
            ))
    elif feat['geometry']['type'] == 'MultiLineString':
        for line in feat['geometry']['coordinates']:
            for i in range(len(line) - 1):
                road_segments.append((
                    line[i][1], line[i][0],
                    line[i+1][1], line[i+1][0]
                ))

print(f"\nLoaded {len(osm_data['features'])} OSM road features -> {len(road_segments)} line segments")

# ============================================================
# ANALYSIS 2: FARM PROXIMITY TO ROADS
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 2: FARM PROXIMITY TO NEAREST OSM ROAD")
print("=" * 80)
print(f"{'Farm':<6} {'Name':<16} {'Lat':>8} {'Lng':>10} {'Min Dist (m)':>12} {'Status'}")
print("-" * 70)

farm_road_issues = []
for farm in FARMS:
    min_dist = float('inf')
    for seg in road_segments:
        d = point_to_segment_distance_km(farm['lat'], farm['lng'], seg[0], seg[1], seg[2], seg[3])
        if d < min_dist:
            min_dist = d
    min_dist_m = min_dist * 1000

    status = "OK" if min_dist_m < 500 else ("WARNING" if min_dist_m < 1500 else "FAR FROM ROAD")
    if min_dist_m >= 500:
        farm_road_issues.append((farm, min_dist_m, status))
    print(f"{farm['id']:<6} {farm['name']:<16} {farm['lat']:>8.4f} {farm['lng']:>10.4f} {min_dist_m:>12.0f} {status}")

# ============================================================
# ANALYSIS 3: ROUTE START POINTS VS FARM COORDINATES
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 3: ROUTE STARTING POINTS vs FARM COORDINATES")
print("=" * 80)
print("Checks if the first coordinate of each route matches the farm location.")
print(f"{'Farm':<6} {'Name':<16} {'Farm Lat':>9} {'Farm Lng':>10} {'Route Start Lat':>15} {'Route Start Lng':>16} {'Dist (m)':>10} {'Match?'}")
print("-" * 100)

start_issues = []
for farm in FARMS:
    route = R[farm['id']]
    # Check hub route start
    h_start = route['h']['c'][0]
    h_dist = haversine_km(farm['lat'], farm['lng'], h_start[0], h_start[1]) * 1000
    # Check port route start
    p_start = route['p']['c'][0]
    p_dist = haversine_km(farm['lat'], farm['lng'], p_start[0], p_start[1]) * 1000

    h_match = "OK" if h_dist < 300 else "MISMATCH"
    p_match = "OK" if p_dist < 300 else "MISMATCH"

    # Hub route
    print(f"{farm['id']:<6} {farm['name']:<16} {farm['lat']:>9.4f} {farm['lng']:>10.4f} {h_start[0]:>15.6f} {h_start[1]:>16.6f} {h_dist:>10.0f} Hub:{h_match}")
    # Port route (same start, usually)
    if abs(h_start[0] - p_start[0]) > 0.0001 or abs(h_start[1] - p_start[1]) > 0.0001:
        print(f"{'':>6} {'(port route)':>16} {'':>9} {'':>10} {p_start[0]:>15.6f} {p_start[1]:>16.6f} {p_dist:>10.0f} Port:{p_match}")

    if h_dist >= 300 or p_dist >= 300:
        start_issues.append((farm, h_dist, p_dist))

# ============================================================
# ANALYSIS 4: ROUTE ENDPOINTS vs HUB AND PUERTO
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 4: ROUTE ENDPOINTS vs HUB / PUERTO COORDINATES")
print("=" * 80)

# Hub-Puerto route
hp_route = R['hp']
hp_start = hp_route['c'][0]
hp_end = hp_route['c'][-1]
hp_start_dist = haversine_km(HUB['lat'], HUB['lng'], hp_start[0], hp_start[1]) * 1000
hp_end_dist = haversine_km(PUERTO['lat'], PUERTO['lng'], hp_end[0], hp_end[1]) * 1000

print(f"\nHub-Puerto Route:")
print(f"  Start: [{hp_start[0]:.6f}, {hp_start[1]:.6f}]  vs Hub [{HUB['lat']}, {HUB['lng']}] -> dist = {hp_start_dist:.0f} m  {'OK' if hp_start_dist < 300 else 'MISMATCH'}")
print(f"  End:   [{hp_end[0]:.6f}, {hp_end[1]:.6f}]  vs Puerto [{PUERTO['lat']}, {PUERTO['lng']}] -> dist = {hp_end_dist:.0f} m  {'OK' if hp_end_dist < 300 else 'MISMATCH'}")

print(f"\nFarm->Hub routes (should end at Hub {HUB['lat']}, {HUB['lng']}):")
print(f"{'Farm':<6} {'Route End Lat':>14} {'Route End Lng':>14} {'Dist to Hub (m)':>16} {'Status'}")
print("-" * 60)

hub_end_issues = []
for farm in FARMS:
    h_end = R[farm['id']]['h']['c'][-1]
    dist = haversine_km(HUB['lat'], HUB['lng'], h_end[0], h_end[1]) * 1000
    status = "OK" if dist < 300 else "MISMATCH"
    if dist >= 300:
        hub_end_issues.append((farm, dist))
    print(f"{farm['id']:<6} {h_end[0]:>14.6f} {h_end[1]:>14.6f} {dist:>16.0f} {status}")

print(f"\nFarm->Puerto routes (should end at Puerto {PUERTO['lat']}, {PUERTO['lng']}):")
print(f"{'Farm':<6} {'Route End Lat':>14} {'Route End Lng':>14} {'Dist to Puerto (m)':>19} {'Status'}")
print("-" * 65)

puerto_end_issues = []
for farm in FARMS:
    p_end = R[farm['id']]['p']['c'][-1]
    dist = haversine_km(PUERTO['lat'], PUERTO['lng'], p_end[0], p_end[1]) * 1000
    status = "OK" if dist < 300 else "MISMATCH"
    if dist >= 300:
        puerto_end_issues.append((farm, dist))
    print(f"{farm['id']:<6} {p_end[0]:>14.6f} {p_end[1]:>14.6f} {dist:>19.0f} {status}")

# ============================================================
# ANALYSIS 5: GEOGRAPHIC SENSE (URABA REGION BOUNDING BOX & ROAD-LIKE PATHS)
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 5: GEOGRAPHIC SENSE CHECK")
print("=" * 80)

# Uraba banana belt bounding box (approximate)
URABA_LAT_MIN = 7.60
URABA_LAT_MAX = 8.15
URABA_LNG_MIN = -76.95
URABA_LNG_MAX = -76.55

print(f"\nUraba bounding box: lat [{URABA_LAT_MIN}, {URABA_LAT_MAX}], lng [{URABA_LNG_MIN}, {URABA_LNG_MAX}]")

out_of_bounds = []
for farm in FARMS:
    for route_type in ['h', 'p']:
        coords = R[farm['id']][route_type]['c']
        for i, c in enumerate(coords):
            if c[0] < URABA_LAT_MIN or c[0] > URABA_LAT_MAX or c[1] < URABA_LNG_MIN or c[1] > URABA_LNG_MAX:
                out_of_bounds.append((farm['id'], route_type, i, c))

# Also check hp route
for i, c in enumerate(R['hp']['c']):
    if c[0] < URABA_LAT_MIN or c[0] > URABA_LAT_MAX or c[1] < URABA_LNG_MIN or c[1] > URABA_LNG_MAX:
        out_of_bounds.append(('hp', 'hp', i, c))

if out_of_bounds:
    print(f"\nWARNING: {len(out_of_bounds)} route points outside Uraba bounding box:")
    for item in out_of_bounds:
        print(f"  Route {item[0]} ({item[1]}), point {item[2]}: [{item[3][0]:.6f}, {item[3][1]:.6f}]")
else:
    print("\nAll route coordinates are within the Uraba bounding box. OK")

# Check that routes follow reasonable paths (no teleportation)
print(f"\nRoute direction and distance checks:")
print(f"{'Route':<8} {'Type':<6} {'Declared km':>12} {'Computed km':>12} {'Diff%':>8} {'Max Seg km':>11} {'Status'}")
print("-" * 75)

distance_issues = []
for key in ['hp'] + [f['id'] for f in FARMS]:
    if key == 'hp':
        routes_to_check = [('hp', R['hp'])]
    else:
        routes_to_check = [('h', R[key]['h']), ('p', R[key]['p'])]

    for rtype, rdata in routes_to_check:
        declared_d = rdata['d']
        coords = rdata['c']
        computed_d = compute_route_distance_km(coords)

        # Find maximum single segment
        max_seg = 0
        max_seg_idx = 0
        for i in range(len(coords) - 1):
            seg_d = haversine_km(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
            if seg_d > max_seg:
                max_seg = seg_d
                max_seg_idx = i

        diff_pct = ((declared_d - computed_d) / declared_d * 100) if declared_d > 0 else 0

        issues = []
        if abs(diff_pct) > 50:
            issues.append("BIG_DIFF")
        if max_seg > 8:
            issues.append(f"LONG_JUMP({max_seg_idx})")

        status = ", ".join(issues) if issues else "OK"
        if issues:
            distance_issues.append((key, rtype, declared_d, computed_d, diff_pct, max_seg, max_seg_idx))

        label = key if key == 'hp' else key
        print(f"{label:<8} {rtype:<6} {declared_d:>12.2f} {computed_d:>12.2f} {diff_pct:>7.1f}% {max_seg:>11.2f} {status}")

# ============================================================
# ANALYSIS 6: OFF-ROAD AND SUSPICIOUS JUMP DETECTION
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 6: OFF-ROAD DETECTION & SUSPICIOUS JUMPS")
print("=" * 80)
print("For each route point, computing minimum distance to nearest OSM road segment.")
print("Points >500m from any road are flagged as potentially off-road.")
print()

OFFROAD_THRESHOLD_M = 500
JUMP_THRESHOLD_KM = 5.0

all_route_issues = []

def check_route_points(route_id, route_type, coords):
    """Check each route point for off-road status and return issues."""
    issues = []
    offroad_points = []
    jumps = []

    for i, pt in enumerate(coords):
        min_dist = float('inf')
        for seg in road_segments:
            d = point_to_segment_distance_km(pt[0], pt[1], seg[0], seg[1], seg[2], seg[3])
            if d < min_dist:
                min_dist = d
        min_dist_m = min_dist * 1000
        if min_dist_m > OFFROAD_THRESHOLD_M:
            offroad_points.append((i, pt, min_dist_m))

    for i in range(len(coords) - 1):
        seg_d = haversine_km(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
        if seg_d > JUMP_THRESHOLD_KM:
            jumps.append((i, i+1, seg_d))

    return offroad_points, jumps

# Check all routes
print(f"{'Route':<8} {'Type':<6} {'#Points':>8} {'#Offroad':>9} {'#Jumps':>7} {'Worst Offroad (m)':>18} {'Worst Jump (km)':>16}")
print("-" * 85)

total_offroad = 0
total_jumps = 0

for key in ['hp'] + [f['id'] for f in FARMS]:
    if key == 'hp':
        routes_to_check = [('hp', R['hp']['c'])]
    else:
        routes_to_check = [('h', R[key]['h']['c']), ('p', R[key]['p']['c'])]

    for rtype, coords in routes_to_check:
        offroad, jumps = check_route_points(key, rtype, coords)

        worst_offroad = max([x[2] for x in offroad]) if offroad else 0
        worst_jump = max([x[2] for x in jumps]) if jumps else 0

        total_offroad += len(offroad)
        total_jumps += len(jumps)

        status_parts = []
        if offroad:
            status_parts.append(f"{len(offroad)} offroad")
        if jumps:
            status_parts.append(f"{len(jumps)} jumps")

        label = key
        print(f"{label:<8} {rtype:<6} {len(coords):>8} {len(offroad):>9} {len(jumps):>7} {worst_offroad:>18.0f} {worst_jump:>16.2f}")

        if offroad or jumps:
            all_route_issues.append({
                'route': key,
                'type': rtype,
                'offroad_points': offroad,
                'jumps': jumps,
            })

# ============================================================
# DETAILED ISSUES
# ============================================================
if all_route_issues:
    print("\n" + "-" * 80)
    print("DETAILED OFF-ROAD POINTS AND JUMPS:")
    print("-" * 80)
    for issue in all_route_issues:
        print(f"\nRoute {issue['route']} ({issue['type']}):")
        if issue['offroad_points']:
            for idx, pt, dist_m in issue['offroad_points']:
                print(f"  Point {idx}: [{pt[0]:.6f}, {pt[1]:.6f}] -> {dist_m:.0f}m from nearest road")
        if issue['jumps']:
            for i, j, dist_km in issue['jumps']:
                print(f"  Jump {i}->{j}: {dist_km:.2f} km straight-line gap")

# ============================================================
# ANALYSIS: ROUTE SPEED PLAUSIBILITY
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 7: SPEED PLAUSIBILITY CHECK")
print("=" * 80)
print("Checking if declared distance/time implies reasonable speed (5-80 km/h for rural roads).")
print(f"{'Route':<8} {'Type':<6} {'Dist km':>8} {'Time min':>9} {'Speed km/h':>11} {'Status'}")
print("-" * 55)

speed_issues = []
for key in ['hp'] + [f['id'] for f in FARMS]:
    if key == 'hp':
        routes_to_check = [('hp', R['hp'])]
    else:
        routes_to_check = [('h', R[key]['h']), ('p', R[key]['p'])]

    for rtype, rdata in routes_to_check:
        d = rdata['d']
        t = rdata['t']
        if t > 0:
            speed = d / (t / 60)
        else:
            speed = 0

        status = "OK"
        if speed > 80:
            status = "TOO FAST"
            speed_issues.append((key, rtype, d, t, speed))
        elif speed < 5 and d > 1:
            status = "TOO SLOW"
            speed_issues.append((key, rtype, d, t, speed))
        elif speed < 15 and d > 3:
            status = "SLOW"

        print(f"{key:<8} {rtype:<6} {d:>8.2f} {t:>9.1f} {speed:>11.1f} {status}")

# ============================================================
# F15 ANOMALY: Hub route is LONGER than direct route
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 8: HUB ROUTE vs DIRECT ROUTE COMPARISON")
print("=" * 80)
print("Hub-to-farm + hub-to-port should usually be similar or slightly longer than direct.")
print("Checking for farms where hub route (farm->hub + hub->port) is much longer than direct.")
print(f"{'Farm':<6} {'Name':<16} {'Direct km':>10} {'Hub+Port km':>12} {'Overhead%':>10} {'Status'}")
print("-" * 70)

hp_d = R['hp']['d']
hub_overhead_issues = []
for farm in FARMS:
    direct_d = R[farm['id']]['p']['d']
    hub_d = R[farm['id']]['h']['d'] + hp_d
    overhead = ((hub_d - direct_d) / direct_d * 100) if direct_d > 0 else 0

    status = "OK"
    if overhead > 80:
        status = "VERY HIGH OVERHEAD"
        hub_overhead_issues.append((farm, direct_d, hub_d, overhead))
    elif overhead > 40:
        status = "HIGH OVERHEAD"
        hub_overhead_issues.append((farm, direct_d, hub_d, overhead))
    elif overhead < -10:
        status = "HUB SHORTER?!"
        hub_overhead_issues.append((farm, direct_d, hub_d, overhead))

    print(f"{farm['id']:<6} {farm['name']:<16} {direct_d:>10.2f} {hub_d:>12.2f} {overhead:>9.1f}% {status}")

# ============================================================
# F10, F15 HUB ROUTE ANOMALY: Routes going the wrong direction
# ============================================================
print("\n" + "=" * 80)
print("ANALYSIS 9: HUB ROUTE DIRECTIONALITY CHECK")
print("=" * 80)
print("Hub routes should go from farm toward the hub (generally).")
print("Checking if any hub route goes PAST the hub and comes back.")

for farm in FARMS:
    coords = R[farm['id']]['h']['c']
    hub_lat = HUB['lat']
    hub_lng = HUB['lng']

    # Track the distance from each point to the hub
    dists_to_hub = []
    for c in coords:
        d = haversine_km(c[0], c[1], hub_lat, hub_lng)
        dists_to_hub.append(d)

    # Find the minimum distance (should be at the end)
    min_idx = dists_to_hub.index(min(dists_to_hub))
    max_dist = max(dists_to_hub)

    # Check if route goes far from hub before converging
    if min_idx < len(dists_to_hub) - 2:  # Min not at end
        print(f"  {farm['id']} {farm['name']}: Closest to hub at point {min_idx}/{len(coords)-1} (not at end) - route may overshoot")

    # Check if any intermediate point is farther from hub than the start
    start_dist = dists_to_hub[0]
    for i, d in enumerate(dists_to_hub[1:-1], 1):
        if d > start_dist * 1.5:
            print(f"  {farm['id']} {farm['name']}: Point {i} is {d:.2f}km from hub (start is {start_dist:.2f}km) - detour detected")
            break

# ============================================================
# FINAL SUMMARY
# ============================================================
print("\n" + "=" * 80)
print("FINAL SUMMARY OF ALL ISSUES")
print("=" * 80)

print(f"\n1. FARMS FAR FROM ROADS ({len(farm_road_issues)} issues):")
if farm_road_issues:
    for farm, dist_m, status in farm_road_issues:
        print(f"   {farm['id']} {farm['name']}: {dist_m:.0f}m from nearest OSM road [{status}]")
else:
    print("   None - all farms are within 500m of a road.")

print(f"\n2. ROUTE START POINT MISMATCHES ({len(start_issues)} issues):")
if start_issues:
    for farm, h_dist, p_dist in start_issues:
        print(f"   {farm['id']} {farm['name']}: hub route start={h_dist:.0f}m off, port route start={p_dist:.0f}m off")
else:
    print("   None - all route starts match farm coordinates within 300m.")

print(f"\n3. ROUTE ENDPOINT MISMATCHES:")
print(f"   Hub-Puerto route: start {hp_start_dist:.0f}m from Hub, end {hp_end_dist:.0f}m from Puerto")
if hub_end_issues:
    print(f"   Farm->Hub routes with endpoint issues: {len(hub_end_issues)}")
    for farm, dist in hub_end_issues:
        print(f"     {farm['id']} {farm['name']}: endpoint {dist:.0f}m from Hub")
else:
    print(f"   All farm->hub routes end within 300m of Hub. OK")
if puerto_end_issues:
    print(f"   Farm->Puerto routes with endpoint issues: {len(puerto_end_issues)}")
    for farm, dist in puerto_end_issues:
        print(f"     {farm['id']} {farm['name']}: endpoint {dist:.0f}m from Puerto")
else:
    print(f"   All farm->puerto routes end within 300m of Puerto. OK")

print(f"\n4. OUT-OF-BOUNDS POINTS: {len(out_of_bounds)}")
if out_of_bounds:
    for item in out_of_bounds:
        print(f"   Route {item[0]} ({item[1]}), point {item[2]}: [{item[3][0]:.6f}, {item[3][1]:.6f}]")

print(f"\n5. OFF-ROAD POINTS (>{OFFROAD_THRESHOLD_M}m from road): {total_offroad} total across all routes")
print(f"   SUSPICIOUS JUMPS (>{JUMP_THRESHOLD_KM}km): {total_jumps} total")

if distance_issues:
    print(f"\n6. DECLARED vs COMPUTED DISTANCE DISCREPANCIES: {len(distance_issues)}")
    for key, rtype, decl, comp, diff, max_seg, seg_idx in distance_issues:
        print(f"   {key} ({rtype}): declared={decl:.1f}km, computed={comp:.1f}km (diff={diff:.1f}%), max segment={max_seg:.1f}km at idx {seg_idx}")
else:
    print(f"\n6. DECLARED vs COMPUTED DISTANCES: No major discrepancies")

if speed_issues:
    print(f"\n7. SPEED ANOMALIES: {len(speed_issues)}")
    for key, rtype, d, t, speed in speed_issues:
        print(f"   {key} ({rtype}): {d:.1f}km in {t:.1f}min = {speed:.1f} km/h")
else:
    print(f"\n7. SPEED ANOMALIES: None")

if hub_overhead_issues:
    print(f"\n8. HUB ROUTING OVERHEAD ANOMALIES: {len(hub_overhead_issues)}")
    for farm, direct, hub_total, overhead in hub_overhead_issues:
        print(f"   {farm['id']} {farm['name']}: direct={direct:.1f}km, via hub={hub_total:.1f}km, overhead={overhead:.1f}%")
else:
    print(f"\n8. HUB ROUTING OVERHEAD: All within normal range")

print("\n" + "=" * 80)
print("END OF ANALYSIS")
print("=" * 80)
