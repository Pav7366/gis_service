from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from .database import Base

class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, index=True)
    confidence = Column(Float)
    report_count = Column(Integer, default=1)
    
    # PostGIS Spatial Column (SRID 4326 is standard GPS Lat/Lon)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))
    
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())