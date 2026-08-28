from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import hazards

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart City GIS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
)

# Include the Spatial API
app.include_router(hazards.router)

# Mount the Frontend Dashboard
app.mount("/", StaticFiles(directory="static", html=True), name="static")