import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, MoreVertical, CheckCircle, XCircle, Ban } from 'lucide-react';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type VendorStatus = Database['public']['Enums']['vendor_status'];

interface VendorFormData {
  email: string;
  business_name: string;
  owner_name: string;
  phone: string;
  alternate_phone: string;
  store_address: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
  pan_number: string;
  owner_aadhar_number: string;
  fssai_number: string;
  business_license: string;
  bank_account_number: string;
  ifsc_code: string;
}

const initialFormData: VendorFormData = {
  email: '',
  business_name: '',
  owner_name: '',
  phone: '',
  alternate_phone: '',
  store_address: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  gst_number: '',
  pan_number: '',
  owner_aadhar_number: '',
  fssai_number: '',
  business_license: '',
  bank_account_number: '',
  ifsc_code: '',
};

const AdminVendors: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>(initialFormData);
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
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      // Using any to bypass type restrictions for new columns added in migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('vendors') as any).insert({
        email: data.email.toLowerCase().trim(),
        business_name: data.business_name,
        owner_name: data.owner_name || null,
        phone: data.phone || null,
        alternate_phone: data.alternate_phone || null,
        store_address: data.store_address || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        gst_number: data.gst_number || null,
        pan_number: data.pan_number || null,
        owner_aadhar_number: data.owner_aadhar_number || null,
        fssai_number: data.fssai_number || null,
        business_license: data.business_license || null,
        bank_account_number: data.bank_account_number || null,
        ifsc_code: data.ifsc_code || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: 'Vendor added successfully' });
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add vendor',
        description: error.message.includes('duplicate')
          ? 'A vendor with this email already exists'
          : error.message,
        variant: 'destructive',
      });
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

  const filteredVendors = vendors?.filter(
    (vendor) =>
      vendor.business_name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(search.toLowerCase()) ||
      vendor.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.business_name) {
      toast({ title: 'Email and business name are required', variant: 'destructive' });
      return;
    }
    createVendorMutation.mutate(formData);
  };

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Vendor</DialogTitle>
                    <DialogDescription>
                      Pre-register a vendor by email. They can sign up using this email.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="vendor@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name *</Label>
                        <Input
                          id="business_name"
                          placeholder="Store Name"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="owner_name">Owner Name</Label>
                        <Input
                          id="owner_name"
                          placeholder="John Doe"
                          value={formData.owner_name}
                          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Store Address</Label>
                      <Input
                        placeholder="Store address"
                        value={formData.store_address}
                        onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                        className="mb-2"
                      />
                      <Input
                        placeholder="Address Line 1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                        className="mb-2"
                      />
                      <Input
                        placeholder="Address Line 2"
                        value={formData.address_line2}
                        onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="Mumbai"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="Maharashtra"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="400001"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gst_number">GST Number</Label>
                        <Input
                          id="gst_number"
                          placeholder="22AAAAA0000A1Z5"
                          value={formData.gst_number}
                          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan_number">PAN Number</Label>
                        <Input
                          id="pan_number"
                          placeholder="ABCDE1234F"
                          value={formData.pan_number}
                          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="owner_aadhar_number">Owner Aadhar Number</Label>
                        <Input
                          id="owner_aadhar_number"
                          placeholder="123456789012"
                          value={formData.owner_aadhar_number}
                          onChange={(e) => setFormData({ ...formData, owner_aadhar_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fssai_number">FSSAI Number</Label>
                        <Input
                          id="fssai_number"
                          placeholder="12345678901234"
                          value={formData.fssai_number}
                          onChange={(e) => setFormData({ ...formData, fssai_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_license">Business License</Label>
                      <Input
                        id="business_license"
                        placeholder="License number"
                        value={formData.business_license}
                        onChange={(e) => setFormData({ ...formData, business_license: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Bank Account Number</Label>
                        <Input
                          id="bank_account_number"
                          placeholder="Account number"
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc_code">IFSC Code</Label>
                        <Input
                          id="ifsc_code"
                          placeholder="SBIN0001234"
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createVendorMutation.isPending}>
                        {createVendorMutation.isPending ? 'Adding...' : 'Add Vendor'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Linked</TableHead>
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
                          <p className="text-xs text-muted-foreground">{vendor.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{vendor.owner_name || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{vendor.phone || '-'}</p>
                          <p className="text-xs text-muted-foreground">{vendor.store_address?.slice(0, 30)}</p>
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
                        {vendor.user_id ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            Pending Signup
                          </Badge>
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
