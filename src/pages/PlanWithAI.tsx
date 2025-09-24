import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth for consistent auth checking
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key (replace with your actual key or use environment variable)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY); // Replace with actual key

const PlanWithAI = () => {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    nights: 1,
    total_budget: "",
    num_travelers: 1,
    currency: "USD",
    preferences: "",
    suggestions: 1, 
    transport: "",
    accommodation: "",
    meal: "",
    activities: "",
    language: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false); // New state for limit reached
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Use context for auth status

  const parseTravelPlan = (rawText) => {
    if (!rawText) return [];

    const lines = rawText.split("\n");
    const structured = [];
    let currentSection = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Day heading
      if (/^\*\*(.+)\*\*$/.test(trimmed)) {
        const title = trimmed.replace(/^\*\*(.+)\*\*$/, "$1").trim();
        currentSection = { type: "day", title, items: [] };
        structured.push(currentSection);
        return;
      }

      // Time or subheading (Morning/Afternoon/Evening)
      if (/^\*\s*\*\*(.+)\*\*$/.test(trimmed)) {
        const title = trimmed.replace(/^\*\s*\*\*(.+)\*\*$/, "$1").trim();
        currentSection = { type: "subsection", title, items: [] };
        structured.push(currentSection);
        return;
      }

      // Bullet point
      if (/^[-*+]\s+/.test(trimmed)) {
        if (!currentSection) {
          currentSection = { type: "subsection", title: "", items: [] };
          structured.push(currentSection);
        }
        currentSection.items.push(trimmed.replace(/^[-*+]\s+/, ""));
        return;
      }

      // Regular text
      if (!currentSection) {
        currentSection = { type: "subsection", title: "", items: [] };
        structured.push(currentSection)
      }
      currentSection.items.push(trimmed);
    });

    return structured;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const getAuthToken = () => {
    // Try multiple possible token storage keys
    return localStorage.getItem("access_token") || 
           localStorage.getItem("jwt_token") || 
           localStorage.getItem("token");
  };

  const handleUpgrade = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to upgrade your subscription.");
        navigate("/auth", { state: { from: "/plan-ai" } });
        return;
      }
      const backendUrl = "http://localhost:8005/api/v1/subscribe"; // Use explicit backend URL
      console.log("Initiating subscription request to:", backendUrl);

      // Call backend to create checkout session
      const response = await fetch(backendUrl, { // Adjust base URL if needed
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

       if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to create checkout session`);
      }


      const { session_id } = await response.json();
      console.log("Received session ID:", session_id);

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: session_id });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error("Error upgrading subscription:", err);
      setError(`Failed to initiate upgrade: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    // Check authentication using useAuth context
    if (!isAuthenticated) {
      setError("Please log in to generate a travel plan.");
      navigate("/auth", { state: { from: "/plan-ai" } }); // Redirect to auth with return URL
      return;
    }

    // Basic validation
    if (!form.destination || !form.total_budget) {
      setError("Please fill in destination and budget fields.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        navigate("/auth", { state: { from: "/plan-ai" } });
        return;
      }

      // Prepare the payload to match backend TravelQuery model
      const payload = {
        destination: form.destination.trim(),
        origin: form.origin.trim(),
        nights: parseInt(form.nights) || 1,
        total_budget: parseFloat(form.total_budget) || 0,
        num_travelers: parseInt(form.num_travelers) || 1,
        currency: form.currency,
        preferences: form.preferences 
          ? form.preferences.split(",").map((p) => p.trim()).filter(p => p !== "")
          : [],
        suggestions: parseInt(form.suggestions) || 1,
        transport: form.transport || null,
        accommodation: form.accommodation || null,
        meal: form.meal || null,
        activities: form.activities || null,
        language: form.language || null,
      };
      
      console.log("Submitting payload:", payload);
      console.log("Using token:", token.substring(0, 20) + "...");
            
      // Try different base URLs for development/production
      const baseUrls = [
        "", // Relative URL (same origin)
        "http://localhost:8005",
        "http://127.0.0.1:8005",
      ];
      
      let response = null;
      let lastError = null;
      
      for (const baseUrl of baseUrls) {
        try {
          const url = `${baseUrl}/api/v1/generate-travel-plan`;
          console.log(`Trying URL: ${url}`);
          
          response = await fetch(url, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          });
          
          if (response.ok) {
            console.log(`Success with URL: ${url}`);
            break;
          } else {
            console.log(`Failed with URL: ${url}, status: ${response.status}`);
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;

            // Handle 403 specifically for limit reached
                if (response.status === 403) {
                    setLimitReached(true);
                    setError(errorData.detail || "Daily limit reached or subscription expired. Upgrade to premium for unlimited access.");
                    return;
                }
                if (response.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("jwt_token");
                    localStorage.removeItem("token");
                    setError("Authentication failed. Please log in again.");
                    navigate("/auth", { state: { from: "/plan-ai" } });
                    return;
                }
          }
        } catch (fetchError) {
          console.log(`Network error with URL: ${baseUrl}/api/v1/generate-travel-plan`);
          lastError = fetchError.message;
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(lastError || `HTTP error! status: ${response?.status || 'Network Error'}`);
      }

      const data = await response.json();
      console.log("Received data:", data);
      
      setResult(data.answer || "No plan generated.");
      
    } catch (err) {
      console.error("Error generating plan:", err);
      const errorMessage = err instanceof Error ? err.message : "Error generating travel plan. Please try again.";
      setError(`Failed to generate travel plan: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      console.log("Plan copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Plan Your Journey with AI
        </h2>
        <p className="text-gray-600">Let our AI create the perfect travel itinerary for you</p>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="space-y-6">
          {/* Essential Travel Information */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Essential Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin *
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="origin"
                  placeholder="e.g., Paris, Tokyo, Maldives"
                  value={form.origin}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="destination"
                  placeholder="e.g., Paris, Tokyo, Maldives"
                  value={form.destination}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Nights *
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="nights"
                  type="number"
                  min={1}
                  max={365}
                  value={form.nights}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget *
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="total_budget"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="1000"
                  value={form.total_budget}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="LKR">LKR (Rs)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers *
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="num_travelers"
                  type="number"
                  min={1}
                  max={20}
                  value={form.num_travelers}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Travel Preferences
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Preferences
                </label>
                <textarea
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="preferences"
                  placeholder="e.g., museums, beaches, nightlife, local cuisine, adventure sports (comma separated)"
                  rows={3}
                  value={form.preferences}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple preferences with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Plan Suggestions (1-5)
                </label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="suggestions"
                  type="number"
                  min={1}
                  max={5}
                  value={form.suggestions}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Optional Detailed Preferences */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Detailed Preferences (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Transport
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="transport"
                  value={form.transport}
                  onChange={handleChange}
                >
                  <option value="">Any Transport</option>
                  <option value="flight">✈️ Flight</option>
                  <option value="train">🚄 Train</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="car">🚗 Car/Road Trip</option>
                  <option value="boat">🚢 Boat/Ferry</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Type
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="accommodation"
                  value={form.accommodation}
                  onChange={handleChange}
                >
                  <option value="">Any Accommodation</option>
                  <option value="luxury-hotel">🏨 Luxury Hotel</option>
                  <option value="hotel">🏩 Standard Hotel</option>
                  <option value="hostel">🏠 Hostel</option>
                  <option value="airbnb">🏡 Airbnb/Vacation Rental</option>
                  <option value="resort">🏖️ Resort</option>
                  <option value="guesthouse">🏘️ Guesthouse/B&B</option>
                  <option value="camping">⛺ Camping</option>
                  <option value="boutique">✨ Boutique Hotel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Preferences
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="meal"
                  value={form.meal}
                  onChange={handleChange}
                >
                  <option value="">No Specific Preference</option>
                  <option value="vegetarian">🥗 Vegetarian</option>
                  <option value="vegan">🌱 Vegan</option>
                  <option value="halal">☪️ Halal</option>
                  <option value="kosher">✡️ Kosher</option>
                  <option value="gluten-free">🌾 Gluten-Free</option>
                  <option value="local-cuisine">🍜 Local Cuisine Focus</option>
                  <option value="fine-dining">🍷 Fine Dining</option>
                  <option value="street-food">🌮 Street Food</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Preference
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                >
                  <option value="">No Preference</option>
                  <option value="english">🇺🇸 English</option>
                  <option value="spanish">🇪🇸 Spanish</option>
                  <option value="french">🇫🇷 French</option>
                  <option value="german">🇩🇪 German</option>
                  <option value="italian">🇮🇹 Italian</option>
                  <option value="chinese">🇨🇳 Chinese</option>
                  <option value="japanese">🇯🇵 Japanese</option>
                  <option value="korean">🇰🇷 Korean</option>
                  <option value="arabic">🇸🇦 Arabic</option>
                  <option value="local">🌍 Local Language</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activities (Include/Exclude Specific Activities)
              </label>
              <textarea
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                name="activities"
                placeholder="e.g., exclude: extreme sports, crowded places; include: museums, art galleries, hiking, photography spots"
                rows={3}
                value={form.activities}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">Specify what to include or exclude from your itinerary</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
              disabled={loading || limitReached || !form.destination || !form.total_budget}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span>Creating Your Perfect Itinerary...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Travel Plan
                </div>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tip: Press Ctrl+Enter to submit quickly
            </p>
          </div>
        </div>
      </div>

      {/* Limit Reached Message and Upgrade Button */}
      {limitReached && (
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800">Limit Reached</h3>
                <p className="text-yellow-700">Your daily limit reached or subscription expired. Upgrade to premium for unlimited access.</p>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo -600 text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-700 hover:via-purple-700 hover:to-indigo -700 transition-colors text-sm font-medium"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Error Display (for other errors) */}
      {error && !limitReached && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display (Legacy AI Plan) */}
      {result && (
        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-lg">
          <h3 className="font-bold text-2xl mb-4 text-green-800 flex items-center">
            <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your AI-Generated Travel Plan
          </h3>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 max-h-96 overflow-y-auto">
            {parseTravelPlan(result).map((section, index) => (
              <div key={index} className="mb-4">
                {section.title && (
                  <h4 className={`font-semibold ${section.type === 'day' ? 'text-xl' : 'text-lg'} text-green-800 mb-2`}>
                    {section.title}
                  </h4>
                )}
                {section.items.length > 0 && (
                  <ul className="list-disc list-inside text-gray-800 text-sm leading-relaxed">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3 justify-end">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              📋 Copy Plan
            </button>

            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              ✨ Plan Another Trip
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips for Better Plans:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be specific about your destination (city/region)</li>
          <li>• Include activity preferences for personalized suggestions</li>
          <li>• Mention any accessibility needs in the activities field</li>
          <li>• Consider seasonal factors for your destination</li>
        </ul>
      </div>
    </div>
  );
};

export default PlanWithAI;