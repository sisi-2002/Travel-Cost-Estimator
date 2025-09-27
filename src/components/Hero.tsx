import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-beach.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Smart Travel
            <span className="block bg-gradient-sunset bg-clip-text text-transparent">
              Cost Estimation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Get accurate travel cost estimates with AI-powered planning. Find the best deals on flights, hotels, and create your perfect itinerary.
          </p>

          {/* Cost Estimation Tools */}
          <div className="bg-gradient-card backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-4xl mx-auto border border-primary-foreground/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                Get Your Travel Cost Estimate
              </h3>
              <p className="text-primary-foreground/80">
                Choose your preferred method to start planning
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background/30 rounded-xl p-4 text-center hover:bg-background/50 transition-colors">
                <div className="bg-gradient-ocean rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-primary-foreground mb-2">Flight Search</h4>
                <p className="text-sm text-primary-foreground/80 mb-3">Find the best flight deals</p>
                <Link to="/flights">
                  <Button variant="outline" size="sm" className="w-full border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary">
                    Search Flights
                  </Button>
                </Link>
              </div>
              
              <div className="bg-background/30 rounded-xl p-4 text-center hover:bg-background/50 transition-colors">
                <div className="bg-gradient-ocean rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-primary-foreground mb-2">Hotel Search</h4>
                <p className="text-sm text-primary-foreground/80 mb-3">Book your perfect stay</p>
                <Link to="/hotels">
                  <Button variant="outline" size="sm" className="w-full border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary">
                    Search Hotels
                  </Button>
                </Link>
              </div>
              
              <div className="bg-background/30 rounded-xl p-4 text-center hover:bg-background/50 transition-colors">
                <div className="bg-gradient-ocean rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-primary-foreground mb-2">AI Planning</h4>
                <p className="text-sm text-primary-foreground/80 mb-3">Let AI plan your trip</p>
                <Link to="/plan-ai">
                  <Button variant="outline" size="sm" className="w-full border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary">
                    Plan with AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/flights">
              <Button 
                variant="travel" 
                size="lg" 
                className="text-lg px-8 py-6 shadow-button-travel"
              >
                Start Planning
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                variant="travel" 
                size="lg" 
                className="text-lg px-8 py-6 shadow-button-travel"
              >
                About Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;