import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, func, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry
import os

DATABASE_URL = "postgresql://bususer:buspass@db:5432/fleet"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HazardDB(Base):
    __tablename__ = "hazards_v5" 
    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, index=True)
    geom = Column(Geometry('GEOMETRY', srid=4326))
    area = Column(String, default="Unknown")
    confidence = Column(Float, default=0.0)
    severity = Column(String, default="Medium")
    is_false_positive = Column(Boolean, default=False)
    reported_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class HazardCreate(BaseModel):
    hazard_type: str
    geometry: dict
    area: str
    confidence: float
    severity: str
    is_false_positive: bool = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/hazards/")
def create_hazard(hazard: HazardCreate):
    db: Session = SessionLocal()
    new_hazard = HazardDB(
        hazard_type=hazard.hazard_type, 
        geom=func.ST_SetSRID(func.ST_GeomFromGeoJSON(json.dumps(hazard.geometry)), 4326),
        area=hazard.area, confidence=hazard.confidence, severity=hazard.severity, is_false_positive=hazard.is_false_positive
    )
    db.add(new_hazard)
    db.commit()
    db.close()
    return {"status": "success"}

@app.put("/api/hazards/{hazard_id}/toggle_false_positive")
def toggle_false_positive(hazard_id: int):
    db: Session = SessionLocal()
    hazard = db.query(HazardDB).filter(HazardDB.id == hazard_id).first()
    if hazard:
        hazard.is_false_positive = not hazard.is_false_positive
        db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/hazards/")
def get_hazards():
    db: Session = SessionLocal()
    # FIX: Added .order_by(HazardDB.id) so the rows NEVER jump around when updated!
    hazards = db.query(
        HazardDB.id, HazardDB.hazard_type, HazardDB.area, HazardDB.is_false_positive,
        HazardDB.confidence, HazardDB.severity, HazardDB.reported_at,
        func.ST_AsGeoJSON(HazardDB.geom).label('geojson')
    ).order_by(HazardDB.id).all()
    db.close()
    
    features = [{"type": "Feature", "geometry": json.loads(h.geojson), "properties": {"id": h.id, "hazard_type": h.hazard_type, "area": h.area, "is_false_positive": h.is_false_positive, "confidence": h.confidence, "severity": h.severity, "reported_at": h.reported_at.strftime("%Y-%m-%d %H:%M:%S")}} for h in hazards]
    return {"type": "FeatureCollection", "features": features}

@app.get("/api/tables")
def get_tables():
    db: Session = SessionLocal()
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')"
    result = db.execute(text(query)).fetchall()
    db.close()
    return [row[0] for row in result]

@app.get("/api/table/{table_name}")
def get_table_data(table_name: str):
    db: Session = SessionLocal()
    valid_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')"
    valid_tables = [row[0] for row in db.execute(text(valid_query)).fetchall()]
    if table_name not in valid_tables: return {"error": "Invalid table"}
    
    query = f"SELECT id, hazard_type, area, is_false_positive, confidence, severity, reported_at FROM {table_name} ORDER BY id ASC"
    result = db.execute(text(query)).fetchall()
    keys = db.execute(text(query)).keys()
    db.close()
    return [dict(zip(keys, row)) for row in result]