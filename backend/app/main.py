import json
import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, func, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from geoalchemy2 import Geometry


def build_database_url() -> str:
    # Connection is env-driven so the same image runs locally and on the cloud
    # without any hardcoded credentials.
    host = os.getenv("POSTGRES_HOST", "db")
    port = os.getenv("POSTGRES_PORT", "5432")
    user = os.getenv("POSTGRES_USER", "bususer")
    password = os.getenv("POSTGRES_PASSWORD", "buspass")
    db = os.getenv("POSTGRES_DB", "fleet")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"


DATABASE_URL = build_database_url()
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

# Allow the frontend origin(s), env-driven so it works across local and cloud.
_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _events_as_features(db: Session):
    """Read live events written by the ingest service and return them as GeoJSON.

    This is the integration seam between the ingestion pipeline (MQTT -> PostGIS
    'events' table) and the GIS visualization. Bus detections land in `events`
    as lat/lon points; we map them onto the properties the frontend expects
    (hazard_type from `type`, status/severity defaults, confidence, reported_at).
    """
    rows = db.execute(
        text(
            "SELECT event_id, type, bus_id, lat, lon, confidence, "
            "COALESCE(frequency, 0) AS frequency, "
            "COALESCE(cluster_radius_m, 0) AS cluster_radius_m, "
            "gps_ts FROM events ORDER BY gps_ts DESC"
        )
    ).fetchall()

    features = []
    for r in rows:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(r.lon), float(r.lat)],
                },
                "properties": {
                    "id": str(r.event_id),
                    "hazard_type": r.type,
                    "area": "Bus detected",
                    "status": "Under Review",
                    "severity": "Medium",
                    "confidence": float(r.confidence) if r.confidence is not None else 0.0,
                    "reported_at": r.gps_ts.strftime("%Y-%m-%d %H:%M:%S"),
                    "bus_id": r.bus_id,
                    "frequency": r.frequency,
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


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
    try:
        return _events_as_features(db)
    finally:
        db.close()


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
