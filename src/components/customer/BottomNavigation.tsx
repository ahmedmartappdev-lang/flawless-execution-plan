import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

// Custom premium SVG icons — outline (inactive) and filled (active)
const HomeOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-4a1 1 0 01-1-1v-4.5a1 1 0 00-1-1h-3a1 1 0 00-1 1V20.5a1 1 0 01-1 1h-4A1.5 1.5 0 013 20V10.5z" />
  </svg>
);
const HomeFilled = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12.707 2.293a1 1 0 00-1.414 0l-9 9A1 1 0 003 13h1v7a2 2 0 002 2h4a1 1 0 001-1v-5h2v5a1 1 0 001 1h4a2 2 0 002-2v-7h1a1 1 0 00.707-1.707l-9-9z" />
  </svg>
);

const SearchOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);
const SearchFilled = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.5 2a8.5 8.5 0 105.262 15.176l3.531 3.531a1 1 0 001.414-1.414l-3.531-3.531A8.5 8.5 0 0010.5 2zM4 10.5a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
  </svg>
);

const CartOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const CartFilled = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M6.505 2.112A1 1 0 017.38 2h9.24a1 1 0 01.875.512L20.37 7H3.63l2.875-4.888zM3 8h18a1 1 0 011 1v11a3 3 0 01-3 3H5a3 3 0 01-3-3V9a1 1 0 011-1zm5 4a4 4 0 008 0 1 1 0 10-2 0 2 2 0 01-4 0 1 1 0 10-2 0z" />
  </svg>
);

const OrdersOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 7h8M8 12h6M8 17h4" />
  </svg>
);
const OrdersFilled = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm5 0a1 1 0 000 2h8a1 1 0 100-2H8zm0 5a1 1 0 100 2h6a1 1 0 100-2H8zm0 5a1 1 0 100 2h4a1 1 0 100-2H8z" />
  </svg>
);

const ProfileOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 00-16 0" />
  </svg>
);
const ProfileFilled = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="12" cy="8" r="5" />
    <path d="M3.5 21.5a9 9 0 0117 0 .75.75 0 01-.75.5H4.25a.75.75 0 01-.75-.5z" />
  </svg>
);

const navItems = [
  { href: '/', label: 'Home', icon: HomeOutline, activeIcon: HomeFilled },
  { href: '/search', label: 'Search', icon: SearchOutline, activeIcon: SearchFilled },
  { href: '/cart', label: 'Cart', icon: CartOutline, activeIcon: CartFilled, showBadge: true },
  { href: '/orders', label: 'Orders', icon: OrdersOutline, activeIcon: OrdersFilled },
  { href: '/profile', label: 'Account', icon: ProfileOutline, activeIcon: ProfileFilled },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());

  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 relative min-w-[56px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon />
                {item.showBadge && totalItems > 0 && (
                  <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center shadow-sm border-2 border-white">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] leading-none mt-0.5',
                isActive ? 'font-bold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
