"""
NLP Service for Hotel Agent
Handles Natural Language Processing for user preferences extraction
Uses regex-based approach for better Windows compatibility
"""

import re
from typing import List, Dict, Set, Optional
import logging

logger = logging.getLogger(__name__)

# Amadeus amenities mapping
AMADEUS_AMENITIES = {
    "swimming pool": "SWIMMING_POOL",
    "spa": "SPA",
    "gym": "FITNESS_CENTER",
    "fitness center": "FITNESS_CENTER",
    "air conditioning": "AIR_CONDITIONING",
    "restaurant": "RESTAURANT",
    "parking": "PARKING",
    "pet friendly": "PETS_ALLOWED",
    "pets allowed": "PETS_ALLOWED",
    "airport shuttle": "AIRPORT_SHUTTLE",
    "business center": "BUSINESS_CENTER",
    "wifi": "WIFI",
    "wi-fi": "WIFI",
    "meeting rooms": "MEETING_ROOMS",
    "tennis": "TENNIS",
    "golf": "GOLF",
    "kitchen": "KITCHEN",
    "beach": "BEACH",
    "casino": "CASINO",
    "jacuzzi": "JACUZZI",
    "sauna": "SAUNA",
    "massage": "MASSAGE",
    "bar": "BAR or LOUNGE",
    "lounge": "BAR or LOUNGE",
    "room service": "ROOM_SERVICE"
}

# Star rating patterns
RATING_PATTERNS = {
    r"\b5\s*star\b": "5",
    r"\b4\s*star\b": "4", 
    r"\b3\s*star\b": "3",
    r"\b2\s*star\b": "2",
    r"\b1\s*star\b": "1",
    r"\bluxury\b": "5",
    r"\bbudget\b": "2",
    r"\bcheap\b": "1",
    r"\bmid\s*range\b": "3",
    r"\bpremium\b": "4"
}

class HotelPreferenceExtractor:
    """Extract hotel preferences from natural language input"""
    
    def __init__(self):
        pass
        
    def extract_preferences(self, text: str) -> Dict[str, List[str]]:
        """
        Extract hotel preferences from natural language text
        
        Args:
            text: User input text (e.g., "I want a luxury hotel in Paris with spa and gym")
            
        Returns:
            Dictionary with extracted preferences
        """
        if not text:
            return {"amenities": [], "ratings": [], "locations": [], "chains": []}
            
        text_lower = text.lower()
        
        # Extract different types of preferences
        amenities = self._extract_amenities(text_lower)
        ratings = self._extract_ratings(text_lower)
        locations = self._extract_locations(text_lower)
        chains = self._extract_chains(text_lower)
        
        return {
            "amenities": amenities,
            "ratings": ratings,
            "locations": locations,
            "chains": chains
        }
    
    def _extract_amenities(self, text: str) -> List[str]:
        """Extract amenities from text using regex patterns"""
        amenities = []
        
        # Check for exact matches and variations
        for amenity_key, amenity_code in AMADEUS_AMENITIES.items():
            # Create pattern for the amenity (with word boundaries)
            pattern = r'\b' + re.escape(amenity_key) + r'\b'
            if re.search(pattern, text):
                amenities.append(amenity_code)
        
        # Additional patterns for common variations
        amenity_patterns = {
            r'\bpool\b': "SWIMMING_POOL",
            r'\bworkout\b': "FITNESS_CENTER",
            r'\bexercise\b': "FITNESS_CENTER",
            r'\bfree\s+wifi\b': "WIFI",
            r'\binternet\b': "WIFI",
            r'\bwireless\b': "WIFI",
            r'\bpark\b': "PARKING",
            r'\bvalet\b': "VALET_PARKING"
        }
        
        for pattern, code in amenity_patterns.items():
            if re.search(pattern, text):
                amenities.append(code)
        
        return list(set(amenities))  # Remove duplicates
    
    def _extract_ratings(self, text: str) -> List[str]:
        """Extract star ratings from text"""
        ratings = []
        
        for pattern, rating in RATING_PATTERNS.items():
            if re.search(pattern, text):
                ratings.append(rating)
        
        return list(set(ratings))
    
    def _extract_locations(self, text: str) -> List[str]:
        """Extract location entities using regex patterns"""
        locations = []
        
        # Common city patterns
        city_patterns = [
            r'\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # "in Paris", "in New York"
            r'\bnear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # "near London"
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+area\b',  # "Paris area"
        ]
        
        for pattern in city_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if len(match.split()) <= 3:  # Limit to reasonable city names
                    locations.append(match.strip())
        
        # Known major cities (case-insensitive matching)
        major_cities = [
            'paris', 'london', 'new york', 'tokyo', 'sydney', 'dubai', 'singapore',
            'berlin', 'rome', 'madrid', 'barcelona', 'amsterdam', 'vienna', 'prague',
            'budapest', 'warsaw', 'moscow', 'istanbul', 'cairo', 'cape town',
            'rio de janeiro', 'buenos aires', 'mexico city', 'toronto', 'vancouver',
            'san francisco', 'los angeles', 'chicago', 'miami', 'boston', 'seattle'
        ]
        
        for city in major_cities:
            if re.search(r'\b' + re.escape(city) + r'\b', text):
                locations.append(city.title())
        
        return list(set(locations))
    
    def _extract_chains(self, text: str) -> List[str]:
        """Extract hotel chain names"""
        # Common hotel chain patterns
        chain_patterns = [
            r"\bmarriott\b", r"\bhyatt\b", r"\bhilton\b", r"\bihg\b",
            r"\baccor\b", r"\bwyndham\b", r"\bchoice\b", r"\bradisson\b",
            r"\bintercontinental\b", r"\bfour\s*seasons\b", r"\britz\b",
            r"\bsheraton\b", r"\bwestin\b", r"\bnovotel\b", r"\bmercure\b"
        ]
        
        chains = []
        
        for pattern in chain_patterns:
            match = re.search(pattern, text)
            if match:
                chains.append(match.group().strip())
        
        return chains

def extract_hotel_preferences(text: str) -> Dict[str, List[str]]:
    """
    Main function to extract hotel preferences from natural language
    
    Args:
        text: User input text
        
    Returns:
        Dictionary with extracted preferences
    """
    extractor = HotelPreferenceExtractor()
    return extractor.extract_preferences(text)

def sanitize_user_input(text: str) -> str:
    """
    Sanitize user input for security
    
    Args:
        text: Raw user input
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove potentially harmful characters
    text = re.sub(r'[<>"\']', '', text)
    
    # Limit length
    text = text[:500]
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    return text.strip()
