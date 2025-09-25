# backend/services/amadeus_service.py
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import os

load_dotenv() # Load environment variables

AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")

amadeus = Client(
    client_id=AMADEUS_CLIENT_ID,
    client_secret=AMADEUS_CLIENT_SECRET,
    hostname="test"
)

def search_flights(origin: str, destination: str, departure_date: str, return_date: str = None, adults: int = 1):
    """
    Searches for flight offers using the Amadeus Flight Offers Search API.
    """
    try:
        # Flight Offers Search API
        # For one-way flights, omit the returnDate parameter
        if return_date:
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=destination,
                departureDate=departure_date,
                returnDate=return_date,
                adults=adults,
                max=10  # Limit to 10 results for now
            )
        else:
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=destination,
                departureDate=departure_date,
                adults=adults,
                max=10
            )
        return response.data
    except ResponseError as error:
        print(f"Amadeus API Error: {error}")
        return {"error": str(error)}

def get_airport_autocomplete(keyword: str):
    """
    Provides airport/city autocomplete suggestions using the Amadeus Airport & City Search API.
    Prioritizes cities over airports for better user experience.
    """
    try:
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType=['CITY', 'AIRPORT']  # Put CITY first to prioritize cities
        )
        
        # Sort results to show cities first, then airports
        if response.data:
            # Separate cities and airports
            cities = [item for item in response.data if item.get('subType') == 'CITY']
            airports = [item for item in response.data if item.get('subType') == 'AIRPORT']
            
            # Return cities first, then airports
            return cities + airports
        
        return response.data
    except ResponseError as error:
        print(f"Amadeus API Error: {error}")
        return {"error": str(error)}

def get_location_autocomplete(keyword: str):
    """
    Provides city/location autocomplete suggestions for hotel search using the Amadeus Airport & City Search API.
    """
    try:
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType=['CITY']
        )
        return response.data
    except ResponseError as error:
        print(f"Amadeus API Error: {error}")
        return {"error": str(error)}

def get_hotels_by_city(city_code: str, radius: int = 5, ratings: list = None, amenities: list = None):
    """
    Get hotel list by city using Amadeus Hotel List API (v1)
    """
    try:
        # Note: This uses the existing amadeus client but calls v1 endpoint
        response = amadeus.reference_data.locations.hotels.by_city.get(
            cityCode=city_code,
            radius=radius,
            ratings=ratings or [],
            amenities=amenities or []
        )
        return response.data
    except ResponseError as error:
        print(f"Amadeus Hotel List API Error: {error}")
        return {"error": str(error)}

def get_hotel_offers(hotel_ids: list, check_in: str, check_out: str, adults: int = 1, room_quantity: int = 1, currency: str = "USD"):
    """
    Get hotel offers using Amadeus Hotel Search API (v3)
    """
    try:
        # This requires a separate client for v3 API
        from amadeus import Client as AmadeusClient
        
        amadeus_v3 = AmadeusClient(
            client_id=AMADEUS_CLIENT_ID,
            client_secret=AMADEUS_CLIENT_SECRET,
            hostname="test"
        )
        
        # Use the correct API structure for hotel offers
        response = amadeus_v3.shopping.hotel_offers_search.get(
            hotelIds=hotel_ids,
            checkInDate=check_in,
            checkOutDate=check_out,
            adults=adults,
            roomQuantity=room_quantity,
            currency=currency
        )
        return response.data
    except ResponseError as error:
        print(f"Amadeus Hotel Offers API Error: {error}")
        return {"error": str(error)}

def get_hotels_by_geocode(latitude: float, longitude: float, radius: int = 5, ratings: list = None, amenities: list = None):
    """
    Get hotel list by geocode using Amadeus Hotel List API (v1)
    """
    try:
        response = amadeus.reference_data.locations.hotels.by_geocode.get(
            latitude=latitude,
            longitude=longitude,
            radius=radius,
            ratings=ratings or [],
            amenities=amenities or []
        )
        return response.data
    except ResponseError as error:
        print(f"Amadeus Hotel Geocode API Error: {error}")
        return {"error": str(error)}

def search_hotels_with_offers(city_code: str, check_in: str, check_out: str, adults: int = 1, room_quantity: int = 1, max_hotels: int = 10, currency: str = "USD", radius: int = 5, ratings: list = None, amenities: list = None):
    """
    Combined search: Get hotels by city, then get offers for top hotels
    Enhanced with NLP-extracted preferences
    """
    try:
        # Step 1: Get hotel list with preferences
        hotels = get_hotels_by_city(city_code, radius, ratings, amenities)
        if isinstance(hotels, dict) and "error" in hotels:
            return hotels
            
        if not hotels or len(hotels) == 0:
            return {"error": "No hotels found for the specified city"}
        
        # Step 2: Sort hotels by distance (if available) and rating
        def sort_key(hotel):
            distance = hotel.get("distance", {}).get("value", 999)
            rating = len(hotel.get("ratings", []))  # Use number of ratings as proxy for quality
            return (distance, -rating)
        
        hotels_sorted = sorted(hotels, key=sort_key)
        
        # Step 3: Get hotel IDs (limit to max_hotels)
        hotel_ids = [hotel["hotelId"] for hotel in hotels_sorted[:max_hotels]]
        
        # Step 4: Get offers for these hotels
        offers = get_hotel_offers(hotel_ids, check_in, check_out, adults, room_quantity, currency)
        if isinstance(offers, dict) and "error" in offers:
            return offers
            
        # Step 5: Combine hotel info with offers and add price breakdown
        result = []
        for offer in offers:
            if offer.get("available", False):
                hotel_info = next((h for h in hotels_sorted if h["hotelId"] == offer["hotel"]["hotelId"]), {})
                
                # Calculate price breakdown for each offer
                enhanced_offers = []
                for hotel_offer in offer["offers"]:
                    price_breakdown = _calculate_price_breakdown(
                        hotel_offer, adults, room_quantity, check_in, check_out
                    )
                    enhanced_offer = {
                        **hotel_offer,
                        "price_breakdown": price_breakdown
                    }
                    enhanced_offers.append(enhanced_offer)
                
                combined = {
                    "hotel": {
                        **hotel_info,
                        **offer["hotel"]
                    },
                    "offers": enhanced_offers,
                    "available": offer["available"],
                    "search_metadata": {
                        "search_type": "city_based",
                        "radius_km": radius,
                        "preferences_applied": {
                            "ratings": ratings or [],
                            "amenities": amenities or []
                        }
                    }
                }
                result.append(combined)
        
        return result
    except Exception as e:
        print(f"Combined hotel search error: {e}")
        return {"error": str(e)}

def _calculate_price_breakdown(offer, adults, room_quantity, check_in, check_out):
    """
    Calculate detailed price breakdown for hotel offer
    
    Args:
        offer: Hotel offer data from Amadeus
        adults: Number of adults
        room_quantity: Number of rooms
        check_in: Check-in date
        check_out: Check-out date
        
    Returns:
        Dictionary with price breakdown details
    """
    try:
        from datetime import datetime
        
        # Parse dates to calculate nights
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d')
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d')
        nights = (check_out_date - check_in_date).days
        
        price_data = offer.get("price", {})
        total = float(price_data.get("total", 0))
        base = float(price_data.get("base", 0))
        currency = price_data.get("currency", "USD")
        
        # Calculate per-night and per-room rates
        per_night_total = total / nights if nights > 0 else total
        per_room_per_night = per_night_total / room_quantity if room_quantity > 0 else per_night_total
        
        # Estimate base rate per room per night
        base_per_room_per_night = base / nights / room_quantity if nights > 0 and room_quantity > 0 else base
        
        # Calculate additional fees
        additional_fees = total - base if total > base else 0
        
        breakdown = {
            "total_cost": round(total, 2),
            "base_cost": round(base, 2),
            "additional_fees": round(additional_fees, 2),
            "currency": currency,
            "nights": nights,
            "rooms": room_quantity,
            "adults": adults,
            "per_night_total": round(per_night_total, 2),
            "per_room_per_night": round(per_room_per_night, 2),
            "base_per_room_per_night": round(base_per_room_per_night, 2),
            "breakdown_explanation": _generate_price_explanation(
                adults, room_quantity, nights, total, per_room_per_night, currency
            )
        }
        
        return breakdown
        
    except Exception as e:
        print(f"Price breakdown calculation error: {e}")
        return {
            "total_cost": offer.get("price", {}).get("total", 0),
            "currency": offer.get("price", {}).get("currency", "USD"),
            "error": "Could not calculate detailed breakdown"
        }

def _generate_price_explanation(adults, rooms, nights, total, per_room_rate, currency):
    """Generate human-readable price explanation"""
    if nights == 0:
        return f"Total: {currency} {total}"
    
    explanation = f"Total for {nights} night{'s' if nights > 1 else ''}: {currency} {total}"
    
    if rooms > 1:
        explanation += f" ({rooms} rooms × {currency} {per_room_rate:.2f} per room per night)"
    else:
        explanation += f" ({currency} {per_room_rate:.2f} per night)"
    
    if adults > 2:
        explanation += f" for {adults} adults"
    elif adults == 2:
        explanation += f" for 2 adults"
    else:
        explanation += f" for 1 adult"
    
    return explanation