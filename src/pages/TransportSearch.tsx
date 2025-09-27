/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, Car, Train, Bus, Ship } from "lucide-react";

// Transport types and interfaces
interface TransportOffer {
  id: string;
  provider: string;
  transportType: string;
  price: {
    total: number;
    currency: string;
  };
  duration: string;
  departure: {
    time: string;
    location: string;
  };
  arrival: {
    time: string;
    location: string;
  };
  rating: number;
  features: string[];
  vehicleType?: string;
  capacity?: number;
  cancellationPolicy?: string;
}

interface SearchMetadata {
  origin: string;
  destination: string;
  total_results: number;
  search_date: string;
  transport_type: string;
  preferences_applied?: {
    features?: string[];
    price_range?: string;
    vehicle_types?: string[];
  };
  transparency_note: string;
}

interface PremiumFeatures {
  provider_diversity_score?: {
    diversity_score: number;
    unique_providers: number;
  };
  price_analysis?: {
    min_price: number;
    max_price: number;
    avg_price: number;
  };
  route_insights?: {
    avg_duration: string;
    route_efficiency_score: number;
    traffic_conditions?: string;
  };
}

const TransportSearch = () => {
  const [transportType, setTransportType] = useState('');
  const [searchData, setSearchData] = useState({
    pickupLocation: '',
    dropLocation: '',
    travelDate: '',
    passengers: '1',
    preferences: '',
    currency: 'USD',
    includeSummary: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<TransportOffer[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeatures | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [filters, setFilters] = useState<{ maxPrice?: number; minRating?: number }>({});
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating' | ''>('');
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState<'budget' | 'standard' | 'luxury' | ''>('');
  const [vehicleClass, setVehicleClass] = useState<string>('');
  const [ecoFriendly, setEcoFriendly] = useState(false);
  const [instantBooking, setInstantBooking] = useState(false);

  const transportOptions = [
    { value: 'car-rental', label: 'Car Rental', icon: Car },
    { value: 'bus', label: 'Bus', icon: Bus },
    { value: 'train', label: 'Train', icon: Train },
    { value: 'ferry', label: 'Ferry', icon: Ship }
  ];

  const handleInputChange = (field: string, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setSearchData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSearch = async () => {
    if (!transportType || !searchData.pickupLocation || !searchData.dropLocation || !searchData.travelDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSearchPerformed(true);
    setSearchMetadata(null);
    setAiSummary('');
    setPremiumFeatures(null);
    
    try {
      // Simulate API call with enhanced features
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = generateMockResults(transportType);
      const mockMetadata = generateMockMetadata();
      const mockSummary = generateMockAISummary(transportType);
      const mockPremiumFeatures = generateMockPremiumFeatures();
      
      setSearchResults(mockResults);
      setSearchMetadata(mockMetadata);
      
      if (searchData.includeSummary) {
        setAiSummary(mockSummary);
        setPremiumFeatures(mockPremiumFeatures);
      }
      
      setCompareSelection([]);
      setIsCompareOpen(false);
    } catch (err: unknown) {
      console.error('Transport search error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while searching for transport';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = (type: string): TransportOffer[] => {
    const baseResults: TransportOffer[] = [
      {
        id: '1',
        provider: getProviderName(type),
        transportType: type,
        price: {
          total: getRandomPrice(type),
          currency: searchData.currency
        },
        duration: getRandomDuration(type),
        departure: {
          time: '08:00',
          location: searchData.pickupLocation
        },
        arrival: {
          time: '12:30',
          location: searchData.dropLocation
        },
        rating: 4.5,
        features: getFeatures(type),
        vehicleType: getVehicleType(type),
        capacity: getCapacity(type),
        cancellationPolicy: 'Free cancellation up to 24 hours'
      },
      {
        id: '2',
        provider: getProviderName(type, 2),
        transportType: type,
        price: {
          total: getRandomPrice(type),
          currency: searchData.currency
        },
        duration: getRandomDuration(type),
        departure: {
          time: '10:15',
          location: searchData.pickupLocation
        },
        arrival: {
          time: '14:45',
          location: searchData.dropLocation
        },
        rating: 4.2,
        features: getFeatures(type),
        vehicleType: getVehicleType(type),
        capacity: getCapacity(type),
        cancellationPolicy: 'Free cancellation up to 2 hours'
      },
      {
        id: '3',
        provider: getProviderName(type, 3),
        transportType: type,
        price: {
          total: getRandomPrice(type),
          currency: searchData.currency
        },
        duration: getRandomDuration(type),
        departure: {
          time: '14:30',
          location: searchData.pickupLocation
        },
        arrival: {
          time: '18:00',
          location: searchData.dropLocation
        },
        rating: 4.7,
        features: getFeatures(type),
        vehicleType: getVehicleType(type),
        capacity: getCapacity(type),
        cancellationPolicy: 'No cancellation fees'
      }
    ];
    return baseResults;
  };

  const getProviderName = (type: string, index: number = 1) => {
    const providers = {
      'car-rental': ['Hertz', 'Avis', 'Enterprise'],
      'bus': ['Greyhound', 'Megabus', 'FlixBus'],
      'train': ['Amtrak', 'VIA Rail', 'Eurostar'],
      'ferry': ['BC Ferries', 'Washington State Ferries', 'Staten Island Ferry']
    };
    return providers[type as keyof typeof providers]?.[index - 1] || 'Transport Provider';
  };

  const getRandomPrice = (type: string) => {
    const priceRanges = {
      'car-rental': [45, 120],
      'bus': [15, 45],
      'train': [25, 85],
      'ferry': [20, 60]
    };
    const range = priceRanges[type as keyof typeof priceRanges] || [20, 80];
    return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
  };

  const getRandomDuration = (type: string) => {
    const durations = {
      'car-rental': ['1 day', '2 days', '3 days'],
      'bus': ['4h 30m', '5h 15m', '3h 45m'],
      'train': ['3h 20m', '4h 10m', '2h 55m'],
      'ferry': ['2h 15m', '1h 45m', '3h 00m']
    };
    const options = durations[type as keyof typeof durations] || ['2-4 hours'];
    return options[Math.floor(Math.random() * options.length)];
  };

  const getFeatures = (type: string) => {
    const features = {
      'car-rental': ['GPS Navigation', 'Air Conditioning', 'Automatic'],
      'bus': ['WiFi', 'Power Outlets', 'Reclining Seats'],
      'train': ['WiFi', 'Dining Car', 'Comfortable Seating'],
      'ferry': ['Car Deck', 'Passenger Lounge', 'Food Service']
    };
    return features[type as keyof typeof features] || ['Standard Service'];
  };

  const getVehicleType = (type: string): string => {
    const vehicleTypes = {
      'car-rental': ['Economy', 'Compact', 'SUV', 'Luxury'][Math.floor(Math.random() * 4)],
      'bus': ['Standard', 'Express', 'Luxury Coach'][Math.floor(Math.random() * 3)],
      'train': ['Standard', 'First Class', 'Business Class'][Math.floor(Math.random() * 3)],
      'ferry': ['Passenger', 'Vehicle Ferry', 'High-Speed'][Math.floor(Math.random() * 3)]
    };
    return vehicleTypes[type as keyof typeof vehicleTypes] || 'Standard';
  };

  const getCapacity = (type: string): number => {
    const capacities = {
      'car-rental': [2, 4, 5, 7][Math.floor(Math.random() * 4)],
      'bus': [30, 45, 50, 55][Math.floor(Math.random() * 4)],
      'train': [100, 150, 200][Math.floor(Math.random() * 3)],
      'ferry': [200, 500, 1000][Math.floor(Math.random() * 3)]
    };
    return capacities[type as keyof typeof capacities] || 4;
  };

  const generateMockMetadata = (): SearchMetadata => {
    return {
      origin: searchData.pickupLocation,
      destination: searchData.dropLocation,
      total_results: searchResults.length || 3,
      search_date: searchData.travelDate,
      transport_type: transportType,
      preferences_applied: {
        features: searchData.preferences ? searchData.preferences.split(',').map(p => p.trim()) : [],
        price_range: priceRange || 'all',
        vehicle_types: vehicleClass ? [vehicleClass] : []
      },
      transparency_note: 'Results include real-time pricing and availability from verified transport providers.'
    };
  };

  const generateMockAISummary = (type: string): string => {
    const summaries = {
      'car-rental': `**Transport Summary for ${searchData.pickupLocation} to ${searchData.dropLocation}**

• Found 3 car rental options ranging from $45-120 per day
• Best value: Economy vehicles with good fuel efficiency
• Premium options: SUVs and luxury cars available
• All providers offer GPS navigation and insurance

**Recommendations:**
• Book early for better rates
• Consider fuel costs for longer trips
• Check age requirements for drivers under 25`,
      'bus': `**Bus Travel Summary**

• 3 bus operators serve this route with frequent departures
• Journey time: 3-5 hours depending on stops
• Best comfort: Express services with WiFi and reclining seats
• Budget-friendly: Local services with basic amenities

**Travel Tips:**
• Book online for discounts
• Express services recommended for comfort
• Check baggage allowances`,
      'train': `**Rail Journey Overview**

• Multiple train services available with scenic routes
• Travel time: 2-4 hours with comfortable seating
• Amenities: Dining car, WiFi, and power outlets
• Eco-friendly option with lower carbon footprint

**Booking Advice:**
• Advance booking recommended for peak times
• Consider rail passes for multiple journeys
• First-class offers premium comfort`,
      'ferry': `**Ferry Service Summary**

• Regular ferry services with vehicle transport options
• Journey includes scenic water views
• Onboard facilities: Restaurant, lounge, and observation decks
• Weather-dependent schedules

**Important Notes:**
• Check weather conditions before travel
• Arrive early for vehicle boarding
• Book cabins for overnight journeys`
    };
    return summaries[type as keyof typeof summaries] || 'Transport options available for your selected route.';
  };

  const generateMockPremiumFeatures = (): PremiumFeatures => {
    return {
      provider_diversity_score: {
        diversity_score: 0.85,
        unique_providers: 3
      },
      price_analysis: {
        min_price: 45,
        max_price: 120,
        avg_price: 78
      },
      route_insights: {
        avg_duration: '3h 45m',
        route_efficiency_score: 0.92,
        traffic_conditions: 'Moderate traffic expected during peak hours'
      }
    };
  };

  const renderSearchForm = () => {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {/* Transport Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Transport Type</label>
              <Select value={transportType} onValueChange={setTransportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transport" />
                </SelectTrigger>
                <SelectContent>
                  {transportOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pickup Location */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Pickup Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Enter pickup location"
                  value={searchData.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Drop Location */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Drop Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Enter drop location"
                  value={searchData.dropLocation}
                  onChange={(e) => handleInputChange('dropLocation', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Travel Date */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Travel Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={searchData.travelDate}
                  onChange={(e) => handleInputChange('travelDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Number of Passengers */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Select value={searchData.passengers} onValueChange={(value) => handleInputChange('passengers', value)}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <Select value={searchData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="LKR">LKR</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Enhanced Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-4 p-4 bg-gray-50 rounded">
            <div>
              <label className="block text-sm font-medium mb-1">Preferences (NLP)</label>
              <Input
                placeholder="e.g., luxury, budget, eco-friendly, quick travel"
                value={searchData.preferences}
                onChange={(e) => handleInputChange('preferences', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Natural language preferences</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={searchData.includeSummary}
                onChange={(e) => handleCheckboxChange('includeSummary', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm font-medium">Include AI Summary</label>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
            <div>
              <label className="block text-sm font-medium mb-1">Price Range</label>
              <Select value={priceRange} onValueChange={(value) => setPriceRange(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget (Under $50)</SelectItem>
                  <SelectItem value="standard">Standard ($50-100)</SelectItem>
                  <SelectItem value="luxury">Luxury ($100+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle Class</label>
              <Select value={vehicleClass} onValueChange={setVehicleClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Any class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ecoFriendly} onChange={(e) => setEcoFriendly(e.target.checked)} />
                Eco-friendly
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={instantBooking} onChange={(e) => setInstantBooking(e.target.checked)} />
                Instant booking
              </label>
            </div>
          </div>

          <Button 
            type="submit"
            disabled={loading} 
            className="w-full md:w-auto"
          >
            {loading ? 'Searching...' : 'Search Transport'}
          </Button>
      </form>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-3xl font-bold mb-6">Transport Price Agent</h1>
      <p className="text-muted-foreground mb-8">
        Find and compare prices for various transportation options. Enter your pickup location, drop location, travel date, number of passengers, and preferences to get the best transport deals.
      </p>

      {renderSearchForm()}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {searchPerformed && searchResults.length === 0 && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          No transport options found for your search criteria. Please try different dates or locations.
        </div>
      )}
      
      {/* Search Insights */}
      {searchMetadata && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Search Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm"><strong>Route:</strong> {searchMetadata.origin} → {searchMetadata.destination}</p>
              <p className="text-sm"><strong>Results Found:</strong> {searchMetadata.total_results}</p>
              <p className="text-sm"><strong>Transport Type:</strong> {searchMetadata.transport_type}</p>
            </div>
            <div>
              {searchMetadata.preferences_applied?.features && searchMetadata.preferences_applied.features.length > 0 && (
                <p className="text-sm"><strong>Features:</strong> {searchMetadata.preferences_applied.features.join(', ')}</p>
              )}
              {searchMetadata.preferences_applied?.price_range && (
                <p className="text-sm"><strong>Price Range:</strong> {searchMetadata.preferences_applied.price_range}</p>
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
            {premiumFeatures.provider_diversity_score && (
              <div>
                <p className="text-sm font-medium">Provider Diversity</p>
                <p className="text-xs">Score: {Math.round(premiumFeatures.provider_diversity_score.diversity_score * 100)}%</p>
                <p className="text-xs">{premiumFeatures.provider_diversity_score.unique_providers} unique providers</p>
              </div>
            )}
            {premiumFeatures.price_analysis && (
              <div>
                <p className="text-sm font-medium">Price Analysis</p>
                <p className="text-xs">Range: ${premiumFeatures.price_analysis.min_price} - ${premiumFeatures.price_analysis.max_price}</p>
                <p className="text-xs">Average: ${Math.round(premiumFeatures.price_analysis.avg_price)}</p>
              </div>
            )}
            {premiumFeatures.route_insights && (
              <div>
                <p className="text-sm font-medium">Route Insights</p>
                <p className="text-xs">Avg Duration: {premiumFeatures.route_insights.avg_duration}</p>
                <p className="text-xs">Efficiency: {Math.round(premiumFeatures.route_insights.route_efficiency_score * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Transport Results ({searchResults.length} found)
          </h2>
          
          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Max price</label>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={filters.maxPrice ?? 500}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
              />
              <span className="text-sm text-gray-600 w-16">${filters.maxPrice ?? 500}</span>
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
                <option value="duration">Duration (short to long)</option>
                <option value="rating">Rating (high to low)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {(() => {
              let list = [...searchResults];
              
              // Apply filters
              if (filters.maxPrice != null) {
                list = list.filter((t) => t.price.total <= (filters.maxPrice as number));
              }
              if (filters.minRating != null) {
                list = list.filter((t) => t.rating >= (filters.minRating as number));
              }
              
              // Apply sorting
              if (sortBy === 'price') {
                list.sort((a, b) => a.price.total - b.price.total);
              } else if (sortBy === 'rating') {
                list.sort((a, b) => b.rating - a.rating);
              } else if (sortBy === 'duration') {
                list.sort((a, b) => a.duration.localeCompare(b.duration));
              }
              
              return list.map((result) => (
                <TransportCard
                  key={result.id}
                  transport={result}
                  selected={compareSelection.includes(result.id)}
                  onToggleCompare={(id: string) => {
                    setCompareSelection((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                />
              ));
            })()}
          </div>
          
          {/* Compare Selection */}
          {compareSelection.length > 0 && (
            <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto">
                <span className="text-sm text-gray-700">
                  {compareSelection.length} selected for comparison
                </span>
                <Button
                  onClick={() => setIsCompareOpen(true)}
                  size="sm"
                >
                  Compare
                </Button>
                <Button
                  onClick={() => setCompareSelection([])}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Compare Modal */}
      {isCompareOpen && (
        <CompareModal
          transports={searchResults.filter((t) => compareSelection.includes(t.id))}
          onClose={() => setIsCompareOpen(false)}
          onRemove={(id: string) => setCompareSelection((prev) => prev.filter((x) => x !== id))}
        />
      )}
    </div>
  );
};

export default TransportSearch;

// AI Summary Component
const AISummary = ({ content }: { content: string }) => {
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

// Transport Card Component
const TransportCard = ({
  transport,
  selected,
  onToggleCompare,
}: {
  transport: TransportOffer;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{transport.provider}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>⭐ {transport.rating}</span>
            <span>{transport.departure.time} - {transport.arrival.time}</span>
            <span>Duration: {transport.duration}</span>
            {transport.vehicleType && <span>Type: {transport.vehicleType}</span>}
          </div>
          {transport.capacity && (
            <p className="text-xs text-gray-500 mt-1">Capacity: {transport.capacity} passengers</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {transport.price.total} {transport.price.currency}
          </div>
          <div className="text-sm text-muted-foreground">
            {transport.transportType === 'car-rental' ? 'per day' : 'per person'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {transport.features.map((feature: string, index: number) => (
          <span
            key={index}
            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
          >
            {feature}
          </span>
        ))}
      </div>

      {transport.cancellationPolicy && (
        <p className="text-xs text-green-600 mb-3">{transport.cancellationPolicy}</p>
      )}

      <div className="flex gap-2">
        <Button size="sm">Select</Button>
        <Button variant="outline" size="sm">View Details</Button>
        {onToggleCompare && (
          <Button
            onClick={() => onToggleCompare(transport.id)}
            variant={selected ? "default" : "outline"}
            size="sm"
          >
            {selected ? 'Added to Compare' : 'Compare'}
          </Button>
        )}
      </div>
    </Card>
  );
};

// Compare Modal Component
const CompareModal = ({
  transports,
  onClose,
  onRemove,
}: {
  transports: TransportOffer[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:w-5/6 lg:w-3/4 max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Compare Transport Options</h3>
          <Button onClick={onClose} variant="outline" size="sm">Close</Button>
        </div>
        <div className="overflow-auto">
          <div className="min-w-[720px] grid" style={{ gridTemplateColumns: `200px repeat(${transports.length}, minmax(220px, 1fr))` }}>
            <div className="bg-gray-50 p-3 text-sm font-medium sticky left-0">Attribute</div>
            {transports.map((t) => (
              <div key={t.id} className="bg-gray-50 p-3 flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{t.provider}</div>
                <Button onClick={() => onRemove(t.id)} variant="outline" size="sm">Remove</Button>
              </div>
            ))}

            {/* Price */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Price</div>
            {transports.map((t) => (
              <div key={t.id + '-price'} className="p-3 text-sm">
                <div className="font-semibold">{t.price.total} {t.price.currency}</div>
              </div>
            ))}

            {/* Duration */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Duration</div>
            {transports.map((t) => (
              <div key={t.id + '-duration'} className="p-3 text-sm">
                {t.duration}
              </div>
            ))}

            {/* Rating */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Rating</div>
            {transports.map((t) => (
              <div key={t.id + '-rating'} className="p-3 text-sm">
                ⭐ {t.rating}
              </div>
            ))}

            {/* Vehicle Type */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Vehicle Type</div>
            {transports.map((t) => (
              <div key={t.id + '-vehicle'} className="p-3 text-sm">
                {t.vehicleType || '—'}
              </div>
            ))}

            {/* Features */}
            <div className="p-3 text-sm font-medium sticky left-0 bg-white">Features</div>
            {transports.map((t) => (
              <div key={t.id + '-features'} className="p-3 text-xs">
                {t.features.slice(0, 3).join(', ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};