import React from 'react';
import { Header } from '@/components/customer/Header';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { Footer } from '@/components/customer/Footer';

interface CustomerLayoutProps {
  children: React.ReactNode;
  hideSearch?: boolean;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  hideHeader = false,
  hideBottomNav = false,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!hideHeader && <Header />}
      
      {/* Main content expands to fill available space */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer component */}
      <Footer />

      {/* Mobile Bottom Nav (Fixed) */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
};

export default CustomerLayout;
