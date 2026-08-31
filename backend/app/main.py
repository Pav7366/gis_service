import json
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, func, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry

DATABASE_URL = "postgresql://bususer:buspass@db:5432/fleet"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HazardDB(Base):
    __tablename__ = "hazards_react" 
    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, index=True)
    geom = Column(Geometry('GEOMETRY', srid=4326))
    area = Column(String, default="Unknown")
    status = Column(String, default="Under Review")
    confidence = Column(Float, default=0.0)
    severity = Column(String, default="Medium")
    reported_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class HazardCreate(BaseModel):
    hazard_type: str
    geometry: dict
    area: str
    status: str
    confidence: float
    severity: str

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
        area=hazard.area, status=hazard.status, confidence=hazard.confidence, severity=hazard.severity
    )
    db.add(new_hazard)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/api/hazards/")
def get_hazards():
    db: Session = SessionLocal()
    hazards = db.query(
        HazardDB.id, HazardDB.hazard_type, HazardDB.area, HazardDB.status,
        HazardDB.confidence, HazardDB.severity, HazardDB.reported_at,
        func.ST_AsGeoJSON(HazardDB.geom).label('geojson')
    ).all()
    db.close()
    features = [{"type": "Feature", "geometry": json.loads(h.geojson), "properties": {"id": h.id, "hazard_type": h.hazard_type, "area": h.area, "status": h.status, "confidence": h.confidence, "severity": h.severity, "reported_at": h.reported_at.strftime("%Y-%m-%d %H:%M:%S")}} for h in hazards]
    return {"type": "FeatureCollection", "features": features}

# --- RESTORED DATABASE ROUTES ---
@app.get("/api/tables")
def get_tables():
    db: Session = SessionLocal()
    # Safely get all tables except internal PostGIS mapping tables
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')"
    result = db.execute(text(query)).fetchall()
    db.close()
    return [row[0] for row in result]

@app.get("/api/table/{table_name}")
def get_table_data(table_name: str):
    db: Session = SessionLocal()
    valid_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')"
    valid_tables = [row[0] for row in db.execute(text(valid_query)).fetchall()]
    
    if table_name not in valid_tables:
        return {"error": "Invalid table"}
    
    query = f"SELECT id, hazard_type, area, status, confidence, severity, reported_at FROM {table_name}"
    result = db.execute(text(query)).fetchall()
    keys = db.execute(text(query)).keys()
    db.close()
    return [dict(zip(keys, row)) for row in result]