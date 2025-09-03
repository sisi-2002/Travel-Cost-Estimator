#!/usr/bin/env python3
"""
Startup script for TripCraft Backend
"""

import uvicorn
from config import settings

if __name__ == "__main__":
    print("🚀 Starting TripCraft Backend...")
    print(f"📍 Server will run on http://{settings.host}:{settings.port}")
    print(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
    print(f"🔍 Health Check: http://{settings.host}:{settings.port}/health")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
