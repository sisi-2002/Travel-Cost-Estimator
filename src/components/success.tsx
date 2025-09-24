import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    // Optional: Verify the subscription status by calling backend API
    // This ensures the user is upgraded to premium
    const verifySubscription = async () => {
      const token = localStorage.getItem('access_token');
      if (token && sessionId) {
        try {
          const response = await fetch('/api/verify-subscription', { // Adjust endpoint as needed
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (response.ok) {
            // Update auth context if needed
            setIsAuthenticated(true);
            // Optionally redirect to dashboard or plan page
            // navigate('/plan-ai');
          } else {
            console.error('Subscription verification failed');
          }
        } catch (error) {
          console.error('Error verifying subscription:', error);
        }
      }
    };

    verifySubscription();
  }, [sessionId, setIsAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your premium subscription has been activated. Enjoy unlimited AI travel plans!
          </p>
          {sessionId && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Session ID:</p>
              <p className="text-sm text-gray-500 break-all">{sessionId}</p>
            </div>
          )}
          <div className="space-y-3 mt-6">
            <button
              onClick={() => navigate('/plan-ai')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Generate Travel Plan
            </button>
            <button
              onClick={() => navigate('/dashboard')} // Adjust to your dashboard route
              className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;