from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import db_manager
from routers import auth, flights  
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up TripCraft Backend...")
    await db_manager.connect()
    logger.info("Connected to MongoDB Atlas")
    
    yield
    
    # Shutdown
    logger.info("Shutting down TripCraft Backend...")
    await db_manager.close()
    logger.info("Disconnected from MongoDB Atlas")

# Create FastAPI app
app = FastAPI(
    title="TripCraft Backend API",
    description="Backend API for TripCraft travel application with user authentication and flight search",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8005",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173", 
        "http://127.0.0.1:3915",
        "http://127.0.0.1:8005"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with correct prefixes
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(flights.router, prefix="/api/v1", tags=["flights"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to TripCraft Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    from config import settings
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )