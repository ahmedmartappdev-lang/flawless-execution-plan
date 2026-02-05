import React from 'react';
import { Header } from '@/components/customer/Header';
import { BottomNavigation } from '@/components/customer/BottomNavigation';

interface CustomerLayoutProps {
  children: React.ReactNode;
  hideSearch?: boolean;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  hideSearch = false,
  hideHeader = false,
  hideBottomNav = false,
}) => {
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <Header hideSearch={hideSearch} />}
      {children}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
};

export default CustomerLayout;
