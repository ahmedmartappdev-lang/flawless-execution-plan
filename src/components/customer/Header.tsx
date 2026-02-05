import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, Search, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

interface HeaderProps {
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const { isAuthenticated } = useAuth();
  const { isAdmin, isVendor, isDeliveryPartner, isLoading: rolesLoading } = useUserRoles();

  // Determine the dashboard path based on highest priority role
  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isVendor) return '/vendor';
    if (isDeliveryPartner) return '/delivery';
    return null;
  };

  const dashboardPath = getDashboardPath();
  const hasRoleDashboard = !rolesLoading && dashboardPath !== null;

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
      {/* Top Row - Branding, Location & Notifications */}
      <div className="flex items-center justify-between p-3 gap-2">
        <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
          {/* PREMIUM BRANDING: AHMAD MART */}
          <Link to="/" className="flex-shrink-0 transition-transform hover:scale-105">
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight leading-none select-none">
              <span className="text-[#facc15] drop-shadow-sm">Ahmad</span>
              <span className="text-primary drop-shadow-sm ml-1.5">Mart</span>
            </h1>
          </Link>

          {/* Location Indicator */}
          <div className="flex items-center gap-2 cursor-pointer border-l border-border pl-3 md:pl-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Deliver to</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-foreground truncate max-w-[120px] md:max-w-[180px]">
                  Select Location
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <>
              {/* Dashboard Button for role users */}
              {hasRoleDashboard && (
                <Link to={dashboardPath!}>
                  <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              )}
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/5">
                  <Bell className="w-5 h-5 text-foreground" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="font-medium">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-3">
        <Link to="/search">
          <div className="flex items-center gap-3 bg-muted/50 hover:bg-muted/80 transition-colors border border-transparent hover:border-border rounded-xl px-4 py-3 cursor-pointer shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm flex-1 font-medium">
              Search for products...
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
