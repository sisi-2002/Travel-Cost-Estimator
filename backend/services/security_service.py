"""
Security Service for Hotel Agent
Handles input sanitization, validation, and authentication
"""

import re
from typing import Any, Dict, List, Optional
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

class HotelSecurityValidator:
    """Validates and sanitizes hotel search inputs"""
    
    def __init__(self):
        # Dangerous patterns to block
        self.blocked_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe.*?>',
            r'<object.*?>',
            r'<embed.*?>',
            r'<link.*?>',
            r'<meta.*?>',
            r'<style.*?>.*?</style>',
            r'expression\s*\(',
            r'url\s*\(',
            r'@import',
            r'data:text/html',
            r'vbscript:',
            r'data:image/svg\+xml'
        ]
        
        # Valid date format
        self.date_pattern = r'^\d{4}-\d{2}-\d{2}$'
        
        # Valid currency codes (broad ISO set incl. LKR). We keep a permissive list
        # to allow backend conversion for unsupported-by-Google currencies.
        self.valid_currencies = {
            'USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','SEK','NZD','MXN','SGD','HKD','NOK','TRY','RUB','ZAR','BRL','INR','KRW',
            'LKR','MYR','AED','SAR','IDR','THB','PHP','BDT','PKR','EGP','ILS','PLN','CZK','HUF','DKK','RON','BGN','CLP','COP','ARS','PEN','UAH'
        }
        
        # Valid Amadeus amenities
        self.valid_amenities = {
            'SWIMMING_POOL', 'SPA', 'FITNESS_CENTER', 'AIR_CONDITIONING', 'RESTAURANT',
            'PARKING', 'PETS_ALLOWED', 'AIRPORT_SHUTTLE', 'BUSINESS_CENTER', 'DISABLED_FACILITIES',
            'WIFI', 'MEETING_ROOMS', 'NO_KID_ALLOWED', 'TENNIS', 'GOLF', 'KITCHEN',
            'ANIMAL_WATCHING', 'BABY-SITTING', 'BEACH', 'CASINO', 'JACUZZI', 'SAUNA',
            'SOLARIUM', 'MASSAGE', 'VALET_PARKING', 'BAR or LOUNGE', 'KIDS_WELCOME',
            'NO_PORN_FILMS', 'MINIBAR', 'TELEVISION', 'WI-FI_IN_ROOM', 'ROOM_SERVICE',
            'GUARDED_PARKG', 'SERV_SPEC_MENU'
        }
        
        # Valid star ratings
        self.valid_ratings = {'1', '2', '3', '4', '5'}
    
    def sanitize_text_input(self, text: str, max_length: int = 500) -> str:
        """
        Sanitize text input for security
        
        Args:
            text: Raw input text
            max_length: Maximum allowed length
            
        Returns:
            Sanitized text
        """
        if not text:
            return ""
        
        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Check for blocked patterns
        for pattern in self.blocked_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Blocked potentially malicious input: {pattern}")
                return ""
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Limit length
        text = text[:max_length]
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def validate_date(self, date_str: str) -> bool:
        """
        Validate date format and ensure it's not in the past
        
        Args:
            date_str: Date string in YYYY-MM-DD format
            
        Returns:
            True if valid, False otherwise
        """
        if not re.match(self.date_pattern, date_str):
            return False
        
        try:
            parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            return parsed_date >= date.today()
        except ValueError:
            return False
    
    def validate_date_range(self, check_in: str, check_out: str) -> bool:
        """
        Validate that check-out is after check-in
        
        Args:
            check_in: Check-in date string
            check_out: Check-out date string
            
        Returns:
            True if valid range, False otherwise
        """
        if not self.validate_date(check_in) or not self.validate_date(check_out):
            return False
        
        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            return check_out_date > check_in_date
        except ValueError:
            return False
    
    def validate_currency(self, currency: str) -> bool:
        """
        Validate currency code
        
        Args:
            currency: Currency code string
            
        Returns:
            True if valid, False otherwise
        """
        return currency.upper() in self.valid_currencies
    
    def validate_amenities(self, amenities: List[str]) -> List[str]:
        """
        Validate and filter amenities list
        
        Args:
            amenities: List of amenity codes
            
        Returns:
            List of valid amenities
        """
        if not amenities:
            return []
        
        valid_amenities = []
        for amenity in amenities:
            if amenity.upper() in self.valid_amenities:
                valid_amenities.append(amenity.upper())
            else:
                logger.warning(f"Invalid amenity code: {amenity}")
        
        return valid_amenities
    
    def validate_ratings(self, ratings: List[str]) -> List[str]:
        """
        Validate and filter ratings list
        
        Args:
            ratings: List of rating strings
            
        Returns:
            List of valid ratings
        """
        if not ratings:
            return []
        
        valid_ratings = []
        for rating in ratings:
            if rating in self.valid_ratings:
                valid_ratings.append(rating)
            else:
                logger.warning(f"Invalid rating: {rating}")
        
        return valid_ratings
    
    def validate_numeric_range(self, value: int, min_val: int, max_val: int) -> bool:
        """
        Validate numeric value is within range
        
        Args:
            value: Value to validate
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            True if valid, False otherwise
        """
        return min_val <= value <= max_val
    
    def validate_hotel_search_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and sanitize all hotel search parameters
        
        Args:
            params: Dictionary of search parameters
            
        Returns:
            Dictionary with validated and sanitized parameters
        """
        validated = {}
        
        # Sanitize destination
        if 'destination' in params:
            destination = self.sanitize_text_input(str(params['destination']), 100)
            if destination:
                validated['destination'] = destination
            else:
                raise ValueError("Invalid destination provided")
        
        # Validate dates
        if 'check_in' in params and 'check_out' in params:
            check_in = str(params['check_in'])
            check_out = str(params['check_out'])
            
            if not self.validate_date_range(check_in, check_out):
                raise ValueError("Invalid date range provided")
            
            validated['check_in'] = check_in
            validated['check_out'] = check_out
        
        # Validate numeric parameters
        if 'adults' in params:
            adults = int(params['adults'])
            if not self.validate_numeric_range(adults, 1, 9):
                raise ValueError("Invalid number of adults")
            validated['adults'] = adults
        
        if 'room_quantity' in params:
            rooms = int(params['room_quantity'])
            if not self.validate_numeric_range(rooms, 1, 9):
                raise ValueError("Invalid room quantity")
            validated['room_quantity'] = rooms
        
        if 'max_hotels' in params:
            max_hotels = int(params['max_hotels'])
            if not self.validate_numeric_range(max_hotels, 1, 50):
                raise ValueError("Invalid max hotels value")
            validated['max_hotels'] = max_hotels
        
        if 'radius' in params:
            radius = int(params['radius'])
            if not self.validate_numeric_range(radius, 1, 50):
                raise ValueError("Invalid radius value")
            validated['radius'] = radius
        
        # Validate currency
        if 'currency' in params:
            currency = str(params['currency']).upper()
            if not self.validate_currency(currency):
                raise ValueError("Invalid currency code")
            validated['currency'] = currency
        
        # Validate amenities
        if 'amenities' in params:
            amenities = params['amenities']
            if isinstance(amenities, list):
                validated['amenities'] = self.validate_amenities(amenities)
        
        # Validate ratings
        if 'ratings' in params:
            ratings = params['ratings']
            if isinstance(ratings, list):
                validated['ratings'] = self.validate_ratings(ratings)
        
        # Sanitize preferences text
        if 'preferences' in params:
            preferences = self.sanitize_text_input(str(params['preferences']), 1000)
            if preferences:
                validated['preferences'] = preferences
        
        return validated

def validate_hotel_search_input(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to validate hotel search input
    
    Args:
        params: Dictionary of search parameters
        
    Returns:
        Validated and sanitized parameters
        
    Raises:
        ValueError: If validation fails
    """
    validator = HotelSecurityValidator()
    return validator.validate_hotel_search_params(params)
