from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from services.amadeus_service import (
    get_hotels_by_city,
    get_hotel_offers,
    search_hotels_with_offers,
    get_location_autocomplete
)
from services.nlp_service import extract_hotel_preferences, sanitize_user_input
from services.llm_summary_service import summarize_hotel_search_results
from services.security_service import validate_hotel_search_input
from services.city_name_service import get_city_display_name
from auth import get_current_active_user
from fastapi import Security
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def _calculate_chain_diversity(hotels: List[dict]) -> dict:
    """Calculate hotel chain diversity score"""
    chains = set()
    for hotel in hotels:
        chain = hotel.get("hotel", {}).get("chainCode")
        if chain:
            chains.add(chain)
    
    return {
        "unique_chains": len(chains),
        "diversity_score": min(len(chains) / 5.0, 1.0),  # Normalized to 0-1
        "chains_found": list(chains)
    }

def _analyze_price_range(hotels: List[dict]) -> dict:
    """Analyze price distribution"""
    prices = []
    for hotel in hotels:
        offers = hotel.get("offers", [])
        if offers:
            price = offers[0].get("price", {}).get("total")
            if price:
                try:
                    prices.append(float(price))
                except ValueError:
                    pass
    
    if not prices:
        return {"analysis": "No price data available"}
    
    return {
        "min_price": min(prices),
        "max_price": max(prices),
        "avg_price": sum(prices) / len(prices),
        "price_range": max(prices) - min(prices),
        "total_options": len(prices)
    }

def _generate_location_insights(hotels: List[dict]) -> dict:
    """Generate location-based insights"""
    distances = []
    for hotel in hotels:
        distance = hotel.get("hotel", {}).get("distance", {}).get("value")
        if distance:
            try:
                distances.append(float(distance))
            except ValueError:
                pass
    
    if not distances:
        return {"analysis": "No distance data available"}
    
    return {
        "avg_distance_km": sum(distances) / len(distances),
        "closest_hotel_km": min(distances),
        "farthest_hotel_km": max(distances),
        "central_location_score": max(0, 1 - (sum(distances) / len(distances)) / 10)  # 0-1 score
    }

@router.get("/hotels/locations")
async def hotel_locations(keyword: str = Query(..., min_length=1)):
    """Get location autocomplete for hotel search"""
    try:
        results = get_location_autocomplete(keyword)
        return results
    except Exception as e:
        logger.error(f"Location autocomplete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotels/search")
async def hotel_search(
    destination: str = Query(..., description="City name or IATA code (3-letter)"),
    check_in: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    check_out: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    adults: int = Query(1, ge=1, le=9),
    room_quantity: int = Query(1, ge=1, le=9),
    max_hotels: int = Query(10, ge=1, le=20),
    currency: str = Query("USD", description="Currency code"),
    radius: int = Query(5, ge=1, le=50, description="Search radius in km"),
    preferences: Optional[str] = Query(None, description="Natural language preferences"),
    include_summary: bool = Query(False, description="Include AI-generated summary"),
    premium_search: bool = Query(False, description="Premium search features"),
    current_user = Depends(lambda: None)  # Optional authentication
):
    """
    Enhanced hotel search with NLP, IR, LLM, and security features
    
    Features:
    - NLP: Extract preferences from natural language
    - IR: Location-based search with radius filtering
    - LLM: AI-generated summaries of results
    - Security: Input validation and sanitization
    - Auth: Premium features require authentication
    """
    try:
        # Input validation and sanitization
        search_params = {
            'destination': destination,
            'check_in': check_in,
            'check_out': check_out,
            'adults': adults,
            'room_quantity': room_quantity,
            'max_hotels': max_hotels,
            'currency': currency,
            'radius': radius,
            'preferences': preferences
        }
        
        validated_params = validate_hotel_search_input(search_params)
        
        # Sanitize preferences text
        sanitized_preferences = None
        if preferences:
            sanitized_preferences = sanitize_user_input(preferences)
        
        # NLP: Extract preferences from natural language
        extracted_preferences = {}
        if sanitized_preferences:
            extracted_preferences = extract_hotel_preferences(sanitized_preferences)
            logger.info(f"Extracted preferences: {extracted_preferences}")
        
        # Resolve city name to IATA code if needed
        city_code = validated_params['destination'].upper() if len(validated_params['destination']) == 3 else None
        if not city_code:
            locations = get_location_autocomplete(validated_params['destination'])
            if isinstance(locations, list) and len(locations) > 0:
                city_code = locations[0].get("iataCode")
        
        if not city_code:
            raise HTTPException(status_code=400, detail=f"Could not resolve destination: {validated_params['destination']}")

        # IR: Enhanced search with preferences
        data = search_hotels_with_offers(
            city_code, 
            validated_params['check_in'], 
            validated_params['check_out'], 
            validated_params['adults'], 
            validated_params['room_quantity'], 
            validated_params['max_hotels'], 
            validated_params['currency'],
            validated_params['radius'],
            extracted_preferences.get('ratings', []),
            extracted_preferences.get('amenities', [])
        )
        
        if isinstance(data, dict) and "error" in data:
            raise HTTPException(status_code=502, detail=data["error"])
        
        # LLM: Generate summary if requested
        summary = None
        if include_summary and data:
            summary = summarize_hotel_search_results(data, extracted_preferences)
        
        # Prepare response with metadata
        response = {
            "hotels": data,
            "search_metadata": {
                "destination": city_code,
                "destination_display": get_city_display_name(city_code),
                "total_results": len(data),
                "search_radius_km": validated_params['radius'],
                "preferences_applied": extracted_preferences,
                "source": "Amadeus API",
                "transparency_note": "Results powered by Amadeus. Prices may vary and are subject to availability."
            }
        }
        
        # Add summary if generated
        if summary:
            response["ai_summary"] = summary
        
        # Add premium features for authenticated users
        if current_user and premium_search:
            response["premium_features"] = {
                "chain_diversity_score": _calculate_chain_diversity(data),
                "price_analysis": _analyze_price_range(data),
                "location_insights": _generate_location_insights(data)
            }
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hotel search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotels/list")
async def list_hotels(
    destination: str = Query(..., description="City name or IATA code"),
    radius: int = Query(5, ge=1, le=50),
    ratings: Optional[List[str]] = Query(None),
    amenities: Optional[List[str]] = Query(None)
):
    """List hotels in a city (without pricing)"""
    try:
        city_code = destination.upper() if len(destination) == 3 else None
        if not city_code:
            locations = get_location_autocomplete(destination)
            if isinstance(locations, list) and len(locations) > 0:
                city_code = locations[0].get("iataCode")
        
        if not city_code:
            raise HTTPException(status_code=400, detail=f"Could not resolve destination: {destination}")

        data = get_hotels_by_city(city_code, radius, ratings or [], amenities or [])
        if isinstance(data, dict) and "error" in data:
            raise HTTPException(status_code=502, detail=data["error"])
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hotel list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
