import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Users } from "lucide-react";
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
            Your Dream
            <span className="block bg-gradient-sunset bg-clip-text text-transparent">
              Adventure Awaits
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Discover breathtaking destinations, create unforgettable memories, and let us craft the perfect journey for you.
          </p>

          {/* Search Bar */}
          <div className="bg-gradient-card backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-4xl mx-auto border border-primary-foreground/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Where to?" 
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Check-in" 
                  type="date"
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Check-out" 
                  type="date"
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Guests" 
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Button 
              variant="travel" 
              size="lg" 
              className="w-full md:w-auto mt-4 shadow-button-travel"
            >
              <Search className="mr-2 h-5 w-5" />
              Search Adventures
            </Button>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="travel" 
              size="lg" 
              className="text-lg px-8 py-6 shadow-button-travel"
            >
              Explore Destinations
            </Button>
            
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