import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Login to continue</h2>
          <p className="text-muted-foreground text-center mb-6">
            Sign in to view your profile and orders
          </p>
          <Button onClick={() => navigate('/auth')}>Login / Sign Up</Button>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  const menuItems = [
    { icon: Package, label: 'My Orders', href: '/orders' },
    { icon: MapPin, label: 'Saved Addresses', href: '/addresses' },
    { icon: CreditCard, label: 'Payment Methods', href: '/payments' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  ];

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* User Info Card */}
        <div className="bg-background rounded-xl border border-border p-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-background rounded-xl border border-border divide-y divide-border">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
