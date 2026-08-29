from typing import Optional
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles # <-- Added this import
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

# Adjust imports based on where you saved your seed_data models
from app.seed import SessionLocal, Pothole 

app = FastAPI()

# <-- Added this line to unlock the static folder -->
app.mount("/static", StaticFiles(directory="app/static", html=True), name="static")

# Dependency to open and close the database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/potholes")
def get_potholes(db: Session = Depends(get_db)):
    # We use PostGIS's built-in ST_AsGeoJSON function to format the coordinates
    query = db.query(
        Pothole.id,
        Pothole.severity,
        Pothole.depth_cm,
        func.ST_AsGeoJSON(Pothole.geom).label('geometry')
    ).all()

    # Build standard GeoJSON FeatureCollection
    features = []
    for row in query:
        feature = {
            "type": "Feature",
            "geometry": json.loads(row.geometry),
            "properties": {
                "id": row.id,
                "severity": row.severity,
                "depth_cm": row.depth_cm
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }