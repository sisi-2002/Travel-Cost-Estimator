from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from src.agentic_agents.crew_coordinator import TravelCrewCoordinator


router = APIRouter()


class TravelRequest(BaseModel):
    origin: str = Field(..., description="IATA code or city name")
    destination: str = Field(..., description="IATA code or city name")
    departure_date: str = Field(..., description="YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    travelers: int = Field(1, ge=1, le=9)
    budget: Optional[float] = Field(None, ge=0)
    currency: str = Field("USD")
    preferences: Optional[Dict[str, Any]] = None


@router.post("/agentic/estimate-travel-cost")
async def agentic_estimate_travel_cost(request: TravelRequest):
    try:
        coordinator = TravelCrewCoordinator()
        result = await coordinator.execute_travel_analysis(request.model_dump())
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agentic/agent-health-check")
async def agent_health_check():
    return {"status": "healthy", "agents": ["flight", "hotel", "coordinator"], "version": "0.1.0"}


class AgentFeedback(BaseModel):
    session_id: str
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


@router.post("/agentic/agent-feedback")
async def agent_feedback(feedback: AgentFeedback):
    # Persist later; for now acknowledge receipt
    return {"status": "received", "feedback": feedback.model_dump()}


@router.get("/agentic/explain-recommendation")
async def explain_recommendation(session_id: str):
    # Placeholder explanation until Groq + CrewAI integration lands
    return {
        "session_id": session_id,
        "explanation": "This is a placeholder explanation from the agentic system.",
        "confidence": 0.5,
    }


