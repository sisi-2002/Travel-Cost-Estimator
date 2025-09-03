from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Import routers
from routers import auth, flights, plans

# Import database manager (make sure this exists)
try:
    from database import db_manager
except ImportError:
    logger.warning("Database manager not found, continuing without database")
    db_manager = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up TripCraft Backend...")
    
    if db_manager:
        try:
            await db_manager.connect()
            logger.info("Connected to MongoDB Atlas")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down TripCraft Backend...")
    if db_manager:
        try:
            await db_manager.close()
            logger.info("Disconnected from MongoDB Atlas")
        except Exception as e:
            logger.error(f"Error disconnecting from database: {e}")

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
        "http://127.0.0.1:8005",
        # Add your frontend URL here if different
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers with correct prefixes
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(flights.router, prefix="/api/v1", tags=["flights"])
app.include_router(plans.router, prefix="/api/v1", tags=["travel-planning"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to TripCraft Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "travel_plans": "/api/v1/generate-travel-plan"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "service": "TripCraft Backend",
            "database": "connected" if db_manager else "not configured"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unhealthy")

@app.get("/api/v1/health")
async def api_health():
    """API health check endpoint"""
    return {"status": "API v1 is healthy"}

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    logger.warning(f"404 error: {request.url}")
    return {
        "error": "Not Found",
        "message": f"The requested endpoint {request.url.path} was not found",
        "available_endpoints": [
            "/",
            "/health", 
            "/api/v1/health",
            "/api/v1/generate-travel-plan",
            "/docs"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    from config import settings
    
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )