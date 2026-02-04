import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      {/* Top Row - Location & Notifications */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Deliver to</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-foreground truncate max-w-[180px]">
                Select Location
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-3">
        <Link to="/search">
          <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 cursor-pointer">
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm flex-1">
              Search for products...
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
