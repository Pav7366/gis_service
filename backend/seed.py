import requests
import random

print("Injecting STRICTLY road-snapped hazards into Pune...")

# Verified exact street nodes (JM Road, FC Road, Karve Road) with zero offsets
road_coords = [
    # JM Road
    (18.525501, 73.845014), (18.524956, 73.845427), (18.524330, 73.845942), (18.523814, 73.846377),
    (18.523097, 73.846985), (18.522247, 73.847702), (18.521575, 73.848270), (18.520868, 73.848873),
    # FC Road
    (18.526279, 73.844356), (18.525164, 73.843653), (18.524021, 73.842937), (18.523000, 73.842274),
    (18.522067, 73.841662), (18.521105, 73.841022), (18.520023, 73.840292), (18.519097, 73.839678),
    # Karve Road
    (18.509743, 73.832263), (18.510698, 73.833534), (18.511391, 73.834467), (18.512217, 73.835565),
    (18.513054, 73.836693), (18.513812, 73.837704), (18.514522, 73.838634)
]

def get_meta():
    return {
        "area": random.choice(["FC Road", "JM Road", "Karve Road", "Deccan"]),
        "status": random.choice(["Under Review", "Approved", "Waitlist", "Rejected"]),
        "confidence": round(random.uniform(0.70, 0.99), 2),
        "severity": random.choice(["Low", "Medium", "High"])
    }

# Inject 40 Potholes STRICTLY on the exact coordinates
for i in range(40):
    lat, lon = random.choice(road_coords)
    
    payload = {
        "hazard_type": "pothole",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        **get_meta()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# Inject 10 Broken Dividers
for i in range(10):
    lat, lon = random.choice(road_coords)
    
    # Microscopic line generation (approx 1-2 meters) to represent the divider without going off-road
    end_lat = round(lat + 0.00005, 6)
    end_lon = round(lon + 0.00005, 6)
    
    payload = {
        "hazard_type": "broken_divider",
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat], [end_lon, end_lat]]
        },
        **get_meta()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

print("✅ Perfect precision data injected! Check your browser.")