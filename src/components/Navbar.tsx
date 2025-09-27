import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Plane } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";
import UserProfile from "./UserProfile";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const publicNavigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const protectedNavigation = [
    { name: "Flight Search", href: "/flights" },
    { name: "Hotel Search", href: "/hotels" },
    { name: "Plan with AI", href: "/plan-ai" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const navigation = [
    ...publicNavigation,
    ...(isAuthenticated ? protectedNavigation : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-ocean rounded-full p-2">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              TravelCraft
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`transition-colors duration-300 font-medium relative ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <>
                <AuthModal />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-lg rounded-lg mt-2 border border-border/50">
              {/* Public Navigation */}
              {publicNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 transition-colors duration-300 font-medium ${
                      isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-foreground hover:text-primary'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              
              {/* Protected Navigation */}
              {isAuthenticated ? (
                protectedNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-3 py-2 transition-colors duration-300 font-medium ${
                        isActive 
                          ? 'text-primary bg-primary/10' 
                          : 'text-foreground hover:text-primary'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  Sign in to access:
                  <div className="ml-2 mt-1 space-y-1">
                    {protectedNavigation.map((item) => (
                      <div key={item.name} className="text-xs text-muted-foreground">
                        • {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <AuthModal trigger={<Button variant="ghost" className="w-full justify-start">Sign In</Button>} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
