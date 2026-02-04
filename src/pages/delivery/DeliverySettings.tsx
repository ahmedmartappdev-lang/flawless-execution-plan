import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout, deliveryNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const DeliverySettings: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!partner?.id) return;
      const { error } = await supabase
        .from('delivery_partners')
        .update({ status: status as any })
        .eq('id', partner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partner-profile'] });
      toast({ title: 'Status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const getVehicleIcon = (type: string) => {
    const icons: Record<string, string> = {
      bicycle: '🚲',
      bike: '🏍️',
      scooter: '🛵',
      car: '🚗',
    };
    return icons[type] || '🚗';
  };

  return (
    <DashboardLayout
      title="Settings"
      navItems={deliveryNavItems}
      roleColor="bg-blue-500 text-white"
      roleName="Delivery Partner"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Your registered vehicle details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-4xl">{getVehicleIcon(partner?.vehicle_type || 'bike')}</span>
              <div>
                <p className="font-medium capitalize">{partner?.vehicle_type || 'Not set'}</p>
                <p className="text-sm text-muted-foreground">{partner?.vehicle_number || 'No vehicle number'}</p>
              </div>
              {partner?.is_verified && (
                <Badge className="ml-auto bg-green-100 text-green-800">Verified</Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input id="vehicleNumber" defaultValue={partner?.vehicle_number || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input id="licenseNumber" defaultValue={partner?.license_number || ''} />
            </div>
            <Button>Update Vehicle Info</Button>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set your current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select 
                value={partner?.status || 'offline'} 
                onValueChange={(value) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Your verification documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Driver's License</p>
                  <p className="text-sm text-muted-foreground">
                    {partner?.license_number ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>
                <Button variant="outline" size="sm">Upload</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Vehicle Registration</p>
                  <p className="text-sm text-muted-foreground">
                    {partner?.vehicle_number ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>
                <Button variant="outline" size="sm">Upload</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeliverySettings;
