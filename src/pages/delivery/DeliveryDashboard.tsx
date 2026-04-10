import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Truck, Package, TrendingUp, Clock,
  AlertCircle, MapPin, Bike, Car
} from 'lucide-react';
import { DashboardLayout, deliveryNavItems } from '@/components/layouts/DashboardLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: partner } = useQuery({
    queryKey: ['delivery-partner-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: cashCollected } = useQuery({
    queryKey: ['delivery-cash-collected', partner?.id],
    refetchInterval: 30000,
    queryFn: async () => {
      if (!partner?.id) return 0;
      const { data } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('delivery_partner_id', partner.id)
        .eq('status', 'delivered')
        .eq('payment_method', 'cash');
      return data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    },
    enabled: !!partner?.id,
  });

  const { data: approvedBills } = useQuery({
    queryKey: ['delivery-approved-bills', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return 0;
      const { data } = await supabase
        .from('delivery_bills')
        .select('amount')
        .eq('delivery_partner_id', partner.id)
        .eq('status', 'approved');
      return data?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
    },
    enabled: !!partner?.id,
  });

  // Verified cash collections assigned to this partner
  const { data: verifiedCollections } = useQuery({
    queryKey: ['delivery-verified-collections-dash', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return 0;
      const { data } = await (supabase.from('credit_cash_collections') as any)
        .select('amount')
        .eq('delivery_partner_id', partner.id)
        .eq('status', 'verified');
      return data?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
    },
    enabled: !!partner?.id,
  });

  // Approved cash returns
  const { data: approvedCashReturns } = useQuery({
    queryKey: ['delivery-approved-cash-returns', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return 0;
      const { data } = await (supabase.from('cash_returns') as any)
        .select('amount')
        .eq('delivery_partner_id', partner.id)
        .eq('status', 'approved');
      return data?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    },
    enabled: !!partner?.id,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['delivery-active-orders', partner?.id],
    refetchInterval: 30000,
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', partner.id)
        .in('status', ['assigned_to_delivery', 'picked_up', 'out_for_delivery'])
        .order('placed_at', { ascending: false });
      return data || [];
    },
    enabled: !!partner?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800';
      case 'assigned_to_delivery': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bicycle': return <Bike className="w-8 h-8" />;
      case 'bike': case 'scooter': return <Bike className="w-8 h-8" />;
      case 'car': return <Car className="w-8 h-8" />;
      default: return <Truck className="w-8 h-8" />;
    }
  };

  const netToTransfer = (cashCollected || 0) - (approvedBills || 0) + (verifiedCollections || 0) - (approvedCashReturns || 0);

  if (!partner) {
    return (
      <DashboardLayout
        title="Delivery Dashboard"
        navItems={deliveryNavItems}
        roleColor="bg-blue-500 text-white"
        roleName="Delivery Partner"
      >
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Delivery Partner Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to be registered as a delivery partner to access this dashboard.
            </p>
            <Button onClick={() => navigate('/delivery/apply')}>Apply as Delivery Partner</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Delivery Dashboard"
      navItems={deliveryNavItems}
      roleColor="bg-blue-500 text-white"
      roleName="Delivery Partner"
    >
      {/* Partner Status */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{getVehicleIcon(partner.vehicle_type)}</span>
              <div>
                <h2 className="text-xl font-bold capitalize">{partner.vehicle_type}</h2>
                <p className="text-sm text-muted-foreground">{partner.vehicle_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={partner.status === 'available' ? 'default' : 'secondary'}>
                {partner.status.replace(/_/g, ' ')}
              </Badge>
              {partner.is_verified && (
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Orders"
          value={activeOrders?.length || 0}
          icon={Truck}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Total Deliveries"
          value={partner.total_deliveries || 0}
          icon={Package}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Rating"
          value={partner.rating?.toFixed(1) || '0.0'}
          icon={TrendingUp}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <StatsCard
          title="Status"
          value={partner.status.replace(/_/g, ' ')}
          icon={Clock}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Cash Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Cash Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Cash Collected</p>
              <p className="text-xl font-bold text-green-600">₹{(cashCollected || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bills Deducted</p>
              <p className="text-xl font-bold text-red-600">₹{(approvedBills || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash Returned</p>
              <p className="text-xl font-bold text-purple-600">₹{(approvedCashReturns || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net to Transfer</p>
              <p className="text-xl font-bold">₹{netToTransfer.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {activeOrders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders?.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{order.order_number}</span>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {typeof order.delivery_address === 'object' 
                        ? (order.delivery_address as any)?.address_line1 || 'Address not available'
                        : 'Address not available'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">₹{Number(order.total_amount).toLocaleString()}</span>
                    <Button size="sm" onClick={() => navigate('/delivery/active')}>Update Status</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
