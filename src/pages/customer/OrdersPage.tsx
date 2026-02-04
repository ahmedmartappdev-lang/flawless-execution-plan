import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">My Orders</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Login to view orders</h2>
          <p className="text-muted-foreground text-center mb-6">
            Sign in to see your order history
          </p>
          <Button onClick={() => navigate('/auth')}>Login / Sign Up</Button>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Orders</h1>
        </div>
      </header>

      <main className="p-4">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
            <Clock className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground text-center mb-6">
            Your order history will appear here
          </p>
          <Button onClick={() => navigate('/')}>Start Shopping</Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default OrdersPage;
