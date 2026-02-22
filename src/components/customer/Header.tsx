import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  MapPin, 
  User, 
  LogOut, 
  Package, 
  LayoutDashboard,
  ChevronDown,
  Info,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuthStore } from '@/stores/authStore';
import { useProductSuggestions } from '@/hooks/useProducts';
import { useUserLocation } from '@/hooks/useUserLocation';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { items } = useCartStore();
  const { isAdmin, isVendor, isDeliveryPartner } = useUserRoles();
  const { location: userLocation, isLoading: locationLoading, isServiceable } = useUserLocation();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live Search Suggestions
  const { data: suggestions, isLoading: isSearching } = useProductSuggestions(debouncedQuery);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Sync Search
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleProductClick = (slug: string) => {
    setSearchQuery(''); 
    setShowSuggestions(false);
    navigate(`/product/${slug}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
          {/* 1. Logo & Mobile Menu */}
          <div className="flex items-center gap-4 md:gap-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100">
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <Link to="/" className="text-2xl font-bold text-primary" onClick={() => document.body.click()}>
                    Ahmad Mart
                  </Link>
                  <nav className="flex flex-col gap-4">
                    <Link to="/" className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
                    <Link to="/orders" className="text-lg font-medium hover:text-primary transition-colors">My Orders</Link>
                    <Link to="/category/all" className="text-lg font-medium hover:text-primary transition-colors">Categories</Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold italic tracking-tighter -skew-x-6 text-[#1a1a1a] group-hover:scale-105 transition-transform">
                  Ahmad<span className="text-[#ff3f6c] ml-0.5">Mart</span>
                </h1>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#ff3f6c]/10 skew-x-12 rounded-full blur-[1px]" />
              </div>
            </Link>

            {/* 2. PREMIUM LOCATION BADGE */}
            <div className="hidden md:flex items-center">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:border-[#ff3f6c]/30 hover:bg-[#ff3f6c]/5 transition-all duration-300 group">
                      <div className="p-1 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                        <MapPin className="w-4 h-4 text-[#ff3f6c]" fill="currentColor" fillOpacity={0.1} />
                      </div>
                      <div className="flex flex-col items-start text-xs">
                        <span className="text-gray-400 font-medium leading-none mb-0.5 text-[10px] uppercase tracking-wider">Delivering to</span>
                        <span className="font-bold text-gray-800 group-hover:text-[#ff3f6c] transition-colors whitespace-nowrap">
                          {locationLoading ? 'Detecting...' : userLocation?.fullAddress || 'Select Location'}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-[#ff3f6c] transition-colors ml-1" />
                    </button>
                  </TooltipTrigger>
                  {!isServiceable && userLocation && (
                    <TooltipContent 
                      side="bottom" 
                      className="max-w-[280px] p-4 bg-white/95 backdrop-blur-xl border border-[#ff3f6c]/20 shadow-xl text-center z-50"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-1">
                          <Info className="w-4 h-4 text-[#ff3f6c]" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">Currently not delivering here</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          We are actively expanding our network. <br/>
                          <span className="text-[#ff3f6c] font-medium">Ahmad Mart</span> will reach your city soon!
                        </p>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* 3. Search Bar with Live Suggestions */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative group">
              <input
                type="text"
                placeholder="Search for 'Biryani' or 'Grocery'..."
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ff3f6c] focus:ring-4 focus:ring-[#ff3f6c]/10 transition-all outline-none text-sm placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff3f6c] transition-colors" />
            </form>

            {/* Live Search Dropdown */}
            {showSuggestions && searchQuery.length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Searching...</span>
                  </div>
                ) : suggestions && suggestions.length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Products</div>
                    {suggestions.map((product) => (
                      <div 
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                        onClick={() => handleProductClick(product.slug)}
                      >
                        <div className="w-8 h-8 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                           <img src={product.primary_image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                          <p className="text-[10px] text-gray-500 truncate">{product.category?.name}</p>
                        </div>
                        <div className="font-bold text-xs text-[#0c831f]">
                          ₹{product.selling_price}
                        </div>
                      </div>
                    ))}
                    <div 
                      className="border-t border-gray-100 p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 text-center text-xs font-medium text-[#0c831f]"
                      onClick={() => handleSearchSubmit()}
                    >
                      View all results for "{searchQuery}"
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-400 text-xs">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Right Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* User Profile / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 w-10 h-10 border border-transparent hover:border-gray-200">
                    <User className="h-5 w-5 text-gray-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" /> Orders
                  </DropdownMenuItem>
                  
                  {/* Role Based Dashboards */}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer text-purple-600 focus:text-purple-600 focus:bg-purple-50">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {isVendor && (
                    <DropdownMenuItem onClick={() => navigate('/vendor')} className="cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Vendor Dashboard
                    </DropdownMenuItem>
                  )}
                  {isDeliveryPartner && (
                    <DropdownMenuItem onClick={() => navigate('/delivery')} className="cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Delivery Dashboard
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/auth')} 
                variant="ghost" 
                className="font-semibold text-gray-700 hover:text-[#ff3f6c] hover:bg-[#ff3f6c]/5"
              >
                Login
              </Button>
            )}

            {/* Cart */}
            <Link to="/cart">
              <Button variant="default" size="icon" className="relative rounded-full bg-[#1a1a1a] hover:bg-black w-10 h-10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                <ShoppingCart className="h-5 w-5 text-white" />
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#ff3f6c] text-white border-2 border-white rounded-full text-[10px] font-bold shadow-sm"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden py-3 pb-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ff3f6c] outline-none text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </form>
          
          <div className="mt-3 flex justify-center">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <MapPin className="w-3 h-3 text-[#ff3f6c]" />
                <span className="text-[10px] font-medium text-gray-600">
                  Delivering to <strong className="text-gray-900">
                    {locationLoading ? 'Detecting...' : userLocation ? `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ''}` : 'Select Location'}
                  </strong>
                </span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};
