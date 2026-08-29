import requests
import random
import time

print("Dropping 20 precise potholes into central Pune...")

# Central Pune coordinates
base_lat = 18.5204
base_lon = 73.8567

for i in range(20):
    # Tightened the variance so they land squarely on city streets
    lat = base_lat + random.uniform(-0.015, 0.015)
    lon = base_lon + random.uniform(-0.015, 0.015)
    
    payload = {
        "hazard_type": "pothole", 
        "latitude": lat, 
        "longitude": lon
    }
    
    try:
        # Pushing to your active FastAPI server
        res = requests.post("http://127.0.0.1:8000/api/hazards/", json=payload)
        print(f"Pothole {i+1} injected: Status {res.status_code}")
    except Exception as e:
        print(f"Server offline or failed to connect: {e}")
        
    time.sleep(0.1)

print("Data injection complete! Check your browser map.")