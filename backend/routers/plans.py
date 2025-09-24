from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from datetime import datetime, timedelta

# Import your grok utility (make sure this path is correct)
from utils.grok_api import ask_grok

# Configure logging
logger = logging.getLogger(__name__)



#import Auth and crud
from auth import get_current_active_user
from crud import user_crud

router = APIRouter()

class TravelQuery(BaseModel):
    destination: str = Field(..., description="Travel destination")
    origin:str=Field(..., description="Travel origin")
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


        # Build the user query prompt
        query = (
            f"Plan a {travel_query.nights}-night trip from {travel_query.origin} to {travel_query.destination} "
            f"for {travel_query.num_travelers} people with a total budget of "
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
        
        # Add additional instructions for better output
        query += (
            " Please provide a detailed day-by-day itinerary with estimated costs, "
            "recommended accommodations, transportation options, and must-visit attractions. "
            "Format the response in a clear, easy-to-read structure."
        )
        
        logger.info(f"Generated query: {query}")
        
        # Call Grok API
        system_role = (
            "You are a professional travel planner assistant. Provide detailed, practical travel itineraries "
            "with specific recommendations for accommodations, activities, transportation, and budgets. "
            "Include estimated costs, timing, and helpful tips. Format your response clearly with "
            "day-by-day breakdowns, cost estimates, and practical advice."
        )
        
        answer = ask_grok(query, system_role=system_role)
        
        if not answer:
            raise HTTPException(status_code=500, detail="No response generated from AI service")
        
        # Update user's plan generation count
        await user_crud.update_plan_generation(current_user['id'])
        
        logger.info("Successfully generated travel plan")
        
        return TravelPlanResponse(query=query, answer=answer)
    
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