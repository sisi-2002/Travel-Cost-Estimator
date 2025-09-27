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
  subType?: string;
  detailedName?: string;
  type?: string;
}

export interface HotelSuggestion {
  value: string;
  type?: string;
  location?: string;
  property_token?: string;
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
  _roomQuantity: number = 1,
  maxHotels: number = 10,
  currency: string = "USD",
  preferences?: string,
  includeSummary: boolean = false,
  opts?: {
    sort_by?: 3 | 8 | 13;
    min_price?: number;
    max_price?: number;
    rating?: 7 | 8 | 9;
    hotel_class?: string;
    free_cancellation?: boolean;
    eco_certified?: boolean;
    vacation_rentals?: boolean;
    next_page_token?: string;
    children?: number;
    children_ages?: string; // e.g. "5,8"
  }
): Promise<{
  hotels: HotelOffer[];
  search_metadata?: any;
  ai_summary?: string;
  premium_features?: any;
  serpapi_pagination?: { next_page_token?: string };
}> => {
  const params = new URLSearchParams({
    destination,
    check_in: checkIn,
    check_out: checkOut,
    adults: String(adults),
    max_hotels: String(maxHotels),
    currency,
    include_summary: String(includeSummary)
  });
  
  if (preferences) {
    params.append('preferences', preferences);
  }
  if (opts?.children != null) params.append('children', String(opts.children));
  if (opts?.children_ages) params.append('children_ages', opts.children_ages);
  if (opts?.sort_by) params.append('sort_by', String(opts.sort_by));
  if (opts?.min_price != null) params.append('min_price', String(opts.min_price));
  if (opts?.max_price != null) params.append('max_price', String(opts.max_price));
  if (opts?.rating) params.append('rating', String(opts.rating));
  if (opts?.hotel_class) params.append('hotel_class', opts.hotel_class);
  if (opts?.free_cancellation != null) params.append('free_cancellation', String(opts.free_cancellation));
  if (opts?.eco_certified != null) params.append('eco_certified', String(opts.eco_certified));
  if (opts?.vacation_rentals != null) params.append('vacation_rentals', String(opts.vacation_rentals));
  if (opts?.next_page_token) params.append('next_page_token', opts.next_page_token);
  
  const endpoint = `${buildApiUrl(API_CONFIG.ENDPOINTS.HOTELS.SEARCH)}?${params}`;
  const res = await fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(`Failed to search hotels: ${detail}`);
  }
  
  return res.json();
};

export const getHotelDetails = async (
  property_token: string,
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number = 2,
  currency: string = 'USD'
) => {
  const params = new URLSearchParams({
    property_token,
    destination,
    check_in: checkIn,
    check_out: checkOut,
    adults: String(adults),
    currency,
  });
  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.HOTELS.SEARCH).replace('/search','/details')}?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { const body = await res.json(); if (body?.detail) detail = body.detail; } catch {}
    throw new Error(`Failed to get hotel details: ${detail}`);
  }
  return res.json();
};

export const getHotelLocations = async (keyword: string): Promise<HotelSuggestion[]> => {
  const res = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.HOTELS.LOCATIONS)}?keyword=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`Failed to get hotel locations: ${res.statusText}`);
  }
  
  return res.json();
};