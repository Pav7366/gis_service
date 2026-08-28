from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.elements import WKTElement
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/hazards", tags=["Hazards"])

@router.post("/", response_model=schemas.HazardResponse)
def report_hazard(hazard: schemas.HazardCreate, db: Session = Depends(get_db)):
    # Create the PostGIS Point
    point_wkt = f"POINT({hazard.longitude} {hazard.latitude})"
    incoming_geom = WKTElement(point_wkt, srid=4326)

    # 1. SPATIAL DEDUPLICATION: Check if this hazard exists within 3 meters
    # We cast to ::geography so ST_DWithin measures in meters, not degrees
    existing_hazard = db.query(models.Hazard).filter(
        models.Hazard.hazard_type == hazard.hazard_type,
        func.ST_DWithin(
            func.cast(models.Hazard.geom, func.geometry), 
            func.cast(incoming_geom, func.geometry), 
            0.00003 # Approx 3 meters in map degrees for simplicity
        )
    ).first()

    if existing_hazard:
        # Match found: Update count and timestamp
        existing_hazard.report_count += 1
        db.commit()
        db.refresh(existing_hazard)
        return process_response(existing_hazard, hazard.latitude, hazard.longitude)
    
    # No match: Insert new hazard
    new_hazard = models.Hazard(
        hazard_type=hazard.hazard_type,
        confidence=hazard.confidence,
        geom=incoming_geom
    )
    db.add(new_hazard)
    db.commit()
    db.refresh(new_hazard)
    
    return process_response(new_hazard, hazard.latitude, hazard.longitude)

@router.get("/", response_model=list[schemas.HazardResponse])
def get_hazards(db: Session = Depends(get_db)):
    # Extract Lat/Lon from Geometry for the frontend
    hazards = db.query(
        models.Hazard,
        func.ST_Y(models.Hazard.geom).label('lat'),
        func.ST_X(models.Hazard.geom).label('lon')
    ).all()
    
    return [process_response(h.Hazard, h.lat, h.lon) for h in hazards]

def process_response(hazard_obj, lat, lon):
    return schemas.HazardResponse(
        id=hazard_obj.id,
        hazard_type=hazard_obj.hazard_type,
        report_count=hazard_obj.report_count,
        latitude=lat,
        longitude=lon,
        last_seen=hazard_obj.last_seen
    )