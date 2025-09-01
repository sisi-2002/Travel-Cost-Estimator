import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock } from "lucide-react";
import mountainsImage from "@/assets/destination-mountains.jpg";
import cityImage from "@/assets/destination-city.jpg";
import safariImage from "@/assets/destination-safari.jpg";

const destinations = [
  {
    id: 1,
    name: "Swiss Alps Adventure",
    location: "Switzerland",
    image: mountainsImage,
    price: "$2,499",
    rating: 4.9,
    reviews: 127,
    duration: "7 days",
    description: "Experience breathtaking mountain views, pristine lakes, and charming alpine villages."
  },
  {
    id: 2,
    name: "European Heritage Tour",
    location: "Prague, Czech Republic",
    image: cityImage,
    price: "$1,899",
    rating: 4.8,
    reviews: 89,
    duration: "5 days",
    description: "Discover historic architecture, cobblestone streets, and rich cultural heritage."
  },
  {
    id: 3,
    name: "African Safari Experience",
    location: "Kenya & Tanzania",
    image: safariImage,
    price: "$3,299",
    rating: 5.0,
    reviews: 156,
    duration: "10 days",
    description: "Witness the Great Migration and encounter Africa's magnificent wildlife."
  },
  
];

const Destinations = () => {
  return (
    <section id="destinations" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Popular 
            <span className="bg-gradient-ocean bg-clip-text text-transparent"> Destinations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our handpicked destinations that offer unforgettable experiences and breathtaking memories.
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination) => (
            <Card key={destination.id} className="group overflow-hidden border-0 shadow-card-travel hover:shadow-travel transition-all duration-500 bg-gradient-card backdrop-blur-sm">
              <div className="relative overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {destination.price}
                </div>
                <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 text-secondary fill-current" />
                  <span className="text-sm font-semibold">{destination.rating}</span>
                  <span className="text-sm text-muted-foreground">({destination.reviews})</span>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {destination.name}
                  </h3>
                </div>
                
                <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{destination.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{destination.duration}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  {destination.description}
                </p>
                
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Destinations;