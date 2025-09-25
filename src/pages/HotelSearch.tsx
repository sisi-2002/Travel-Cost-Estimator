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
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [filters, setFilters] = useState<{ maxPrice?: number }>(() => ({}));
  const [sortBy, setSortBy] = useState<'price' | 'distance' | ''>('');

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
      setCompareSelection([]);
      setIsCompareOpen(false);
    } catch (err: unknown) {
      console.error('Hotel search error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while searching for hotels';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
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
        <div className="bg-green-50 border border-green-200 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">🤖 AI Summary</h3>
          <AISummary content={aiSummary} />
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
          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Max price</label>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={filters.maxPrice ?? 5000}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
              />
              <span className="text-sm text-gray-600 w-16">${(filters.maxPrice ?? 5000)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Sort</label>
              <select
                className="border rounded p-1 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="">None</option>
                <option value="price">Price (low to high)</option>
                <option value="distance">Distance (near to far)</option>
              </select>
            </div>
          </div>

          {(() => {
            // Prepare filtered and sorted list
            let list = [...hotels];
            if (filters.maxPrice != null) {
              list = list.filter((h) => {
                const o = h.offers?.[0];
                const total = o ? Number(o.price.total) : Number.POSITIVE_INFINITY;
                return total <= (filters.maxPrice as number);
              });
            }
            if (sortBy === 'price') {
              list.sort((a, b) => {
                const ap = Number(a.offers?.[0]?.price.total || Number.POSITIVE_INFINITY);
                const bp = Number(b.offers?.[0]?.price.total || Number.POSITIVE_INFINITY);
                return ap - bp;
              });
            } else if (sortBy === 'distance') {
              list.sort((a, b) => {
                const ad = Number((a as any).hotel?.distance?.value ?? Number.POSITIVE_INFINITY);
                const bd = Number((b as any).hotel?.distance?.value ?? Number.POSITIVE_INFINITY);
                return ad - bd;
              });
            }

            return (
              <div className="grid gap-4">
                {list.map((hotel, index) => (
              <HotelCard
                key={index}
                hotel={hotel}
                selected={compareSelection.includes(hotel.hotel.hotelId)}
                onToggleCompare={(id: string) => {
                  setCompareSelection((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />
                ))}
              </div>
            );
          })()}

          {compareSelection.length > 0 && (
            <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto">
                <span className="text-sm text-gray-700">
                  {compareSelection.length} selected for comparison
                </span>
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full hover:bg-blue-700"
                >
                  Compare
                </button>
                <button
                  onClick={() => setCompareSelection([])}
                  className="text-sm px-3 py-1 rounded-full border hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {isCompareOpen && (
            <CompareModal
              hotels={hotels.filter((h) => compareSelection.includes(h.hotel.hotelId))}
              onClose={() => setIsCompareOpen(false)}
              onRemove={(id: string) => setCompareSelection((prev) => prev.filter((x) => x !== id))}
              requestedAmenities={(searchMetadata?.preferences_applied?.amenities as string[]) || []}
              requestedRatings={(searchMetadata?.preferences_applied?.ratings as string[]) || []}
            />
          )}
        </div>
      )}
    </div>
  );
};

const HotelCard = ({
  hotel,
  selected,
  onToggleCompare,
}: {
  hotel: HotelOffer;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}) => {
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
        {onToggleCompare && (
          <button
            onClick={() => onToggleCompare(hotel.hotel.hotelId)}
            className={`px-4 py-1 rounded text-sm border ${selected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            {selected ? 'Added to Compare' : 'Compare'}
          </button>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Hotel ID: {hotel.hotel.hotelId}
      </div>
    </div>
  );
};

export default HotelSearch;

const AISummary = ({ content }: { content: string }) => {
  // Normalize bullets: treat lines starting with "- " or "* " as bullets
  const lines = content.split('\n').map((l) => l.trimEnd());
  const blocks: Array<{ type: 'heading' | 'bullet' | 'text'; text: string }> = [];

  lines.forEach((line) => {
    if (!line) {
      blocks.push({ type: 'text', text: '' });
      return;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      blocks.push({ type: 'heading', text: line.replace(/\*\*/g, '') });
    } else if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: line.replace(/^([•*-]\s?)/, '') });
    } else {
      blocks.push({ type: 'text', text: line });
    }
  });

  return (
    <div className="text-sm leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <div key={i} className="mt-4 mb-2 font-semibold text-gray-900">
              {b.text}
            </div>
          );
        }
        if (b.type === 'bullet') {
          return (
            <div key={i} className="flex items-start gap-2 pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-700" />
              <span>{b.text}</span>
            </div>
          );
        }
        return <p key={i} className="mb-1">{b.text || <span>&nbsp;</span>}</p>;
      })}
    </div>
  );
};

const CompareModal = ({
  hotels,
  onClose,
  onRemove,
  requestedAmenities,
  requestedRatings,
}: {
  hotels: HotelOffer[];
  onClose: () => void;
  onRemove: (id: string) => void;
  requestedAmenities?: string[];
  requestedRatings?: string[];
}) => {
  const hasAnyRating = hotels.some((h) => (h as any).hotel?.rating);
  const hasAnyAmenities = hotels.some((h) => Array.isArray((h as any).hotel?.amenities) && (h as any).hotel?.amenities.length > 0);
  const hasAnyCancellation = hotels.some((h) => h.offers?.[0]?.policies?.cancellation?.type);
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:w-5/6 lg:w-3/4 max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Compare Hotels</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded border hover:bg-gray-50">Close</button>
        </div>
        <div className="overflow-auto">
          <div className="min-w-[720px] grid" style={{ gridTemplateColumns: `200px repeat(${hotels.length}, minmax(220px, 1fr))` }}>
            <div className="bg-gray-50 p-3 text-sm font-medium sticky left-0">Attribute</div>
            {hotels.map((h) => (
              <div key={h.hotel.hotelId} className="bg-gray-50 p-3 flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{h.hotel.name}</div>
                <button onClick={() => onRemove(h.hotel.hotelId)} className="text-xs px-2 py-1 rounded border hover:bg-gray-100">Remove</button>
              </div>
            ))}

            {/* Price */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Price (total)</div>
            {hotels.map((h) => {
              const o = h.offers?.[0];
              return (
                <div key={h.hotel.hotelId + '-price'} className="p-3 text-sm">
                  {o ? (
                    <div className="font-semibold">{o.price.total} {o.price.currency}</div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
              );
            })}

            {/* Per room/night */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Per room/night</div>
            {hotels.map((h) => {
              const b = h.offers?.[0]?.price_breakdown;
              return (
                <div key={h.hotel.hotelId + '-prpn'} className="p-3 text-sm">
                  {b ? `${b.per_room_per_night.toFixed(2)} ${b.currency}` : '—'}
                </div>
              );
            })}

            {/* Distance */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Distance</div>
            {hotels.map((h) => (
              <div key={h.hotel.hotelId + '-dist'} className="p-3 text-sm">
                {h.hotel.distance ? `${h.hotel.distance.value} ${h.hotel.distance.unit}` : '—'}
              </div>
            ))}

            {/* Rating */}
            {hasAnyRating && (
              <>
                <div className="p-3 text-sm font-medium sticky left-0 bg-white">Rating</div>
                {hotels.map((h) => (
                  <div key={h.hotel.hotelId + '-rating'} className="p-3 text-sm">
                    {h.hotel.rating || '—'}
                  </div>
                ))}
              </>
            )}

            {/* Amenities (top 5) */}
            {hasAnyAmenities && (
              <>
                <div className="p-3 text-sm font-medium sticky left-0 bg-white">Amenities</div>
                {hotels.map((h) => (
                  <div key={h.hotel.hotelId + '-amen'} className="p-3 text-xs">
                    {Array.isArray((h as any).hotel?.amenities) && (h as any).hotel?.amenities.length > 0
                      ? (h as any).hotel.amenities.slice(0, 5).join(', ')
                      : '—'}
                  </div>
                ))}
              </>
            )}

            {/* Chain */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Chain</div>
            {hotels.map((h) => (
              <div key={h.hotel.hotelId + '-chain'} className="p-3 text-sm">
                {h.hotel.chainCode || '—'}
              </div>
            ))}

            {/* Cancellation */}
            {hasAnyCancellation && (
              <>
                <div className="p-3 text-sm font-medium sticky left-0 bg-white">Cancellation</div>
                {hotels.map((h) => {
                  const c = h.offers?.[0]?.policies?.cancellation?.type;
                  return (
                    <div key={h.hotel.hotelId + '-cancel'} className="p-3 text-sm">
                      {c || '—'}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
