import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ChevronDown, ShoppingCart, Search, User, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  hideSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ hideSearch = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { items } = useCartStore();
  const { isAdmin, isVendor, isDeliveryPartner, isLoading: rolesLoading } = useUserRoles();
  
  // Initialize search from URL to keep input in sync
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Update local state if URL changes (e.g. via back button)
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Determine dashboard path based on role
  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isVendor) return '/vendor';
    if (isDeliveryPartner) return '/delivery';
    return null;
  };
  const dashboardPath = getDashboardPath();
  const hasRoleDashboard = !rolesLoading && dashboardPath !== null;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        // Navigate to homepage with query param to search "in place"
        navigate(`/?q=${encodeURIComponent(searchQuery)}`);
      } else {
        // If cleared, go to homepage without query
        navigate('/');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] shadow-sm">
      <div className="px-[4%] py-3 flex items-center justify-between gap-4">
        
        {/* LEFT: Branding & Location */}
        <div className="flex items-center gap-4 md:gap-10">
          {/* PREMIUM BRANDING: AHMAD MART */}
          <Link to="/" className="flex-shrink-0 hover:scale-105 transition-transform">
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight leading-none select-none">
              <span className="text-[#facc15] drop-shadow-sm">Ahmad</span>
              <span className="text-[#0c831f] ml-1.5">Mart</span>
            </h1>
          </Link>

          {/* Location (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col border-l border-[#ddd] pl-5 min-w-[200px] cursor-pointer">
            <span className="font-extrabold text-[12px] md:text-[14px]">Delivery in 15 minutes</span>
            <div className="text-[11px] md:text-[13px] text-[#666] truncate max-w-[200px] flex items-center gap-1">
              Knowledge Park II, Greater... <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* CENTER: Search Bar */}
        {!hideSearch && (
          <div className="flex-grow max-w-[600px] mx-4 relative hidden md:block">
            <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#888] w-4 h-4" />
            <input 
              type="text" 
              className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[12px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        )}

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* User / Login */}
          {!user ? (
            <div 
              className="hidden md:flex items-center gap-1 font-medium text-[15px] cursor-pointer hover:text-[#0c831f]" 
              onClick={() => navigate('/auth')}
            >
              Login
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="hidden md:flex items-center gap-1 font-medium text-[15px] cursor-pointer hover:text-[#0c831f]">
                  {user.email?.split('@')[0]} <ChevronDown className="w-4 h-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Orders
                </DropdownMenuItem>
                {hasRoleDashboard && (
                  <DropdownMenuItem onClick={() => navigate(dashboardPath!)} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Cart Button */}
          <button 
            className="bg-[#0c831f] text-white px-[16px] md:px-[20px] py-[10px] md:py-[12px] rounded-[8px] font-bold border-none flex items-center gap-[8px] md:gap-[10px] cursor-pointer hover:bg-[#096e1a] transition-colors"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline text-sm md:text-base">My Cart</span>
            {items.length > 0 && (
              <div className="bg-white text-[#0c831f] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {items.length}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search (Visible only on small screens) */}
      {!hideSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#888] w-4 h-4" />
            <input 
              type="text" 
              className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[10px] pl-[40px] pr-[14px] text-[14px] outline-none"
              placeholder="Search for products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
