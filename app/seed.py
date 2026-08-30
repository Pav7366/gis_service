import requests
import random
import time

print("Fetching real road infrastructure from OpenStreetMap (Pune)...")

# 1. Ask OpenStreetMap for actual road coordinates in Central Pune
overpass_url = "http://overpass-api.de/api/interpreter"
# This query grabs all primary, secondary, tertiary, and residential roads in the bounding box
overpass_query = """
[out:json];
way["highway"~"primary|secondary|tertiary|residential"](18.5100, 73.8400, 18.5300, 73.8700);
node(w);
out skel;
"""

road_coords = []
try:
    response = requests.post(overpass_url, data={'data': overpass_query}, timeout=10)
    data = response.json()
    # Extract the exact latitude and longitude of the road nodes
    road_coords = [(node['lat'], node['lon']) for node in data['elements'] if node['type'] == 'node']
    print(f"✅ Successfully mapped {len(road_coords)} actual road coordinates!")
except Exception as e:
    print("⚠️ Could not fetch live roads (Internet/API timeout). Using precise fallback road coordinates.")
    # A few hardcoded points exactly on FC Road / JM Road just in case the API is busy
    road_coords = [
        (18.5263, 73.8443), (18.5255, 73.8451), (18.5246, 73.8460), 
        (18.5238, 73.8468), (18.5204, 73.8567), (18.5195, 73.8550)
    ]

areas = ["Shivajinagar", "FC Road", "JM Road", "Deccan Gymkhana", "Camp"]
severities = ["Low", "Medium", "High"]
statuses = ["Under Review", "Approved", "Waitlist", "Rejected"]

def get_metadata():
    return {
        "area": random.choice(areas),
        "status": random.choice(statuses),
        "confidence": round(random.uniform(0.60, 0.99), 2),
        "severity": random.choice(severities)
    }

print("Injecting HIGH-PRECISION hazards strictly onto roads...")

# 2. Inject 15 Potholes
for i in range(15):
    # Pick an EXACT real-world road coordinate instead of a random map location
    lat, lon = random.choice(road_coords)
    
    payload = {
        "hazard_type": "pothole",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        **get_metadata()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# 3. Inject 5 Broken Dividers
for i in range(5):
    lat, lon = random.choice(road_coords)
    
    # Add a microscopic offset (approx 2-3 meters) to create a small line that stays on the road
    end_lat = round(lat + random.uniform(-0.00003, 0.00003), 6)
    end_lon = round(lon + random.uniform(-0.00003, 0.00003), 6)
    
    payload = {
        "hazard_type": "broken_divider",
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat], [end_lon, end_lat]]
        },
        **get_metadata()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

print("✅ High-precision, road-snapped data injection complete! Check your browser map.")