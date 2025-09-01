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
    """
    try:
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType=['AIRPORT', 'CITY']
        )
        return response.data
    except ResponseError as error:
        print(f"Amadeus API Error: {error}")
        return {"error": str(error)}