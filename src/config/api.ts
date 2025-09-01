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