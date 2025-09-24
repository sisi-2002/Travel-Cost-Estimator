import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const session_id = params.get("session_id");
    setSessionId(session_id);

    const fetchSubscriptionDetails = async () => {
      try {
        const response = await fetch("http://localhost:8005/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          console.error("Failed to fetch user data");
        }
      } catch (err) {
        console.error("Error fetching subscription details:", err);
      }
    };

    if (sessionId) {
      fetchSubscriptionDetails();
    }
  }, [sessionId]);

  const handleContinuePlanning = () => {
    navigate("/plan-ai");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-lg w-full mx-auto p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Congratulations, {user?.full_name || "User"}! Your premium subscription
            has been activated. You now have unlimited access to AI-powered travel
            planning.
          </p>

          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Subscription Details
            </h2>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Plan:</span> Premium
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Status:</span> Active
            </p>
            {sessionId && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Transaction ID:</span> {sessionId}
              </p>
            )}
          </div>

          <button
            onClick={handleContinuePlanning}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Continue Planning Your Trip
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Need help? Contact support at{" "}
            <a
              href="mailto:support@tripcraft.com"
              className="text-blue-600 hover:underline"
            >
              support@tripcraft.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;