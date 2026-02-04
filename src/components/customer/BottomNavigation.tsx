import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart', showBadge: true },
  { href: '/orders', icon: ClipboardList, label: 'Orders' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());

  // Don't show on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn('bottom-nav-item relative', isActive && 'active')}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.showBadge && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
