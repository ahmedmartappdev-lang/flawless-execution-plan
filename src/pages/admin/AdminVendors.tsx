import React, { useState } from 'react';
import { sanitizePhone, formatPhoneForStorage } from '@/lib/phone';
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
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
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
        phone: formatPhoneForStorage(data.phone),
        alternate_phone: formatPhoneForStorage(data.alternate_phone),
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
      active: 'text-emerald-700',
      pending: 'text-amber-700',
      inactive: 'text-slate-500',
      suspended: 'text-red-700',
    };
    return colors[status] || 'text-slate-600';
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
      <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-slate-900">All Vendors</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full rounded-md border-slate-300 sm:w-[200px]"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Vendor</DialogTitle>
                    <DialogDescription>
                      Pre-register a vendor by email. They can sign up using this email.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
                          maxLength={10}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredVendors?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No vendors found</div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredVendors?.map((vendor) => (
                  <div key={vendor.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{vendor.business_name}</p>
                        <p className="text-xs text-slate-500">{vendor.email}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-md text-slate-600 hover:bg-white hover:text-slate-900">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedVendor(vendor)}>
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
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction(vendor.id, 'suspend', vendor.business_name)}>
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Owner</span>
                        <span className="text-slate-700">{vendor.owner_name || '-'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-500">Contact</span>
                        <div className="text-right">
                          <p className="text-slate-700">{vendor.phone || '-'}</p>
                          {vendor.store_address && <p className="text-xs text-slate-500">{vendor.store_address}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Rating</span>
                        <span className="font-medium text-slate-900">â˜… {vendor.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Orders</span>
                        <span className="font-medium text-slate-900">{vendor.total_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Linked</span>
                        {vendor.user_id ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <CheckCircle className="h-4 w-4" />
                            Linked
                          </span>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Pending Signup
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Status</span>
                        <span className={`text-sm font-semibold capitalize ${getStatusColor(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Business Name</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Owner</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Contact</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Address</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Rating</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Orders</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Linked</TableHead>
                    <TableHead className="h-14 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Status</TableHead>
                    <TableHead className="h-14 px-5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors?.map((vendor) => (
                    <TableRow key={vendor.id} className="border-slate-200 hover:bg-white">
                      <TableCell className="px-5 py-5">
                        <div>
                          <p className="font-medium text-slate-900">{vendor.business_name}</p>
                          <p className="text-xs text-slate-500">{vendor.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-5 text-sm text-slate-700">{vendor.owner_name || '-'}</TableCell>
                      <TableCell className="px-5 py-5">
                        <p className="text-sm text-slate-700">{vendor.phone || vendor.alternate_phone || '-'}</p>
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        {(() => {
                          const composed = (vendor as any).store_address
                            || [(vendor as any).address_line1, (vendor as any).address_line2, (vendor as any).city, (vendor as any).pincode]
                                .filter(Boolean).join(', ');
                          if (!composed) return <span className="text-sm text-slate-400">-</span>;
                          return (
                            <p className="text-sm text-slate-700 line-clamp-2 max-w-[260px]" title={composed}>{composed}</p>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-5 text-sm font-medium text-slate-900">{vendor.total_orders || 0}</TableCell>
                      <TableCell className="px-5 py-5">
                        {vendor.user_id ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Pending Signup
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-5">
                        <span className={`text-sm font-semibold capitalize ${getStatusColor(vendor.status)}`}>
                          {vendor.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-md text-slate-600 hover:bg-white hover:text-slate-900">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedVendor(vendor)}>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Vendor Details Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedVendor.business_name}</h3>
                <Badge className={getStatusColor(selectedVendor.status)} variant="secondary">
                  {selectedVendor.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Owner:</span> {selectedVendor.owner_name || '-'}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedVendor.phone || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedVendor.email || '-'}</div>
                <div><span className="text-muted-foreground">Rating:</span> ★ {selectedVendor.rating?.toFixed(1) || '0.0'}</div>
                <div><span className="text-muted-foreground">Orders:</span> {selectedVendor.total_orders || 0}</div>
                <div><span className="text-muted-foreground">Commission:</span> {selectedVendor.commission_rate || 0}%</div>
              </div>
              {selectedVendor.store_address && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <span className="text-muted-foreground">Address:</span> {selectedVendor.store_address}
                  {selectedVendor.city && `, ${selectedVendor.city}`}
                  {selectedVendor.state && `, ${selectedVendor.state}`}
                  {selectedVendor.pincode && ` - ${selectedVendor.pincode}`}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">GST:</span> {selectedVendor.gst_number || '-'}</div>
                <div><span className="text-muted-foreground">FSSAI:</span> {selectedVendor.fssai_number || '-'}</div>
                <div><span className="text-muted-foreground">PAN:</span> {selectedVendor.pan_number || '-'}</div>
                <div><span className="text-muted-foreground">License:</span> {selectedVendor.business_license || '-'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
