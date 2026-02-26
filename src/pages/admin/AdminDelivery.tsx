import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Database } from '@/integrations/supabase/types';

type DeliveryStatus = Database['public']['Enums']['delivery_status'];
type VehicleType = Database['public']['Enums']['vehicle_type'];

interface DeliveryPartnerFormData {
  email: string;
  full_name: string;
  phone: string;
  alternate_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  license_number: string;
  aadhar_number: string;
  pan_number: string;
  bank_account_number: string;
  ifsc_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  aadhar_front_url: string;
  aadhar_back_url: string;
  license_front_url: string;
  license_back_url: string;
  profile_image_url: string;
}

const initialFormData: DeliveryPartnerFormData = {
  email: '',
  full_name: '',
  phone: '',
  alternate_phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  vehicle_type: 'bike',
  vehicle_number: '',
  license_number: '',
  aadhar_number: '',
  pan_number: '',
  bank_account_number: '',
  ifsc_code: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  aadhar_front_url: '',
  aadhar_back_url: '',
  license_front_url: '',
  license_back_url: '',
  profile_image_url: '',
};

const AdminDelivery: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [formData, setFormData] = useState<DeliveryPartnerFormData>(initialFormData);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: DeliveryPartnerFormData) => {
      // Using any to bypass type restrictions for new columns added in migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('delivery_partners') as any).insert({
        email: data.email.toLowerCase().trim(),
        full_name: data.full_name,
        phone: data.phone || null,
        alternate_phone: data.alternate_phone || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        vehicle_type: data.vehicle_type,
        vehicle_number: data.vehicle_number || null,
        license_number: data.license_number || null,
        aadhar_number: data.aadhar_number || null,
        pan_number: data.pan_number || null,
        bank_account_number: data.bank_account_number || null,
        ifsc_code: data.ifsc_code || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        aadhar_front_url: data.aadhar_front_url || null,
        aadhar_back_url: data.aadhar_back_url || null,
        license_front_url: data.license_front_url || null,
        license_back_url: data.license_back_url || null,
        profile_image_url: data.profile_image_url || null,
        status: 'offline',
        is_verified: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      toast({ title: 'Delivery partner added successfully' });
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add delivery partner',
        description: error.message.includes('duplicate')
          ? 'A partner with this email already exists'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  const verifyPartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_verified: true, document_verified_at: new Date().toISOString() })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      toast({ title: 'Partner verified successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to verify partner', variant: 'destructive' });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-800',
      on_break: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getVehicleIcon = (type: string) => {
    const icons: Record<string, string> = {
      bicycle: '🚲',
      bike: '🏍️',
      scooter: '🛵',
      car: '🚗',
    };
    return icons[type] || '🚗';
  };

  const filteredPartners = partners?.filter(
    (partner) =>
      partner.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      partner.email?.toLowerCase().includes(search.toLowerCase()) ||
      partner.phone?.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name) {
      toast({ title: 'Email and full name are required', variant: 'destructive' });
      return;
    }
    createPartnerMutation.mutate(formData);
  };

  return (
    <DashboardLayout
      title="Delivery Partners"
      navItems={adminNavItems}
      roleColor="bg-red-500 text-white"
      roleName="Admin Panel"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Delivery Partners</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Delivery Partner</DialogTitle>
                    <DialogDescription>
                      Pre-register a delivery partner by email. They can sign up using this email.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="partner@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="John Doe"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternate_phone">Alternate Phone</Label>
                        <Input
                          id="alternate_phone"
                          placeholder="+91 9876543210"
                          value={formData.alternate_phone}
                          onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
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

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_type">Vehicle Type</Label>
                        <Select
                          value={formData.vehicle_type}
                          onValueChange={(value: VehicleType) => setFormData({ ...formData, vehicle_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bicycle">🚲 Bicycle</SelectItem>
                            <SelectItem value="bike">🏍️ Bike</SelectItem>
                            <SelectItem value="scooter">🛵 Scooter</SelectItem>
                            <SelectItem value="car">🚗 Car</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_number">Vehicle Number</Label>
                        <Input
                          id="vehicle_number"
                          placeholder="MH01AB1234"
                          value={formData.vehicle_number}
                          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          placeholder="DL1234567890"
                          value={formData.license_number}
                          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aadhar_number">Aadhar Number</Label>
                        <Input
                          id="aadhar_number"
                          placeholder="123456789012"
                          value={formData.aadhar_number}
                          onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                        <Input
                          id="emergency_contact_name"
                          placeholder="Contact person name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          placeholder="+91 9876543210"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Profile Photo */}
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <ImageUpload
                        value={formData.profile_image_url}
                        onChange={(url) => setFormData({ ...formData, profile_image_url: url })}
                        bucket="delivery-documents"
                        folder="profile"
                      />
                    </div>

                    {/* ID Proof Documents */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Proof of Identification</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Aadhaar Card (Front)</Label>
                          <ImageUpload
                            value={formData.aadhar_front_url}
                            onChange={(url) => setFormData({ ...formData, aadhar_front_url: url })}
                            bucket="delivery-documents"
                            folder="aadhaar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Aadhaar Card (Back)</Label>
                          <ImageUpload
                            value={formData.aadhar_back_url}
                            onChange={(url) => setFormData({ ...formData, aadhar_back_url: url })}
                            bucket="delivery-documents"
                            folder="aadhaar"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Driving License (Front)</Label>
                          <ImageUpload
                            value={formData.license_front_url}
                            onChange={(url) => setFormData({ ...formData, license_front_url: url })}
                            bucket="delivery-documents"
                            folder="license"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Driving License (Back)</Label>
                          <ImageUpload
                            value={formData.license_back_url}
                            onChange={(url) => setFormData({ ...formData, license_back_url: url })}
                            bucket="delivery-documents"
                            folder="license"
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPartnerMutation.isPending}>
                        {createPartnerMutation.isPending ? 'Adding...' : 'Add Partner'}
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
          ) : filteredPartners?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No delivery partners found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Linked</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners?.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{partner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{partner.phone || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getVehicleIcon(partner.vehicle_type)}</span>
                          <div>
                            <p className="font-medium capitalize">{partner.vehicle_type}</p>
                            <p className="text-xs text-muted-foreground">{partner.vehicle_number || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{partner.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{partner.total_deliveries || 0}</TableCell>
                      <TableCell>
                        {partner.is_verified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {partner.user_id ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            Pending Signup
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(partner.status)} variant="secondary">
                          {partner.status.replace(/_/g, ' ')}
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
                            <DropdownMenuItem onClick={() => setSelectedPartner(partner)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!partner.is_verified && (
                              <DropdownMenuItem onClick={() => verifyPartnerMutation.mutate(partner.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify
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
      {/* Partner Details Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Partner Details</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedPartner.profile_image_url && (
                  <img src={selectedPartner.profile_image_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedPartner.full_name || 'N/A'}</h3>
                  <Badge className={getStatusColor(selectedPartner.status)} variant="secondary">
                    {selectedPartner.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted/50 rounded-lg p-4 text-sm">
                <div><span className="text-muted-foreground">Phone:</span> {selectedPartner.phone || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedPartner.email || '-'}</div>
                <div><span className="text-muted-foreground">Vehicle:</span> {selectedPartner.vehicle_type} - {selectedPartner.vehicle_number || '-'}</div>
                <div><span className="text-muted-foreground">Rating:</span> ★ {selectedPartner.rating?.toFixed(1) || '0.0'}</div>
                <div><span className="text-muted-foreground">Deliveries:</span> {selectedPartner.total_deliveries || 0}</div>
                <div><span className="text-muted-foreground">Credit Balance:</span> ₹{Number(selectedPartner.credit_balance || 0).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Verified:</span> {selectedPartner.is_verified ? '✅ Yes' : '❌ No'}</div>
                <div><span className="text-muted-foreground">DOB:</span> {selectedPartner.date_of_birth || '-'}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium mb-2">Address</p>
                <p>{selectedPartner.address_line1 || '-'}</p>
                {selectedPartner.address_line2 && <p>{selectedPartner.address_line2}</p>}
                <p>{selectedPartner.city && `${selectedPartner.city}, `}{selectedPartner.state && `${selectedPartner.state} `}{selectedPartner.pincode && `- ${selectedPartner.pincode}`}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">License:</span> {selectedPartner.license_number || '-'}</div>
                <div><span className="text-muted-foreground">Aadhar:</span> {selectedPartner.aadhar_number || '-'}</div>
                <div><span className="text-muted-foreground">PAN:</span> {selectedPartner.pan_number || '-'}</div>
                <div><span className="text-muted-foreground">Emergency:</span> {selectedPartner.emergency_contact_name || '-'} ({selectedPartner.emergency_contact_phone || '-'})</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDelivery;
