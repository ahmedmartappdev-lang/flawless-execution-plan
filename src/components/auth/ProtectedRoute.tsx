import React from 'react';
import { Navigate } from 'react-router-dom';
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
  const { isAdmin, isVendor, isDeliveryPartner, isCustomer, isLoading: rolesLoading } = useUserRoles();

  // Show loading while checking auth/roles
  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in and auth is required
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const roleMap: Record<AllowedRole, boolean> = {
      admin: isAdmin,
      vendor: isVendor,
      delivery_partner: isDeliveryPartner,
      customer: isCustomer,
    };

    const hasAccess = allowedRoles.some((role) => roleMap[role]);
    if (!hasAccess) {
      // Redirect to home if logged in but no access
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
