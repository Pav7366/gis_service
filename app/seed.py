
import os
from sqlalchemy import create_engine, Column, Integer, Float, String
from sqlalchemy.orm import declarative_base, sessionmaker
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
from dotenv import load_dotenv

# Load the database connection string from your .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define the database table model
class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String(50))
    depth_cm = Column(Float)
    
    # The spatial column (EPSG:4326 is standard GPS coordinates)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))

# Create the table if it does not already exist
Base.metadata.create_all(bind=engine)

def seed_database():
    session = SessionLocal()
    
    # Mock data using local coordinates around Pune, Maharashtra
    # Note: WKT format is strictly POINT(Longitude Latitude)
    mock_data = [
        Pothole(severity="High", depth_cm=12.5, geom=WKTElement('POINT(73.8567 18.5204)', srid=4326)),
        Pothole(severity="Medium", depth_cm=5.0, geom=WKTElement('POINT(73.8508 18.4575)', srid=4326)),
        Pothole(severity="Low", depth_cm=2.5, geom=WKTElement('POINT(73.8123 18.5314)', srid=4326))
    ]
    
    try:
        session.add_all(mock_data)
        session.commit()
        print("Successfully seeded the database with spatial pothole data!")
    except Exception as e:
        session.rollback()
        print(f"Error seeding data: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()