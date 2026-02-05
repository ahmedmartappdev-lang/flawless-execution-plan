import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Info
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

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { user, signOut } = useAuth();
  const { roles } = useUserRoles();
  
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
          {/* Logo & Mobile Menu */}
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

            {/* PREMIUM LOCATION BADGE */}
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
                          Ambur, Tamil Nadu, India
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-[#ff3f6c] transition-colors ml-1" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="max-w-[280px] p-4 bg-white/95 backdrop-blur-xl border border-[#ff3f6c]/20 shadow-xl text-center z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-1">
                        <Info className="w-4 h-4 text-[#ff3f6c]" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Currently delivering here only
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        We are actively expanding our network. <br/>
                        <span className="text-[#ff3f6c] font-medium">Ahmad Mart</span> will reach your city soon!
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearch} className="w-full relative group">
              <input
                type="text"
                placeholder="Search for 'Biryani' or 'Grocery'..."
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ff3f6c] focus:ring-4 focus:ring-[#ff3f6c]/10 transition-all outline-none text-sm placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff3f6c] transition-colors" />
            </form>
          </div>

          {/* Right Actions */}
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
                  {roles.isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer text-purple-600 focus:text-purple-600 focus:bg-purple-50">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {roles.isVendor && (
                    <DropdownMenuItem onClick={() => navigate('/vendor')} className="cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Vendor Dashboard
                    </DropdownMenuItem>
                  )}
                  {roles.isDeliveryPartner && (
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
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ff3f6c] outline-none text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </form>
          
          {/* Mobile Location Badge (Below Search) */}
          <div className="mt-3 flex justify-center">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <MapPin className="w-3 h-3 text-[#ff3f6c]" />
                <span className="text-[10px] font-medium text-gray-600">Delivering to <strong className="text-gray-900">Ambur, Tamil Nadu</strong></span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
