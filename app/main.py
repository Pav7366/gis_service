import os
import json
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry

# --- DATABASE SETUP ---
DATABASE_URL = "postgresql://postgres:gis_password@localhost:5433/smartcity_gis"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# We use a new table name 'hazards_v2' to force SQLAlchemy to create a fresh 
# table that allows ALL geometry types, not just Points.
class HazardDB(Base):
    __tablename__ = "hazards_v2"
    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, index=True)
    # GEOMETRY accepts Points, LineStrings, and Polygons
    geom = Column(Geometry('GEOMETRY', srid=4326)) 

Base.metadata.create_all(bind=engine)

# --- API SCHEMAS ---
class HazardCreate(BaseModel):
    hazard_type: str
    geometry: dict  # Expecting a standard GeoJSON geometry object (Point, Line, or Polygon)

# --- FASTAPI APP ---
app = FastAPI()

# Safely resolve static folder path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.post("/api/hazards/")
def create_hazard(hazard: HazardCreate):
    db: Session = SessionLocal()
    
    # Convert Python dict to JSON string for PostGIS
    geojson_str = json.dumps(hazard.geometry)
    
    # PostGIS natively converts GeoJSON into database geometries
    new_hazard = HazardDB(
        hazard_type=hazard.hazard_type, 
        geom=func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)
    )
    
    db.add(new_hazard)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/hazards/")
def get_hazards():
    db: Session = SessionLocal()
    # Ask PostGIS to convert the binary geometries back to GeoJSON text
    hazards = db.query(
        HazardDB.id,
        HazardDB.hazard_type,
        func.ST_AsGeoJSON(HazardDB.geom).label('geojson')
    ).all()
    db.close()
    
    # Format the data exactly as a standard GeoJSON FeatureCollection
    features = []
    for h in hazards:
        features.append({
            "type": "Feature",
            "geometry": json.loads(h.geojson),
            "properties": {
                "id": h.id,
                "hazard_type": h.hazard_type
            }
        })
        
    return {"type": "FeatureCollection", "features": features}

@app.get("/")
def serve_dashboard():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))