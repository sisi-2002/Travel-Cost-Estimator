from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from datetime import datetime, timedelta
import json

# Import your grok utility (make sure this path is correct)
from utils.grok_api import ask_grok

# Configure logging
logger = logging.getLogger(__name__)



#import Auth and crud
from auth import get_current_active_user
from crud import user_crud
from services.amadeus_service import (
    search_flights, 
    get_airport_autocomplete,  # For get_iata_code_from_city
    get_location_autocomplete, 
    search_hotels_with_offers
)

async def get_iata_code_from_city(city_name: str):
    """Helper function to get IATA code from city name"""
    try:
        suggestions = get_airport_autocomplete(city_name)
        if suggestions and len(suggestions) > 0:
            return suggestions[0].get('iataCode')
        return None
    except Exception as e:
        logger.error(f"Error getting IATA code for city {city_name}: {e}")
        return None
    
router = APIRouter()

class TravelQuery(BaseModel):
    destination: str = Field(..., description="Travel destination")
    origin: str = Field(..., description="Travel origin")
    departure_date: str = Field(..., pattern=r"\d{4}-\d{2}-\d{2}", description="Departure date in YYYY-MM-DD")
    nights: int = Field(..., ge=1, le=365, description="Number of nights")
    total_budget: float = Field(..., ge=0, description="Total budget amount")
    num_travelers: int = Field(..., ge=1, le=20, description="Number of travelers")
    currency: str = Field(default="USD", description="Currency code")
    preferences: List[str] = Field(default=[], description="Travel preferences")
    suggestions: int = Field(default=1, ge=1, le=5, description="Number of suggestions")
    transport: Optional[str] = Field(default=None, description="Preferred transport")
    accommodation: Optional[str] = Field(default=None, description="Accommodation type")
    meal: Optional[str] = Field(default=None, description="Meal preferences")
    activities: Optional[str] = Field(default=None, description="Activity preferences")
    language: Optional[str] = Field(default=None, description="Language preference")

class TravelPlanResponse(BaseModel):
    query: str
    answer: str
@router.post("/generate-travel-plan", response_model=TravelPlanResponse)
async def generate_travel_plan(
    travel_query: TravelQuery,
    current_user: dict = Depends(get_current_active_user)):
    """
    Generate a travel plan using AI based on user preferences
    """
    try:
        logger.info(f"Received travel query for destination: {travel_query.destination} from user: {current_user['email']}")      

        # Check subscription and daily limits
        can_generate = await user_crud.check_can_generate_plan(current_user['id'])
        if not can_generate:
            raise HTTPException(status_code=403, detail="Daily limit reached or subscription expired. Upgrade to premium for unlimited access.")

        subscription_type = current_user.get("subscription_type", "basic")

        # Build the user query prompt
        query = (
            f"Plan a {travel_query.nights}-night trip from {travel_query.origin} to {travel_query.destination} "
            f"starting on {travel_query.departure_date} for {travel_query.num_travelers} people with a total budget of "
            f"{travel_query.total_budget} {travel_query.currency}."
        )
        
        # Add preferences if provided
        if travel_query.preferences:
            query += f" Preferences include: {', '.join(travel_query.preferences)}."
        
        # Add number of suggestions
        query += f" Suggest {travel_query.suggestions} possible itinerary/itineraries."
        
        # Add optional preferences
        if travel_query.transport:
            query += f" Preferred transport: {travel_query.transport}."
        if travel_query.accommodation:
            query += f" Accommodation type: {travel_query.accommodation}."
        if travel_query.meal:
            query += f" Meal preference: {travel_query.meal}."
        if travel_query.activities:
            query += f" Activity preferences: {travel_query.activities}."
        if travel_query.language:
            query += f" Language preference: {travel_query.language}."
        
        # Differentiate based on subscription
        if subscription_type == "basic":
            system_role = (
                "You are a professional travel planner assistant. Provide a simple travel itinerary "
                "with day-by-day activities. Do not include any costs, accommodations, or transportation details."
            )
            query += (
                " Provide a simple day-by-day itinerary with activities only. "
                "Format the response in JSON: {\"itinerary\": [{\"day\": 1, \"activities\": \"Description of activities\"}], \"notes\": \"Additional notes\"}."
            )
        else:  # premium
            system_role = (
                "You are a professional travel planner assistant. Provide detailed, practical travel itineraries "
                "with specific recommendations for activities, and estimate costs. Include a main location (city or province) for each day."
            )
            query += (
                " Provide a detailed day-by-day itinerary with activities, main location for each day, and estimated costs. "
                "Format the response strictly in JSON: {\"itinerary\": [{\"day\": 1, \"location\": \"City or Province Name\", "
                "\"activities\": \"Detailed description of activities\"}, ...], \"estimated_costs\": {\"total\": number, "
                "\"breakdown\": {\"accommodation\": number, \"transport\": number, \"activities\": number, \"meals\": number}}, \"notes\": \"string\"}."
            )
        
        logger.info(f"Generated query: {query}")
        
        # Call Grok API
        answer = ask_grok(query, system_role=system_role)
        
        if not answer:
            raise HTTPException(status_code=500, detail="No response generated from AI service")
        
        # Parse the answer as JSON
        try:
            plan = json.loads(answer)
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI response as JSON. Using raw text.")
            plan = None
        
        # For premium users: Enrich with real flight and hotel data (Expense Agent logic)
        formatted_answer = answer  # Default to raw
        if subscription_type == "premium" and plan:
            # Add flight details
            origin_code = await get_iata_code_from_city(travel_query.origin)
            dest_code = await get_iata_code_from_city(travel_query.destination)
            return_date = (datetime.strptime(travel_query.departure_date, '%Y-%m-%d') + timedelta(days=travel_query.nights + 1)).strftime('%Y-%m-%d')
            
            flight_price = 0
            flight_details = ""
            flights = search_flights(origin_code, dest_code, travel_query.departure_date, return_date, travel_query.num_travelers)
            if flights and not isinstance(flights, dict) or "error" not in flights:
                flight = flights[0]
                flight_price = float(flight["price"]["total"])
                flight_details = f"Round-trip flight from {travel_query.origin} to {travel_query.destination}: {flight_price} {travel_query.currency}\n"
            
            # Add hotel suggestions per day
            hotel_total = 0
            for day in plan["itinerary"]:
                location = day.get("location")
                if location:
                    locs = get_location_autocomplete(location)
                    if locs and isinstance(locs, list) and len(locs) > 0:
                        city_code = locs[0].get("iataCode")
                        if city_code:
                            check_in = (datetime.strptime(travel_query.departure_date, '%Y-%m-%d') + timedelta(days=day["day"] - 1)).strftime('%Y-%m-%d')
                            check_out = (datetime.strptime(travel_query.departure_date, '%Y-%m-%d') + timedelta(days=day["day"])).strftime('%Y-%m-%d')
                            hotels = search_hotels_with_offers(
                                city_code, check_in, check_out, travel_query.num_travelers, 1, 3, travel_query.currency, 5, None, None
                            )
                            if hotels and isinstance(hotels, list) and len(hotels) > 0 and "error" not in hotels:
                                hotel = hotels[0]
                                price = float(hotel["offers"][0]["price"]["total"])
                                hotel_total += price
                                day["hotel_suggestion"] = f"Recommended Hotel near {location}: {hotel['hotel']['name']} - {price} {travel_query.currency} for the night"
                            else:
                                day["hotel_suggestion"] = f"No hotels found near {location}. Estimated accommodation cost: {plan['estimated_costs']['breakdown']['accommodation'] / len(plan['itinerary'])} {travel_query.currency}"
            
            # Update estimated costs with real data
            plan["estimated_costs"]["breakdown"]["transport"] = flight_price + plan["estimated_costs"]["breakdown"].get("transport", 0)
            plan["estimated_costs"]["breakdown"]["accommodation"] = hotel_total
            plan["estimated_costs"]["total"] = sum(plan["estimated_costs"]["breakdown"].values())
            
            # Format enriched plan as markdown text
            formatted = "Your Premium Travel Plan:\n\n"
            formatted += flight_details + "\n"
            for day in plan["itinerary"]:
                formatted += f"**Day {day['day']}: {day.get('location', 'Main Destination')}**\n"
                formatted += f"{day['activities']}\n"
                if "hotel_suggestion" in day:
                    formatted += f"{day['hotel_suggestion']}\n"
                formatted += "\n"
            formatted += "**Estimated Costs Breakdown:**\n"
            for category, amount in plan["estimated_costs"]["breakdown"].items():
                formatted += f"- {category.capitalize()}: {amount} {travel_query.currency}\n"
            formatted += f"**Total Estimated Cost:** {plan['estimated_costs']['total']} {travel_query.currency}\n\n"
            formatted += f"Notes: {plan.get('notes', '')}"
            
            formatted_answer = formatted
        
        elif plan:  # Basic: Format simple
            formatted = "Your Basic Travel Plan:\n\n"
            for day in plan["itinerary"]:
                formatted += f"**Day {day['day']}**\n"
                formatted += f"{day['activities']}\n\n"
            formatted += f"Notes: {plan.get('notes', '')}"
            formatted_answer = formatted
        
        # Update user's plan generation count
        await user_crud.update_plan_generation(current_user['id'])
        
        logger.info("Successfully generated travel plan")
        
        return TravelPlanResponse(query=query, answer=formatted_answer)
    
    except Exception as e:
        logger.error(f"Error in generate_travel_plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Failed to generate travel plan: {str(e)}"
        )

@router.get("/health")
async def plans_health():
    """Health check endpoint for plans router"""
    return {"status": "Plans router is healthy", "service": "travel-planning"}