import requests
import random
import time

print("Dropping mixed hazard types (Points, Lines, Polygons) into Pune...")

base_lat = 18.5204
base_lon = 73.8567

# 1. Inject 10 Potholes (Points)
for i in range(10):
    lat = base_lat + random.uniform(-0.015, 0.015)
    lon = base_lon + random.uniform(-0.015, 0.015)
    payload = {
        "hazard_type": "pothole",
        "geometry": {"type": "Point", "coordinates": [lon, lat]}
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# 2. Inject 5 Broken Dividers (Lines)
for i in range(5):
    start_lat = base_lat + random.uniform(-0.015, 0.015)
    start_lon = base_lon + random.uniform(-0.015, 0.015)
    end_lat = start_lat + random.uniform(-0.002, 0.002)
    end_lon = start_lon + random.uniform(-0.002, 0.002)
    
    payload = {
        "hazard_type": "broken_divider",
        "geometry": {
            "type": "LineString",
            "coordinates": [[start_lon, start_lat], [end_lon, end_lat]]
        }
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

# 3. Inject 5 Large Damages (Polygons / Areas)
for i in range(5):
    center_lat = base_lat + random.uniform(-0.015, 0.015)
    center_lon = base_lon + random.uniform(-0.015, 0.015)
    offset = 0.001 # Size of the damaged area
    
    payload = {
        "hazard_type": "large_damage",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [center_lon - offset, center_lat - offset],
                [center_lon + offset, center_lat - offset],
                [center_lon + offset, center_lat + offset],
                [center_lon - offset, center_lat + offset],
                [center_lon - offset, center_lat - offset] # Must connect back to the start point!
            ]]
        }
    }
    requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)

print("Data injection complete! Check your browser map.")