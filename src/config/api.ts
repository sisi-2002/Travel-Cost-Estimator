// =======================
// API Configuration
// =======================
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8005',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/v1/auth/register',
      LOGIN: '/api/v1/auth/login',
      ME: '/api/v1/auth/me',
    },
    FLIGHTS: {
      SEARCH: '/api/v1/flights/search',
      AIRPORTS: '/api/v1/flights/airports',
    },
    HOTELS: {
      SEARCH: '/api/v1/hotels/search',
      LIST: '/api/v1/hotels/list',
      LOCATIONS: '/api/v1/hotels/locations',
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// =======================
// Types
// =======================
export interface Airport {
  id: string;
  iataCode: string;
  name: string;
  // Add other properties as needed
}

export interface FlightOffer {
  id: string;
  itineraries: Itinerary[];
  price: {
    currency: string;
    total: string;
  };
}

export interface Itinerary {
  segments: Segment[];
}

export interface Segment {
  departure: {
    iataCode: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    at: string;
  };
  carrierCode: string;
  number: string;
}

export interface PriceBreakdown {
  total_cost: number;
  base_cost: number;
  additional_fees: number;
  currency: string;
  nights: number;
  rooms: number;
  adults: number;
  per_night_total: number;
  per_room_per_night: number;
  base_per_room_per_night: number;
  breakdown_explanation: string;
}

export interface HotelOffer {
  hotel: {
    hotelId: string;
    name: string;
    chainCode: string;
    cityCode: string;
    latitude?: number;
    longitude?: number;
    distance?: {
      value: number;
      unit: string;
    };
  };
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    room: {
      type: string;
      description?: {
        text: string;
        lang: string;
      };
    };
    policies?: {
      paymentType: string;
      cancellation?: {
        type: string;
        description?: {
          text: string;
        };
      };
    };
    price_breakdown?: PriceBreakdown;
  }>;
  available: boolean;
}

// =======================
// API Calls (fetch-based)
// =======================

// Auth
export const registerUser = async (data: Record<string, unknown>) => {
  const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return res.json();
};

export const loginUser = async (data: Record<string, unknown>) => {
  const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return res.json();
};

export const getCurrentUser = async () => {
  const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.ME), {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

// Flights
export const searchFlights = async (
  origin: string, 
  destination: string, 
  departureDate: string, 
  returnDate?: string, 
  adults: number = 1
): Promise<FlightOffer[]> => {
  const params = new URLSearchParams({
    origin,
    destination,
    departure_date: departureDate,
    adults: adults.toString(),
  });
  if (returnDate) {
    params.append('return_date', returnDate);
  }

  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.FLIGHTS.SEARCH)}?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to search flights: ${res.statusText}`);
  }
  
  return res.json();
};

export const getAirportAutocomplete = async (keyword: string): Promise<Airport[]> => {
  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.FLIGHTS.AIRPORTS)}?keyword=${keyword}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to get airport suggestions: ${res.statusText}`);
  }
  
  return res.json();
};

// Hotels
export const searchHotels = async (
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number = 1,
  roomQuantity: number = 1,
  maxHotels: number = 10,
  currency: string = "USD",
  radius: number = 5,
  preferences?: string,
  includeSummary: boolean = false
): Promise<{
  hotels: HotelOffer[];
  search_metadata?: any;
  ai_summary?: string;
  premium_features?: any;
}> => {
  const params = new URLSearchParams({
    destination,
    check_in: checkIn,
    check_out: checkOut,
    adults: String(adults),
    room_quantity: String(roomQuantity),
    max_hotels: String(maxHotels),
    currency,
    radius: String(radius),
    include_summary: String(includeSummary)
  });
  
  if (preferences) {
    params.append('preferences', preferences);
  }
  
  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.HOTELS.SEARCH)}?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to search hotels: ${res.statusText}`);
  }
  
  return res.json();
};

export const getHotelLocations = async (keyword: string): Promise<Airport[]> => {
  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.HOTELS.LOCATIONS)}?keyword=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to get hotel locations: ${res.statusText}`);
  }
  
  return res.json();
};