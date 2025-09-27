import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  MapPin, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Heart,
  Award,
  Clock,
  DollarSign,
  Smartphone,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const features = [
    {
      icon: <Plane className="h-8 w-8" />,
      title: "Flight Search",
      description: "Find the best flight deals with real-time pricing from multiple airlines"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Hotel Booking",
      description: "Discover and book accommodations that fit your budget and preferences"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Planning",
      description: "Get personalized travel recommendations powered by advanced AI technology"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Cost Estimation",
      description: "Accurate budget planning with comprehensive cost breakdowns"
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Travelers" },
    { number: "100+", label: "Countries Covered" },
    { number: "1M+", label: "Flights Searched" },
    { number: "24/7", label: "Customer Support" }
  ];

  const values = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Passion for Travel",
      description: "We believe travel enriches lives and creates unforgettable memories"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Trust & Security",
      description: "Your data and payments are protected with enterprise-grade security"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "User-Centric",
      description: "Every feature is designed with our users' needs and feedback in mind"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Excellence",
      description: "We strive for excellence in every aspect of our service"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-ocean text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About TravelCraft
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Revolutionizing travel planning with AI-powered cost estimation and personalized recommendations
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Globe className="mr-2 h-4 w-4" />
              Global Coverage
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Zap className="mr-2 h-4 w-4" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Shield className="mr-2 h-4 w-4" />
              Secure & Reliable
            </Badge>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              At TravelCraft, we believe that travel planning should be effortless, affordable, and personalized. 
              Our mission is to empower travelers with intelligent tools that make every journey memorable and 
              budget-friendly. We combine cutting-edge AI technology with deep travel industry expertise to 
              provide accurate cost estimations and personalized recommendations.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    To become the world's most trusted travel planning platform, making global travel 
                    accessible and affordable for everyone through innovative technology.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                    Our Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We've helped thousands of travelers save money and time while discovering amazing 
                    destinations they never knew existed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive travel planning tools designed to make your journey seamless and cost-effective
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 text-blue-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl opacity-90">
              Trusted by travelers worldwide
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg opacity-90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 text-blue-600">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                Powered by Advanced Technology
              </h2>
              <p className="text-lg text-gray-600">
                We leverage cutting-edge AI and machine learning to provide accurate predictions and personalized experiences
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 text-green-600">
                    <Zap className="h-8 w-8" />
                  </div>
                  <CardTitle>AI-Powered Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Advanced machine learning algorithms analyze millions of data points to provide accurate cost estimations
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 text-blue-600">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <CardTitle>Mobile-First Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Responsive design ensures seamless experience across all devices and screen sizes
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 text-purple-600">
                    <Shield className="h-8 w-8" />
                  </div>
                  <CardTitle>Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Bank-level security protects your personal information and payment details
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-ocean text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of travelers who trust TravelCraft for their travel planning needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/flights">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                <Plane className="mr-2 h-5 w-5" />
                Search Flights
              </Button>
            </Link>
            <Link to="/plan-ai">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                <Zap className="mr-2 h-5 w-5" />
                Plan with AI
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
