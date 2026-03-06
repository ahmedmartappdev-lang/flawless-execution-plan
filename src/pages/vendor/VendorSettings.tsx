import React, { useState, useEffect } from 'react';
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

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeLatitude, setStoreLatitude] = useState('');
  const [storeLongitude, setStoreLongitude] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

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

  // Initialize form fields from vendor data
  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.business_name || '');
      setStoreAddress(vendor.store_address || '');
      setStoreLatitude(vendor.store_latitude != null ? String(vendor.store_latitude) : '');
      setStoreLongitude(vendor.store_longitude != null ? String(vendor.store_longitude) : '');
      setBankAccountNumber(vendor.bank_account_number || '');
      setIfscCode(vendor.ifsc_code || '');
    }
  }, [vendor]);

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

  const storeSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.id) return;
      const { error } = await supabase
        .from('vendors')
        .update({ business_name: businessName, store_address: storeAddress })
        .eq('id', vendor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast({ title: 'Store settings saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save store settings', variant: 'destructive' });
    },
  });

  const storeLocationMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.id) return;
      const { error } = await supabase
        .from('vendors')
        .update({
          store_latitude: storeLatitude ? parseFloat(storeLatitude) : null,
          store_longitude: storeLongitude ? parseFloat(storeLongitude) : null,
        })
        .eq('id', vendor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast({ title: 'Store location saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save store location', variant: 'destructive' });
    },
  });

  const bankDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.id) return;
      const { error } = await supabase
        .from('vendors')
        .update({ bank_account_number: bankAccountNumber, ifsc_code: ifscCode })
        .eq('id', vendor.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast({ title: 'Bank details updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update bank details', variant: 'destructive' });
    },
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation is not supported by your browser', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoreLatitude(String(position.coords.latitude));
        setStoreLongitude(String(position.coords.longitude));
        toast({ title: 'Location detected successfully' });
      },
      (error) => {
        toast({ title: 'Failed to get current location', description: error.message, variant: 'destructive' });
      }
    );
  };

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
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
              />
            </div>
            <Button
              onClick={() => storeSettingsMutation.mutate()}
              disabled={storeSettingsMutation.isPending}
            >
              {storeSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Store Location */}
        <Card>
          <CardHeader>
            <CardTitle>Store Location</CardTitle>
            <CardDescription>Set your store coordinates for delivery routing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeLatitude">Latitude</Label>
              <Input
                id="storeLatitude"
                type="number"
                step="any"
                value={storeLatitude}
                onChange={(e) => setStoreLatitude(e.target.value)}
                placeholder="e.g. 28.6139"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeLongitude">Longitude</Label>
              <Input
                id="storeLongitude"
                type="number"
                step="any"
                value={storeLongitude}
                onChange={(e) => setStoreLongitude(e.target.value)}
                placeholder="e.g. 77.2090"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
              >
                Use Current Location
              </Button>
              <Button
                onClick={() => storeLocationMutation.mutate()}
                disabled={storeLocationMutation.isPending}
              >
                {storeLocationMutation.isPending ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
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
              <Input
                id="accountNumber"
                type="password"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
              />
            </div>
            <Button
              onClick={() => bankDetailsMutation.mutate()}
              disabled={bankDetailsMutation.isPending}
            >
              {bankDetailsMutation.isPending ? 'Updating...' : 'Update Bank Details'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorSettings;
