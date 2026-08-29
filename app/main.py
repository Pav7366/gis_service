import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry

# --- DATABASE SETUP ---
DATABASE_URL = "postgresql://postgres:gis_password@localhost:5433/smartcity_gis"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HazardDB(Base):
    __tablename__ = "hazards"
    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, index=True)
    geom = Column(Geometry('POINT', srid=4326)) # PostGIS Geometry

Base.metadata.create_all(bind=engine)

# --- API SCHEMAS ---
class HazardCreate(BaseModel):
    hazard_type: str
    latitude: float
    longitude: float

# --- FASTAPI APP ---
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/api/hazards/")
def create_hazard(hazard: HazardCreate):
    db: Session = SessionLocal()
    incoming_wkt = f"POINT({hazard.longitude} {hazard.latitude})"
    new_hazard = HazardDB(hazard_type=hazard.hazard_type, geom=incoming_wkt)
    db.add(new_hazard)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/hazards/")
def get_hazards():
    db: Session = SessionLocal()
    hazards = db.query(
        HazardDB.hazard_type,
        func.ST_Y(HazardDB.geom).label('lat'),
        func.ST_X(HazardDB.geom).label('lon')
    ).all()
    db.close()
    return [{"type": h.hazard_type, "latitude": h.lat, "longitude": h.lon} for h in hazards]

@app.get("/")
def serve_dashboard():
    return FileResponse("static/index.html")