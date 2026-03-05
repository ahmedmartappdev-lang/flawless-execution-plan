import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { DashboardLayout, vendorNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const VendorAnalytics: React.FC = () => {
  const { user } = useAuthStore();

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['vendor-analytics', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return null;
      
      const [orders, products] = await Promise.all([
        supabase.from('orders').select('id, status, total_amount').eq('vendor_id', vendor.id),
        supabase.from('products').select('id, status').eq('vendor_id', vendor.id),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const deliveredOrders = orders.data?.filter(o => o.status === 'delivered').length || 0;
      const activeProducts = products.data?.filter(p => p.status === 'active').length || 0;

      return {
        totalOrders: orders.data?.length || 0,
        deliveredOrders,
        totalRevenue,
        totalProducts: products.data?.length || 0,
        activeProducts,
      };
    },
    enabled: !!vendor?.id,
  });

  return (
    <DashboardLayout
      title="Analytics"
      navItems={vendorNavItems}
      roleColor="bg-purple-500 text-white"
      roleName="Vendor Panel"
    >
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Completed Orders</p>
                  <p className="text-3xl font-bold">{stats?.deliveredOrders || 0}</p>
                </div>
                <ShoppingCart className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Products</p>
                  <p className="text-3xl font-bold">{stats?.activeProducts || 0}</p>
                </div>
                <Package className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Charts will be displayed here once you have more data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorAnalytics;
