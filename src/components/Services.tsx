import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    title: "Flight Booking",
    description: "Find the best flight deals with our extensive airline partnerships and exclusive offers.",
    features: ["Best Price Guarantee", "Flexible Dates", "24/7 Support"]
  },
  {
    icon: Hotel,
    title: "Hotel Reservations",
    description: "Book from luxury resorts to boutique hotels, all carefully selected for quality and comfort.",
    features: ["Handpicked Properties", "Free Cancellation", "Member Discounts"]
  },
  {
    icon: Car,
    title: "Car Rentals",
    description: "Reliable car rental services with premium vehicles and comprehensive insurance coverage.",
    features: ["Premium Vehicles", "Full Insurance", "GPS Navigation"]
  },
  {
    icon: Camera,
    title: "Guided Tours",
    description: "Expertly crafted tours with local guides to discover hidden gems and cultural experiences.",
    features: ["Local Experts", "Small Groups", "Cultural Immersion"]
  },
  {
    icon: Shield,
    title: "Travel Insurance",
    description: "Comprehensive travel protection to ensure peace of mind throughout your journey.",
    features: ["Medical Coverage", "Trip Cancellation", "24/7 Assistance"]
  },
  {
    icon: HeartHandshake,
    title: "Concierge Service",
    description: "Personal travel concierge to handle all details and provide exclusive access to experiences.",
    features: ["Personal Assistant", "VIP Access", "Custom Itineraries"]
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
            From flight bookings to personalized concierge services, we handle every aspect of your travel to ensure a seamless and memorable experience.
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
                  <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                    Learn More
                  </Button>
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