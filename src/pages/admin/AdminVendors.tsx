import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, MoreVertical, CheckCircle, XCircle, Ban } from 'lucide-react';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type VendorStatus = Database['public']['Enums']['vendor_status'];

const AdminVendors: React.FC = () => {
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    vendorId: string;
    action: 'approve' | 'reject' | 'suspend';
    vendorName: string;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: VendorStatus }) => {
      const { error } = await supabase
        .from('vendors')
        .update({ status })
        .eq('id', vendorId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: `Vendor ${status === 'active' ? 'approved' : status} successfully` });
    },
    onError: () => {
      toast({ title: 'Failed to update vendor status', variant: 'destructive' });
    },
  });

  const handleAction = (vendorId: string, action: 'approve' | 'reject' | 'suspend', vendorName: string) => {
    setConfirmDialog({ open: true, vendorId, action, vendorName });
  };

  const confirmAction = () => {
    if (!confirmDialog) return;
    const statusMap: Record<string, VendorStatus> = {
      approve: 'active',
      reject: 'inactive',
      suspend: 'suspended',
    };
    updateStatusMutation.mutate({
      vendorId: confirmDialog.vendorId,
      status: statusMap[confirmDialog.action],
    });
    setConfirmDialog(null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredVendors = vendors?.filter(vendor =>
    vendor.business_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Vendors Management"
      navItems={adminNavItems}
      roleColor="bg-red-500 text-white"
      roleName="Admin Panel"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Vendors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredVendors?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No vendors found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Accepting Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors?.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.business_name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.store_address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{vendor.total_orders || 0}</TableCell>
                      <TableCell>
                        {vendor.is_accepting_orders ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vendor.status)} variant="secondary">
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {vendor.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleAction(vendor.id, 'approve', vendor.business_name)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleAction(vendor.id, 'reject', vendor.business_name)}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'active' && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleAction(vendor.id, 'suspend', vendor.business_name)}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approve' && 'Approve Vendor'}
              {confirmDialog?.action === 'reject' && 'Reject Vendor'}
              {confirmDialog?.action === 'suspend' && 'Suspend Vendor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'approve' && 
                `Are you sure you want to approve "${confirmDialog.vendorName}"? They will be able to list products.`}
              {confirmDialog?.action === 'reject' && 
                `Are you sure you want to reject "${confirmDialog?.vendorName}"? Their application will be marked as inactive.`}
              {confirmDialog?.action === 'suspend' && 
                `Are you sure you want to suspend "${confirmDialog?.vendorName}"? They will not be able to receive new orders.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={confirmDialog?.action === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog?.action === 'approve' && 'Approve'}
              {confirmDialog?.action === 'reject' && 'Reject'}
              {confirmDialog?.action === 'suspend' && 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminVendors;
