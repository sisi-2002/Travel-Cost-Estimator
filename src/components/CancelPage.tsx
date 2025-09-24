     import { useNavigate } from "react-router-dom";

     const PaymentCancel = () => {
       const navigate = useNavigate();

       const handleReturn = () => {
         navigate("/plan-ai");
       };

       return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
           <div className="max-w-lg w-full mx-auto p-8 bg-white rounded-xl shadow-2xl">
             <div className="text-center">
               <div className="flex justify-center mb-6">
                 <svg
                   className="w-16 h-16 text-red-500"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M6 18L18 6M6 6l12 12"
                   />
                 </svg>
               </div>

               <h1 className="text-3xl font-bold text-gray-800 mb-4">
                 Payment Cancelled
               </h1>

               <p className="text-gray-600 mb-6">
                 Your subscription upgrade was cancelled. You can try again or continue with the basic plan.
               </p>

               <button
                 onClick={handleReturn}
                 className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
               >
                 Return to Planning
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

     export default PaymentCancel;