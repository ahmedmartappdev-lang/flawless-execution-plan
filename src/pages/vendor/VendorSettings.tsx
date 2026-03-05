import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout, vendorNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const VendorSettings: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const toggleOrdersMutation = useMutation({
    mutationFn: async (accepting: boolean) => {
      if (!vendor?.id) return;
      const { error } = await supabase
        .from('vendors')
        .update({ is_accepting_orders: accepting })
        .eq('id', vendor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast({ title: 'Settings updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout
      title="Settings"
      navItems={vendorNavItems}
      roleColor="bg-purple-500 text-white"
      roleName="Vendor Panel"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Store Settings</CardTitle>
            <CardDescription>Manage your store preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" defaultValue={vendor?.business_name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input id="storeAddress" defaultValue={vendor?.store_address || ''} />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Order Settings</CardTitle>
            <CardDescription>Configure order preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Accepting Orders</p>
                <p className="text-sm text-muted-foreground">Toggle to stop receiving new orders</p>
              </div>
              <Switch 
                checked={vendor?.is_accepting_orders || false}
                onCheckedChange={(checked) => toggleOrdersMutation.mutate(checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>For receiving payouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" defaultValue={vendor?.bank_account_number || ''} type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input id="ifsc" defaultValue={vendor?.ifsc_code || ''} />
            </div>
            <Button>Update Bank Details</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorSettings;
