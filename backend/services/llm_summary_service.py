"""
LLM Summary Service for Hotel Agent
Uses Grok API for intelligent hotel offer summarization
"""

import os
from typing import List, Dict, Any
import logging
from utils.grok_api import ask_grok

logger = logging.getLogger(__name__)

class HotelSummaryGenerator:
    """Generate intelligent summaries of hotel search results using LLM"""
    
    def __init__(self):
        self.system_prompt = """You are a professional travel advisor specializing in hotel recommendations. 
        Your task is to provide clear, concise, and helpful summaries of hotel search results.
        
        Guidelines:
        1. Highlight the best value options
        2. Mention key amenities and features
        3. Note any special considerations (location, cancellation policies)
        4. Keep summaries under 200 words
        5. Use a friendly, professional tone
        6. Focus on practical information travelers need
        """
    
    def summarize_hotel_results(self, hotels: List[Dict[str, Any]], user_preferences: Dict[str, List[str]] = None) -> str:
        """
        Generate a summary of hotel search results
        
        Args:
            hotels: List of hotel search results
            user_preferences: Extracted preferences from NLP
            
        Returns:
            Summary text
        """
        if not hotels:
            return "No hotels found matching your criteria."
        
        # Prepare hotel data for summarization
        hotel_summary_data = []
        for hotel in hotels[:5]:  # Limit to top 5 for summary
            hotel_data = hotel.get("hotel", {})
            offers = hotel.get("offers", [])
            
            if offers:
                best_offer = offers[0]  # Assuming first offer is best
                price = best_offer.get("price", {})
                
                hotel_info = {
                    "name": hotel_data.get("name", "Unknown Hotel"),
                    "price": f"{price.get('total', 'N/A')} {price.get('currency', 'USD')}",
                    "chain": hotel_data.get("chainCode", ""),
                    "distance": hotel_data.get("distance", {}).get("value", "N/A"),
                    "distance_unit": hotel_data.get("distance", {}).get("unit", "km"),
                    "cancellation": best_offer.get("policies", {}).get("cancellation", {}).get("type", "Unknown")
                }
                hotel_summary_data.append(hotel_info)
        
        # Create prompt for LLM
        prompt = self._create_summary_prompt(hotel_summary_data, user_preferences)
        
        try:
            summary = ask_grok(prompt, system_role=self.system_prompt)
            return summary or "Unable to generate summary at this time."
        except Exception as e:
            logger.error(f"Error generating hotel summary: {e}")
            return self._fallback_summary(hotel_summary_data)
    
    def _create_summary_prompt(self, hotels: List[Dict], preferences: Dict[str, List[str]]) -> str:
        """Create a prompt for LLM summarization"""
        
        hotel_list = ""
        for i, hotel in enumerate(hotels, 1):
            hotel_list += f"{i}. {hotel['name']} - {hotel['price']}"
            if hotel['distance'] != 'N/A':
                hotel_list += f" ({hotel['distance']}{hotel['distance_unit']} from city center)"
            hotel_list += f" - {hotel['cancellation']} cancellation\n"
        
        preferences_text = ""
        if preferences:
            preferences_text = "\nUser Preferences: "
            if preferences.get("amenities"):
                preferences_text += f"Amenities: {', '.join(preferences['amenities'])}. "
            if preferences.get("ratings"):
                preferences_text += f"Star Rating: {', '.join(preferences['ratings'])}. "
            if preferences.get("chains"):
                preferences_text += f"Hotel Chains: {', '.join(preferences['chains'])}. "
        
        prompt = f"""Please provide a helpful summary of these hotel search results in a clean, easy-to-read format:

{hotel_list}{preferences_text}

Please format your response as follows:

**Quick Overview:** (2-3 sentences about the best options)

**Best Options:**
• Hotel 1: Price - Key features
• Hotel 2: Price - Key features

**Key Considerations:**
• Point 1
• Point 2

**Value Recommendations:**
• Recommendation 1
• Recommendation 2

**Important Notes:**
• Note 1
• Note 2

Keep the summary concise, practical, and easy to scan. Use bullet points and clear formatting."""

        return prompt
    
    def _fallback_summary(self, hotels: List[Dict]) -> str:
        """Generate a basic summary without LLM"""
        if not hotels:
            return "No hotels found."
        
        summary = f"Found {len(hotels)} hotel options:\n\n"
        
        for i, hotel in enumerate(hotels[:3], 1):
            summary += f"{i}. {hotel['name']} - {hotel['price']}"
            if hotel['distance'] != 'N/A':
                summary += f" ({hotel['distance']}{hotel['distance_unit']} from center)"
            summary += "\n"
        
        if len(hotels) > 3:
            summary += f"\n... and {len(hotels) - 3} more options available."
        
        return summary

def summarize_hotel_search_results(hotels: List[Dict[str, Any]], user_preferences: Dict[str, List[str]] = None) -> str:
    """
    Main function to summarize hotel search results
    
    Args:
        hotels: List of hotel search results
        user_preferences: Extracted preferences from NLP
        
    Returns:
        Summary text
    """
    generator = HotelSummaryGenerator()
    return generator.summarize_hotel_results(hotels, user_preferences)
