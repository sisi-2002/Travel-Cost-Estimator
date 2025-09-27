from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from services.serpapi_hotels_service import (
    SerpApiClient,
    map_serp_properties_to_hotel_offers,
)
from services.nlp_service import extract_hotel_preferences, sanitize_user_input
from services.llm_summary_service import summarize_hotel_search_results
from services.security_service import validate_hotel_search_input
from services.city_name_service import get_city_display_name
from services.currency_service import is_direct_supported, fetch_conversion_rate
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
    """Get location autocomplete for hotel search (SerpApi Google Hotels Autocomplete)"""
    try:
        client = SerpApiClient()
        raw = client.hotels_autocomplete(keyword)
        # Filter to accommodation-focused suggestions only
        cleaned = []
        for s in raw.get("suggestions", []):
            value = s.get("value") or s.get("autocomplete_suggestion") or ""
            s_type = s.get("type")
            has_property = bool(s.get("property_token"))
            text = value.lower()
            # Exclude travel terms like flights/plane tickets, keep accommodation or direct properties
            if s_type == "accommodation" or has_property:
                if not ("flights" in text or "plane tickets" in text):
                    cleaned.append({
                        "value": value,
                        "type": s_type,
                        "location": s.get("location"),
                        "property_token": s.get("property_token"),
                    })
        return cleaned[:8]
    except Exception as e:
        logger.error(f"Location autocomplete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotels/search")
async def hotel_search(
    destination: str = Query(..., description="Destination text for Google Hotels 'q' (e.g., 'Bali Resorts' or 'New York hotels')"),
    check_in: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    check_out: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    adults: int = Query(2, ge=1, le=9),
    room_quantity: int = Query(1, ge=1, le=9),
    max_hotels: int = Query(20, ge=1, le=50),
    currency: str = Query("USD", description="Currency code"),
    preferences: Optional[str] = Query(None, description="Natural language preferences"),
    include_summary: bool = Query(False, description="Include AI-generated summary"),
    premium_search: bool = Query(False, description="Premium search features"),
    sort_by: Optional[int] = Query(None, description="3 lowest price, 8 highest rating, 13 most reviewed"),
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    rating: Optional[int] = Query(None, description="7=3.5+, 8=4.0+, 9=4.5+"),
    hotel_class: Optional[str] = None,
    free_cancellation: Optional[bool] = None,
    eco_certified: Optional[bool] = None,
    amenities: Optional[str] = Query(None, description="amenity ids comma-separated"),
    property_types: Optional[str] = Query(None, description="property type ids comma-separated"),
    brands: Optional[str] = Query(None, description="brand ids comma-separated"),
    vacation_rentals: Optional[bool] = None,
    next_page_token: Optional[str] = None,
    current_user = Depends(lambda: None)
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
        
        # Build SerpApi params using destination as free-text q
        client = SerpApiClient()
        serp_params = {
            "q": validated_params['destination'],
            "check_in_date": validated_params['check_in'],
            "check_out_date": validated_params['check_out'],
            "adults": adults,
            "currency": currency if is_direct_supported(currency) else "USD",
        }
        # Map extracted preferences where possible
        if sort_by is not None:
            serp_params["sort_by"] = sort_by
        if min_price is not None:
            serp_params["min_price"] = min_price
        if max_price is not None:
            serp_params["max_price"] = max_price
        if rating is not None:
            serp_params["rating"] = rating
        if hotel_class is not None:
            serp_params["hotel_class"] = hotel_class
        if free_cancellation is not None:
            serp_params["free_cancellation"] = str(bool(free_cancellation)).lower()
        if eco_certified is not None:
            serp_params["eco_certified"] = str(bool(eco_certified)).lower()
        if amenities:
            serp_params["amenities"] = amenities
        if property_types:
            serp_params["property_types"] = property_types
        if brands:
            serp_params["brands"] = brands
        if vacation_rentals is not None:
            serp_params["vacation_rentals"] = str(bool(vacation_rentals)).lower()
        if next_page_token:
            serp_params["next_page_token"] = next_page_token

        raw = client.hotels_search(serp_params)
        if not isinstance(raw, dict):
            raise HTTPException(status_code=502, detail="Invalid response from SerpApi")
        if raw.get("error"):
            code = int(raw.get("status_code") or 502)
            raise HTTPException(status_code=code, detail=str(raw.get("error")))
        properties = raw.get("properties") or []
        mapped = map_serp_properties_to_hotel_offers(properties, validated_params['check_in'], validated_params['check_out'], serp_params["currency"], guests=adults, rooms=room_quantity)

        # If requested currency not directly supported, convert totals
        if not is_direct_supported(currency) and mapped:
            rate = fetch_conversion_rate(serp_params["currency"], currency)
            for m in mapped:
                if m.get("offers"):
                    o = m["offers"][0]
                    try:
                        total = float(o["price"]["total"])
                        converted = round(total * rate, 2)
                        o["price"]["converted_total"] = converted
                        o["price"]["converted_currency"] = currency
                        o["price"]["conversion_rate"] = rate
                    except Exception:
                        pass
        
        # LLM: Generate summary if requested
        summary = None
        if include_summary and mapped:
            summary = summarize_hotel_search_results(mapped, extracted_preferences)
        
        # Prepare response with metadata
        response = {
            "hotels": mapped[:max_hotels],
            "search_metadata": {
                "destination": validated_params['destination'],
                "destination_display": validated_params['destination'],
                "total_results": len(mapped),
                "preferences_applied": extracted_preferences,
                "source": "SerpApi Google Hotels",
                "transparency_note": "Results powered by Google Hotels via SerpApi. Prices may vary and are subject to availability.",
                "serpapi": {
                    "search_metadata": raw.get("search_metadata"),
                }
            }
        }
        # Add pagination token if available
        if raw.get("serpapi_pagination", {}).get("next_page_token"):
            response["serpapi_pagination"] = {
                "next_page_token": raw["serpapi_pagination"]["next_page_token"]
            }
        
        # Add summary if generated
        if summary:
            response["ai_summary"] = summary
        
        # Add premium features for authenticated users
        if current_user and premium_search:
            response["premium_features"] = {
                "chain_diversity_score": _calculate_chain_diversity(mapped),
                "price_analysis": _analyze_price_range(mapped),
                "location_insights": _generate_location_insights(mapped)
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
    destination: str = Query(..., description="Destination text for Google Hotels 'q'"),
    max_hotels: int = Query(20, ge=1, le=50),
):
    """List hotels by destination keyword (without pricing details)"""
    try:
        client = SerpApiClient()
        raw = client.hotels_search({
            "q": destination,
            # Provide dummy 1-night date window to get properties list
            "check_in_date": "2025-09-26",
            "check_out_date": "2025-09-27",
        })
        properties = raw.get("properties", [])
        return properties[:max_hotels]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hotel list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hotels/details")
async def hotel_details(
    property_token: str = Query(..., description="SerpApi property_token"),
    destination: str = Query(..., description="Pass same 'q' as search"),
    check_in: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    check_out: str = Query(..., regex=r"\d{4}-\d{2}-\d{2}"),
    adults: int = Query(2, ge=1, le=9),
    currency: str = Query("USD")
):
    try:
        client = SerpApiClient()
        raw = client.hotel_property_details({
            "q": destination,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "adults": adults,
            "currency": currency,
            "property_token": property_token,
        })
        if isinstance(raw, dict) and raw.get("error"):
            code = int(raw.get("status_code") or 502)
            raise HTTPException(status_code=code, detail=str(raw.get("error")))
        return raw
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hotel details error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
