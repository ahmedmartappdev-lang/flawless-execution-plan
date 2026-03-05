import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, Package, TrendingUp, Clock, 
  CheckCircle, AlertCircle
} from 'lucide-react';
import { DashboardLayout, vendorNavItems } from '@/components/layouts/DashboardLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const VendorDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['vendor-stats', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return null;
      
      const [orders, products] = await Promise.all([
        supabase.from('orders').select('id, status, total_amount').eq('vendor_id', vendor.id),
        supabase.from('products').select('id, status, stock_quantity').eq('vendor_id', vendor.id),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const pendingOrders = orders.data?.filter(o => o.status === 'pending').length || 0;
      const lowStock = products.data?.filter(p => p.stock_quantity < 10).length || 0;

      return {
        totalOrders: orders.data?.length || 0,
        pendingOrders,
        totalProducts: products.data?.length || 0,
        lowStock,
        totalRevenue,
      };
    },
    enabled: !!vendor?.id,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['vendor-recent-orders', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, placed_at')
        .eq('vendor_id', vendor.id)
        .order('placed_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!vendor?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!vendor) {
    return (
      <DashboardLayout
        title="Vendor Dashboard"
        navItems={vendorNavItems}
        roleColor="bg-purple-500 text-white"
        roleName="Vendor Panel"
      >
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Vendor Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to be registered as a vendor to access this dashboard.
            </p>
            <Button>Apply as Vendor</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Vendor Dashboard"
      navItems={vendorNavItems}
      roleColor="bg-purple-500 text-white"
      roleName="Vendor Panel"
    >
      {/* Store Status */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{vendor.business_name}</h2>
              <p className="text-sm text-muted-foreground">{vendor.store_address}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor.is_accepting_orders ? 'default' : 'secondary'}>
                {vendor.is_accepting_orders ? 'Accepting Orders' : 'Not Accepting'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Today's Orders"
          value={stats?.pendingOrders || 0}
          icon={ShoppingCart}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Active Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStock || 0}
          icon={AlertCircle}
          iconColor="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                recentOrders?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(order.total_amount).toLocaleString()}</p>
                      <Badge className={getStatusColor(order.status)} variant="secondary">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Pending Orders</span>
              </div>
              <Button size="sm" variant="outline">View All</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Add New Product</span>
              </div>
              <Button size="sm" variant="outline">Add</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Update Inventory</span>
              </div>
              <Button size="sm" variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
