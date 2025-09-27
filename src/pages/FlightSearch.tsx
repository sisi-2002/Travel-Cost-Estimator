import { useState } from 'react';
import { searchFlights, getAirportAutocomplete } from '../config/api';
import { FlightOffer, Airport } from '../types/index';

const FlightSearch = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1
  });
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch airport suggestions for origin and destination fields
    if ((name === 'origin' || name === 'destination') && value.length > 2) {
      setActiveField(name);
      fetchAirportSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const fetchAirportSuggestions = async (keyword: string) => {
    try {
      const data = await getAirportAutocomplete(keyword);
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching airport suggestions:', err);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: Airport, field: string) => {
    setFormData(prev => ({ ...prev, [field]: suggestion.iataCode }));
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearchPerformed(true);
    
    try {
      console.log('Searching flights with:', formData);
      const data = await searchFlights(
        formData.origin,
        formData.destination,
        formData.departureDate,
        formData.returnDate || undefined,
        formData.adults
      );
      console.log('Flight search results:', data);
      setFlights(data);
    } catch (err: unknown) {
      console.error('Flight search error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while searching for flights';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check the structure of flight data
  const debugFlightData = () => {
    console.log('Current flights state:', flights);
    if (flights.length > 0) {
      console.log('First flight structure:', flights[0]);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-3xl font-bold mb-6">Flight Price Agent</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="City or airport code"
              required
            />
            {activeField === 'origin' && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((location) => (
                  <div
                    key={location.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => selectSuggestion(location, 'origin')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {location.name}
                        </div>
                        {location.detailedName && location.detailedName !== location.name && (
                          <div className="text-sm text-gray-600">
                            {location.detailedName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-medium text-blue-600">
                          {location.iataCode}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {location.subType?.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="City or airport code"
              required
            />
            {activeField === 'destination' && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((location) => (
                  <div
                    key={location.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => selectSuggestion(location, 'destination')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {location.name}
                        </div>
                        {location.detailedName && location.detailedName !== location.name && (
                          <div className="text-sm text-gray-600">
                            {location.detailedName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-medium text-blue-600">
                          {location.iataCode}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {location.subType?.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Departure</label>
            <input
              type="date"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Return (optional)</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Passengers</label>
            <input
              type="number"
              name="adults"
              value={formData.adults}
              onChange={handleInputChange}
              min="1"
              max="9"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        {/* Agentic controls removed to restore original page */}
        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300">{loading ? 'Searching...' : 'Search Flights'}</button>
          <button type="button" onClick={debugFlightData} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Debug Data</button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {searchPerformed && flights.length === 0 && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          No flights found for your search criteria. Please try different dates or destinations.
        </div>
      )}
      
      {flights.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Flight Results ({flights.length} found)</h2>
          <div className="grid gap-4">
            {flights.map((flight, index) => (
              <FlightCard key={index} flight={flight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FlightCard = ({ flight }: { flight: FlightOffer }) => {
  // Debug the flight object structure
  console.log('Flight object:', flight);
  
  // Safely extract flight details with fallbacks
  const itineraries = flight.itineraries || [];
  const price = flight.price || { total: '0', currency: 'USD' };
  const id = flight.id || 'unknown';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xl font-bold">{price.total} {price.currency}</span>
        <button className="bg-green-600 text-white px-4 py-1 rounded text-sm">
          Select
        </button>
      </div>
      
      {itineraries.length > 0 ? (
        itineraries.map((itinerary, idx) => (
          <div key={idx} className="mb-3">
            <h3 className="font-medium mb-2">{idx === 0 ? 'Outbound' : 'Return'} Flight</h3>
            {itinerary.segments && itinerary.segments.map((segment, segIdx) => (
              <div key={segIdx} className="flex justify-between text-sm mb-1">
                <span>{segment.departure.iataCode} → {segment.arrival.iataCode}</span>
                <span>
                  {segment.departure.at ? new Date(segment.departure.at).toLocaleTimeString() : 'N/A'} - 
                  {segment.arrival.at ? new Date(segment.arrival.at).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="text-gray-500">No itinerary details available</div>
      )}
      
      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-400">
        Flight ID: {id}
      </div>
    </div>
  );
};

export default FlightSearch;