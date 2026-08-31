import requests
import random

print("Injecting distinct, non-overlapping road hazards...")

# 1. JM Road (Strictly for Potholes)
pothole_coords = [
    (18.525501, 73.845014), (18.524956, 73.845427), (18.524330, 73.845942), (18.523814, 73.846377),
    (18.523097, 73.846985), (18.522247, 73.847702), (18.521575, 73.848270), (18.520868, 73.848873)
]

# 2. FC Road (Strictly for Cracks)
crack_coords = [
    (18.526279, 73.844356), (18.525164, 73.843653), (18.524021, 73.842937), (18.523000, 73.842274),
    (18.522067, 73.841662), (18.521105, 73.841022), (18.520023, 73.840292), (18.519097, 73.839678)
]

# 3. Karve Road & Others (Strictly for Garbage Dumps)
garbage_coords = [
    (18.509743, 73.832263), (18.510698, 73.833534), (18.511391, 73.834467), (18.512217, 73.835565),
    (18.536200, 73.874100), (18.537100, 73.875200), (18.538500, 73.876500), (18.535000, 73.873000)
]

def get_meta(area_name):
    return {
        "area": area_name,
        "confidence": round(random.uniform(0.70, 0.99), 2),
        "severity": random.choice(["Low", "Medium", "High"]),
        "is_false_positive": random.choice([True, False, False, False])
    }

# Inject 25 Potholes (Red Dots)
for _ in range(25):
    lat, lon = random.choice(pothole_coords)
    lat, lon = round(lat + random.uniform(-0.0001, 0.0001), 6), round(lon + random.uniform(-0.0001, 0.0001), 6)
    payload = {"hazard_type": "pothole", "geometry": {"type": "Point", "coordinates": [lon, lat]}, **get_meta("JM Road")}
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# Inject 20 Cracks (Orange Dots)
for _ in range(20):
    lat, lon = random.choice(crack_coords)
    lat, lon = round(lat + random.uniform(-0.0001, 0.0001), 6), round(lon + random.uniform(-0.0001, 0.0001), 6)
    payload = {"hazard_type": "crack", "geometry": {"type": "Point", "coordinates": [lon, lat]}, **get_meta("FC Road")}
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# Inject 10 Garbage Dumps (Purple Dots)
for _ in range(10):
    lat, lon = random.choice(garbage_coords)
    payload = {"hazard_type": "garbage_dump", "geometry": {"type": "Point", "coordinates": [lon, lat]}, **get_meta("Karve Road")}
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

print("✅ Data injected successfully!")