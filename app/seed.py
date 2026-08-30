import requests
import random
import time

print("Injecting complex hazard data into Pune...")

base_lat = 18.5204
base_lon = 73.8567
areas = ["Shivajinagar", "Kothrud", "Viman Nagar", "Kalyani Nagar", "Baner"]
severities = ["Low", "Medium", "High"]
statuses = ["Under Review", "Approved", "Waitlist"]

def get_metadata():
    return {
        "area": random.choice(areas),
        "status": random.choice(statuses),
        "confidence": round(random.uniform(0.60, 0.99), 2),
        "severity": random.choice(severities)
    }

for i in range(15):
    lat = base_lat + random.uniform(-0.015, 0.015)
    lon = base_lon + random.uniform(-0.015, 0.015)
    payload = {
        "hazard_type": "pothole",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        **get_metadata()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

for i in range(5):
    start_lat = base_lat + random.uniform(-0.015, 0.015)
    start_lon = base_lon + random.uniform(-0.015, 0.015)
    payload = {
        "hazard_type": "broken_divider",
        "geometry": {
            "type": "LineString",
            "coordinates": [[start_lon, start_lat], [start_lon + 0.002, start_lat + 0.002]]
        },
        **get_metadata()
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

print("Data injection complete! Check your browser map.")