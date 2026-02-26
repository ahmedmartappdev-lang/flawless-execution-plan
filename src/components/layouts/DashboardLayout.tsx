import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, ChevronDown, LogOut, User, Bell,
  LayoutDashboard, Package, Users, ShoppingCart, 
  Truck, Settings, Store, ClipboardList, BarChart3,
  FolderTree, Shield, MapPin, Image, Receipt, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
  roleColor: string;
  roleName: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  navItems,
  roleColor,
  roleName,
}) => {
  const _ = false; // sidebar no longer used on mobile
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", roleColor)}>
              <span className="text-sm">🛒</span>
            </div>
            <h1 className="font-semibold text-lg">{title}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={roleColor}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[260px] bg-background border-r border-border z-40">
        <SidebarContent
          navItems={navItems}
          location={location}
          roleColor={roleColor}
          roleName={roleName}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen pb-20 lg:pb-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={roleColor}>
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user?.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav navItems={navItems} currentPath={location.pathname} />
    </div>
  );
};

interface SidebarContentProps {
  navItems: NavItem[];
  location: { pathname: string };
  roleColor: string;
  roleName: string;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navItems,
  location,
  roleColor,
  roleName,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", roleColor)}>
            <span className="text-xl">🛒</span>
          </div>
          <div>
            <h2 className="font-bold">Ahmed Mart</h2>
            <p className="text-xs text-muted-foreground">{roleName}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Store className="w-5 h-5" />
          Go to Store
        </Link>
      </div>
    </div>
  );
};

/** Mobile bottom nav — picks up to 5 key items from the navItems array */
const MobileBottomNav: React.FC<{ navItems: NavItem[]; currentPath: string }> = ({ navItems, currentPath }) => {
  // Show max 5 items: first 4 + settings (last) if available
  const priorityItems = navItems.length <= 5
    ? navItems
    : [...navItems.slice(0, 4), navItems[navItems.length - 1]];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto py-1.5">
        {priorityItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Vendors', href: '/admin/vendors', icon: Store },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Delivery Partners', href: '/admin/delivery', icon: Truck },
  { label: 'Service Areas', href: '/admin/service-areas', icon: MapPin },
  { label: 'Admin Team', href: '/admin/team', icon: Shield },
  { label: 'Banners', href: '/admin/banners', icon: Image },
  { label: 'Bills', href: '/admin/bills', icon: Receipt },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const vendorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { label: 'Orders', href: '/vendor/orders', icon: ClipboardList },
  { label: 'Products', href: '/vendor/products', icon: Package },
  { label: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/vendor/settings', icon: Settings },
];

export const deliveryNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/delivery', icon: LayoutDashboard },
  { label: 'Available Orders', href: '/delivery/available', icon: Package },
  { label: 'Active Orders', href: '/delivery/active', icon: Truck },
  { label: 'Order History', href: '/delivery/history', icon: ClipboardList },
  { label: 'Cash Management', href: '/delivery/cash', icon: Wallet },
  { label: 'Earnings', href: '/delivery/earnings', icon: BarChart3 },
  { label: 'Settings', href: '/delivery/settings', icon: Settings },
];
