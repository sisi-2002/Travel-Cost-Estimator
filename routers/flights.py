from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from services.amadeus_service import search_flights, get_airport_autocomplete
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/flights/search")
async def flight_search(
    origin: str = Query(..., min_length=1),
    destination: str = Query(..., min_length=1),
    departure_date: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    return_date: Optional[str] = Query(None, regex=r"\d{4}-\d{2}-\d{2}"),
    adults: int = Query(1, ge=1, le=9)
):
    try:
        # Convert city names to IATA codes if needed
        origin_code = origin if len(origin) == 3 else await get_iata_code_from_city(origin)
        destination_code = destination if len(destination) == 3 else await get_iata_code_from_city(destination)
        
        if not origin_code:
            raise HTTPException(status_code=400, detail=f"Could not find airport code for origin: {origin}")
        if not destination_code:
            raise HTTPException(status_code=400, detail=f"Could not find airport code for destination: {destination}")
        
        results = search_flights(origin_code, destination_code, departure_date, return_date, adults)
        return results
    except Exception as e:
        logger.error(f"Flight search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flights/airports")
async def airport_autocomplete(keyword: str = Query(..., min_length=1)):
    try:
        results = get_airport_autocomplete(keyword)
        return results
    except Exception as e:
        logger.error(f"Airport autocomplete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_iata_code_from_city(city_name: str):
    """Helper function to get IATA code from city name"""
    try:
        # Get airport suggestions for the city name
        suggestions = get_airport_autocomplete(city_name)
        if suggestions and len(suggestions) > 0:
            # Return the IATA code of the first suggestion
            return suggestions[0].get('iataCode')
        return None
    except Exception as e:
        logger.error(f"Error getting IATA code for city {city_name}: {e}")
        return None