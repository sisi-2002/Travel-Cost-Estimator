import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Plane, 
  Hotel, 
  Car, 
  Camera, 
  Shield, 
  HeartHandshake,
  Globe,
  Clock
} from "lucide-react";

const services = [
  {
    icon: Plane,
    title: "Flight Cost Estimation",
    description: "Get accurate flight cost estimates with real-time pricing from multiple airlines and booking platforms.",
    features: ["Real-time Pricing", "Price Alerts", "Best Deal Finder"],
    link: "/flights"
  },
  {
    icon: Hotel,
    title: "Hotel Cost Analysis",
    description: "Compare hotel prices across different platforms and get accurate cost estimates for your stay.",
    features: ["Price Comparison", "Location Analysis", "Amenity Costs"],
    link: "/hotels"
  },
  {
    icon: Globe,
    title: "AI Travel Planning",
    description: "Let our AI analyze your preferences and create personalized itineraries with accurate cost breakdowns.",
    features: ["Smart Recommendations", "Budget Optimization", "Personalized Itineraries"],
    link: "/plan-ai"
  },
  {
    icon: Clock,
    title: "Cost Tracking",
    description: "Track your travel expenses in real-time and get alerts when prices change for your planned trip.",
    features: ["Real-time Tracking", "Price Alerts", "Budget Management"],
    link: "/dashboard"
  },
  {
    icon: Shield,
    title: "Travel Insurance",
    description: "Get comprehensive travel protection with accurate cost estimates for different coverage levels.",
    features: ["Coverage Analysis", "Cost Comparison", "Risk Assessment"],
    link: "/contact"
  },
  {
    icon: HeartHandshake,
    title: "Budget Planning",
    description: "Create detailed travel budgets with accurate cost estimates for all aspects of your trip.",
    features: ["Budget Templates", "Cost Breakdowns", "Savings Tips"],
    link: "/dashboard"
  }
];



const Services = () => {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our 
            <span className="bg-gradient-sunset bg-clip-text text-transparent"> Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get accurate cost estimates and find the best deals with our AI-powered travel planning tools. From flights to hotels, we help you plan and budget your perfect trip.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="group border-0 shadow-card-travel hover:shadow-travel transition-all duration-500 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <div className="bg-gradient-ocean rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-gradient-ocean rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to={service.link}>
                    <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                      Try Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Bar */}
        
      </div>
    </section>
  );
};

export default Services;