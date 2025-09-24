import { useState } from 'react';
import { searchHotels, getHotelLocations } from '../config/api';
import { HotelOffer, Airport } from '../types/index';

const HotelSearch = () => {
  const [formData, setFormData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    roomQuantity: 1,
    currency: 'USD',
    radius: 5,
    preferences: '',
    includeSummary: false,
  });
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [premiumFeatures, setPremiumFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch location suggestions for destination field
    if (name === 'destination' && value.length > 2) {
      setActiveField(name);
      fetchLocationSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const fetchLocationSuggestions = async (keyword: string) => {
    try {
      const data = await getHotelLocations(keyword);
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching location suggestions:', err);
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
    setSearchMetadata(null);
    setAiSummary('');
    setPremiumFeatures(null);
    
    try {
      console.log('Searching hotels with:', formData);
      const response = await searchHotels(
        formData.destination,
        formData.checkIn,
        formData.checkOut,
        formData.adults,
        formData.roomQuantity,
        10, // max hotels
        formData.currency,
        formData.radius,
        formData.preferences || undefined,
        formData.includeSummary
      );
      console.log('Hotel search results:', response);
      setHotels(response.hotels);
      setSearchMetadata(response.search_metadata);
      setAiSummary(response.ai_summary || '');
      setPremiumFeatures(response.premium_features);
    } catch (err: unknown) {
      console.error('Hotel search error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while searching for hotels';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-6">Hotel Price Agent</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Destination</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="City or IATA code"
              required
            />
            {activeField === 'destination' && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded shadow-lg">
                {suggestions.map((location) => (
                  <div
                    key={location.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectSuggestion(location, 'destination')}
                  >
                    {location.name} ({location.iataCode})
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Check-in</label>
            <input
              type="date"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Check-out</label>
            <input
              type="date"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Adults</label>
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
          
          <div>
            <label className="block text-sm font-medium mb-1">Rooms</label>
            <input
              type="number"
              name="roomQuantity"
              value={formData.roomQuantity}
              onChange={handleInputChange}
              min="1"
              max="9"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        {/* Enhanced Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-4 p-4 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">Search Radius (km)</label>
            <input
              type="number"
              name="radius"
              value={formData.radius}
              onChange={handleInputChange}
              min="1"
              max="50"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Preferences (NLP)</label>
            <input
              type="text"
              name="preferences"
              value={formData.preferences}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., luxury hotel with spa and gym"
            />
            <p className="text-xs text-gray-500 mt-1">Natural language preferences</p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="includeSummary"
              checked={formData.includeSummary}
              onChange={(e) => setFormData(prev => ({ ...prev, includeSummary: e.target.checked }))}
              className="mr-2"
            />
            <label className="text-sm font-medium">Include AI Summary</label>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300">
            {loading ? 'Searching...' : 'Search Hotels'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {searchPerformed && hotels.length === 0 && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          No hotels found for your search criteria. Please try different dates or destinations.
        </div>
      )}
      
      {/* Enhanced Features Display */}
      {searchMetadata && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Search Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm"><strong>Destination:</strong> {searchMetadata.destination_display || searchMetadata.destination}</p>
              <p className="text-sm"><strong>Search Radius:</strong> {searchMetadata.search_radius_km} km</p>
              <p className="text-sm"><strong>Results Found:</strong> {searchMetadata.total_results}</p>
            </div>
            <div>
              {searchMetadata.preferences_applied?.amenities?.length > 0 && (
                <p className="text-sm"><strong>Amenities:</strong> {searchMetadata.preferences_applied.amenities.join(', ')}</p>
              )}
              {searchMetadata.preferences_applied?.ratings?.length > 0 && (
                <p className="text-sm"><strong>Ratings:</strong> {searchMetadata.preferences_applied.ratings.join(', ')} stars</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">{searchMetadata.transparency_note}</p>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">🤖 AI Summary</h3>
          <div className="text-sm whitespace-pre-line leading-relaxed">
            {aiSummary.split('**').map((part, index) => {
              if (index % 2 === 1) {
                // This is a bold section
                return <strong key={index}>{part}</strong>;
              } else {
                // This is regular text
                return part.split('\n').map((line, lineIndex) => (
                  <span key={`${index}-${lineIndex}`}>
                    {line.startsWith('•') ? (
                      <span className="block ml-4 mt-1">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                    {lineIndex < part.split('\n').length - 1 && <br />}
                  </span>
                ));
              }
            })}
          </div>
        </div>
      )}

      {/* Premium Features */}
      {premiumFeatures && (
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">⭐ Premium Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {premiumFeatures.chain_diversity_score && (
              <div>
                <p className="text-sm font-medium">Chain Diversity</p>
                <p className="text-xs">Score: {Math.round(premiumFeatures.chain_diversity_score.diversity_score * 100)}%</p>
                <p className="text-xs">{premiumFeatures.chain_diversity_score.unique_chains} unique chains</p>
              </div>
            )}
            {premiumFeatures.price_analysis && (
              <div>
                <p className="text-sm font-medium">Price Analysis</p>
                <p className="text-xs">Range: ${premiumFeatures.price_analysis.min_price} - ${premiumFeatures.price_analysis.max_price}</p>
                <p className="text-xs">Average: ${Math.round(premiumFeatures.price_analysis.avg_price)}</p>
              </div>
            )}
            {premiumFeatures.location_insights && (
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs">Avg Distance: {premiumFeatures.location_insights.avg_distance_km?.toFixed(1)} km</p>
                <p className="text-xs">Central Score: {Math.round((premiumFeatures.location_insights.central_location_score || 0) * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Hotel Results ({hotels.length} found)</h2>
          <div className="grid gap-4">
            {hotels.map((hotel, index) => (
              <HotelCard key={index} hotel={hotel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HotelCard = ({ hotel }: { hotel: HotelOffer }) => {
  const bestOffer = hotel.offers?.[0];
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{hotel.hotel.name}</h3>
          <p className="text-sm text-gray-600">
            {hotel.hotel.cityCode} • {hotel.hotel.chainCode}
          </p>
          {hotel.hotel.distance && (
            <p className="text-xs text-gray-500">
              {hotel.hotel.distance.value} {hotel.hotel.distance.unit} from city center
            </p>
          )}
        </div>
        {bestOffer && (
          <div className="text-right">
            <span className="text-xl font-bold">
              {bestOffer.price.total} {bestOffer.price.currency}
            </span>
            <p className="text-xs text-gray-500">
              {bestOffer.price_breakdown ? 
                `Total for ${bestOffer.price_breakdown.nights} night${bestOffer.price_breakdown.nights > 1 ? 's' : ''}` : 
                'per night'
              }
            </p>
          </div>
        )}
      </div>
      
      {bestOffer && (
        <div className="mt-3 space-y-1">
          <div className="text-sm">
            <span className="font-medium">Room:</span> {bestOffer.room.type}
          </div>
          <div className="text-sm">
            <span className="font-medium">Dates:</span> {bestOffer.checkInDate} to {bestOffer.checkOutDate}
          </div>
          {bestOffer.policies?.cancellation && (
            <div className="text-sm">
              <span className="font-medium">Cancellation:</span> {bestOffer.policies.cancellation.type}
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown Section */}
      {bestOffer?.price_breakdown && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            {showBreakdown ? '▼' : '▶'} Price Breakdown
          </button>
          
          {showBreakdown && (
            <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base cost ({bestOffer.price_breakdown.nights} nights):</span>
                  <span className="font-medium">{bestOffer.price_breakdown.base_cost} {bestOffer.price_breakdown.currency}</span>
                </div>
                
                {bestOffer.price_breakdown.additional_fees > 0 && (
                  <div className="flex justify-between">
                    <span>Additional fees:</span>
                    <span className="font-medium">+{bestOffer.price_breakdown.additional_fees.toFixed(2)} {bestOffer.price_breakdown.currency}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{bestOffer.price_breakdown.total_cost} {bestOffer.price_breakdown.currency}</span>
                </div>
                
                <div className="text-xs text-gray-600 mt-2">
                  <p>• {bestOffer.price_breakdown.per_room_per_night.toFixed(2)} {bestOffer.price_breakdown.currency} per room per night</p>
                  <p>• {bestOffer.price_breakdown.rooms} room{bestOffer.price_breakdown.rooms > 1 ? 's' : ''} for {bestOffer.price_breakdown.adults} adult{bestOffer.price_breakdown.adults > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-3 flex gap-2">
        <button className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">
          Select
        </button>
        <button className="bg-gray-500 text-white px-4 py-1 rounded text-sm hover:bg-gray-600">
          Details
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Hotel ID: {hotel.hotel.hotelId}
      </div>
    </div>
  );
};

export default HotelSearch;
