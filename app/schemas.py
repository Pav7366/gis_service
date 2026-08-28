from pydantic import BaseModel
from datetime import datetime

# Data coming from the Bus (Edge AI)
class HazardCreate(BaseModel):
    hazard_type: str
    confidence: float
    latitude: float
    longitude: float

# Data going to the Web Dashboard
class HazardResponse(BaseModel):
    id: int
    hazard_type: str
    report_count: int
    latitude: float
    longitude: float
    last_seen: datetime

    class Config:
        from_attributes = True