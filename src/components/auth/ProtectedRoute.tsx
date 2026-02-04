import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUserRoles } from '@/hooks/useUserRoles';

type AllowedRole = 'admin' | 'vendor' | 'delivery_partner' | 'customer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/auth',
}) => {
  const { user, isLoading: authLoading } = useAuthStore();
  const { 
    isAdmin, 
    isVendor, 
    isDeliveryPartner, 
    isCustomer, 
    isLoading: rolesLoading 
  } = useUserRoles();
  const location = useLocation();

  // Debugging logs to see where it gets stuck
  useEffect(() => {
    console.log('ProtectedRoute State:', { 
      path: location.pathname,
      authLoading, 
      rolesLoading, 
      userEmail: user?.email,
      roles: { isAdmin, isVendor, isDeliveryPartner, isCustomer }
    });
  }, [authLoading, rolesLoading, user, isAdmin, isVendor, isDeliveryPartner, isCustomer, location.pathname]);

  // 1. Loading State
  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 2. Not Authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Role Validation
  if (allowedRoles && allowedRoles.length > 0) {
    const roleMap: Record<AllowedRole, boolean | undefined> = {
      admin: isAdmin,
      vendor: isVendor,
      delivery_partner: isDeliveryPartner,
      customer: isCustomer,
    };

    const hasAccess = allowedRoles.some((role) => roleMap[role]);
    
    if (!hasAccess) {
      console.warn(`Access denied for user ${user?.email} to ${location.pathname}. Required roles: ${allowedRoles.join(', ')}`);
      // Redirect to home if logged in but no access
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
