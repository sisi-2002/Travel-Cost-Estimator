import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import FlightSearch from "./pages/FlightSearch";
import HotelSearch from "./pages/HotelSearch";
import TransportSearch from "./pages/TransportSearch";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PlanWithAI from "./pages/PlanWithAI";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import Authenticate from './components/AuthModal';
import Success from './components/success'
import CancelPage from './components/CancelPage';
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Authenticate />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/flights" element={<FlightSearch />} />
            <Route path="/hotels" element={<HotelSearch />} />
            <Route path="/transport" element={<TransportSearch />} />
            <Route path="/plan-ai" element={<ProtectedRoute><PlanWithAI /></ProtectedRoute>} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;