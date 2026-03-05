import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, MapPin, UserPlus, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { MapPicker, type MapPickerResult } from '@/components/ui/map-picker';

interface SelectedProduct {
  id: string;
  name: string;
  selling_price: number;
  mrp: number;
  primary_image_url: string | null;
  unit_value: number | null;
  unit_type: string | null;
  vendor_id: string;
  quantity: number;
}

interface AdminCreateOrderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AM${timestamp}${random}`;
}

const AdminCreateOrder: React.FC<AdminCreateOrderProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'customer' | 'address' | 'products' | 'review'>('customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [customerNotes, setCustomerNotes] = useState('');
  const queryClient = useQueryClient();

  // New customer form
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // New address form
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressCoords, setNewAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newAddress, setNewAddress] = useState({
    address_type: 'home',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Fetch customers (profiles)
  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers', customerSearch],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .order('full_name')
        .limit(20);

      if (customerSearch.trim()) {
        query = query.or(`full_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch addresses for selected customer
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['admin-customer-addresses', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', selectedCustomerId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomerId,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-search', productSearch],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, selling_price, mrp, primary_image_url, unit_value, unit_type, vendor_id, stock_quantity')
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('name')
        .limit(20);

      if (productSearch.trim()) {
        query = query.ilike('name', `%${productSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && step === 'products',
  });

  const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);
  const selectedCustomer = customers.find((c: any) => c.user_id === selectedCustomerId);

  const subtotal = selectedProducts.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
  const deliveryFee = subtotal >= 199 ? 0 : 29;
  const platformFee = 5;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const addProduct = (product: any) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateProductQuantity = (productId: string, delta: number) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, quantity: p.quantity + delta } : p).filter(p => p.quantity > 0)
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!newCustomerName.trim()) throw new Error('Name is required');
      if (!newCustomerPhone.trim()) throw new Error('Phone is required');

      const userId = crypto.randomUUID();
      const insertData: any = {
        user_id: userId,
        full_name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select('user_id, full_name, phone')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setSelectedCustomerId(data.user_id);
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });

  // Create new address mutation
  const createAddressMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error('Select a customer first');
      if (!newAddress.address_line1.trim()) throw new Error('Address line 1 is required');
      if (!newAddress.city.trim()) throw new Error('City is required');
      if (!newAddress.state.trim()) throw new Error('State is required');
      if (!newAddress.pincode.trim()) throw new Error('Pincode is required');

      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: selectedCustomerId,
          address_type: newAddress.address_type,
          address_line1: newAddress.address_line1.trim(),
          address_line2: newAddress.address_line2.trim() || null,
          landmark: newAddress.landmark.trim() || null,
          city: newAddress.city.trim(),
          state: newAddress.state.trim(),
          pincode: newAddress.pincode.trim(),
          latitude: newAddressCoords?.lat ?? null,
          longitude: newAddressCoords?.lng ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer-addresses', selectedCustomerId] });
      setSelectedAddressId(data.id);
      setShowNewAddressForm(false);
      setNewAddressCoords(null);
      setNewAddress({ address_type: 'home', address_line1: '', address_line2: '', landmark: '', city: '', state: '', pincode: '' });
      toast.success('Address added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error('No customer selected');
      if (selectedProducts.length === 0) throw new Error('No products selected');
      if (!selectedAddress) throw new Error('No address selected');

      const vendorId = selectedProducts[0].vendor_id;
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: selectedCustomerId,
          vendor_id: vendorId,
          delivery_address: {
            address_type: selectedAddress.address_type,
            address_line1: selectedAddress.address_line1,
            address_line2: selectedAddress.address_line2,
            landmark: selectedAddress.landmark,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
          },
          delivery_latitude: selectedAddress.latitude,
          delivery_longitude: selectedAddress.longitude,
          subtotal,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
          total_amount: totalAmount,
          payment_method: paymentMethod as any,
          payment_status: 'pending',
          customer_notes: customerNotes || null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = selectedProducts.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_snapshot: {
          id: item.id,
          name: item.name,
          image_url: item.primary_image_url,
          unit_value: item.unit_value,
          unit_type: item.unit_type,
          selling_price: item.selling_price,
          mrp: item.mrp,
        },
        quantity: item.quantity,
        unit_price: item.selling_price,
        mrp: item.mrp,
        discount_amount: (item.mrp - item.selling_price) * item.quantity,
        total_price: item.selling_price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order created successfully!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create order');
      console.error('Create order error:', error);
    },
  });

  const resetForm = () => {
    setStep('customer');
    setSelectedCustomerId('');
    setCustomerSearch('');
    setProductSearch('');
    setSelectedProducts([]);
    setSelectedAddressId('');
    setPaymentMethod('cash');
    setCustomerNotes('');
    setShowNewCustomerForm(false);
    setShowNewAddressForm(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewAddressCoords(null);
    setNewAddress({ address_type: 'home', address_line1: '', address_line2: '', landmark: '', city: '', state: '', pincode: '' });
  };

  const stepLabels = ['customer', 'address', 'products', 'review'] as const;

  const getNextStep = () => {
    if (step === 'customer') return 'address';
    if (step === 'address') return 'products';
    if (step === 'products') return 'review';
    return 'review';
  };

  const getPrevStep = () => {
    if (step === 'address') return 'customer';
    if (step === 'products') return 'address';
    if (step === 'review') return 'products';
    return 'customer';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Create Order on Behalf of Customer
          </DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {stepLabels.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step === s ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {i + 1}
                  </div>
                  <span className="hidden sm:inline capitalize">{s}</span>
                </div>
                {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {/* Step 1: Select Customer */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>

              {/* New Customer Form */}
              {showNewCustomerForm && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Create New Customer
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        placeholder="Customer name"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone *</Label>
                      <Input
                        placeholder="Phone number"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCustomerForm(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => createCustomerMutation.mutate()} disabled={createCustomerMutation.isPending}>
                      {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Customer list */}
              <div className="space-y-2">
                {customers.map((customer: any) => (
                  <div
                    key={customer.user_id}
                    onClick={() => { setSelectedCustomerId(customer.user_id); setSelectedAddressId(''); }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedCustomerId === customer.user_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
                    </div>
                    {selectedCustomerId === customer.user_id && (
                      <Badge variant="default" className="shrink-0">Selected</Badge>
                    )}
                  </div>
                ))}
                {customers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">No customers found</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Address for the chosen customer */}
          {step === 'address' && (
            <div className="space-y-4">
              {/* Selected customer info */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedCustomer?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer?.phone || 'No phone'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('customer')}>Change</Button>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h4>
                <Button variant="outline" size="sm" onClick={() => setShowNewAddressForm(!showNewAddressForm)}>
                  <PlusCircle className="w-4 h-4 mr-1" /> Add Address
                </Button>
              </div>

              {/* New Address Form */}
              {showNewAddressForm && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <h4 className="text-sm font-medium">New Address</h4>
                  <MapPicker
                    onLocationSelect={(result) => {
                      setNewAddressCoords({ lat: result.latitude, lng: result.longitude });
                      if (result.address_line1) setNewAddress(prev => ({ ...prev, address_line1: result.address_line1! }));
                      if (result.address_line2) setNewAddress(prev => ({ ...prev, address_line2: result.address_line2! }));
                      if (result.city) setNewAddress(prev => ({ ...prev, city: result.city! }));
                      if (result.state) setNewAddress(prev => ({ ...prev, state: result.state! }));
                      if (result.pincode) setNewAddress(prev => ({ ...prev, pincode: result.pincode! }));
                    }}
                    height="180px"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {['home', 'work', 'other'].map(t => (
                      <Button
                        key={t}
                        type="button"
                        variant={newAddress.address_type === t ? 'default' : 'outline'}
                        size="sm"
                        className="capitalize"
                        onClick={() => setNewAddress(prev => ({ ...prev, address_type: t }))}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address Line 1 *</Label>
                    <Input value={newAddress.address_line1} onChange={(e) => setNewAddress(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="House/Flat/Building" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address Line 2</Label>
                    <Input value={newAddress.address_line2} onChange={(e) => setNewAddress(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Street/Area" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Landmark</Label>
                    <Input value={newAddress.landmark} onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))} placeholder="Nearby landmark" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">City *</Label>
                      <Input value={newAddress.city} onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))} placeholder="City" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">State *</Label>
                      <Input value={newAddress.state} onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))} placeholder="State" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pincode *</Label>
                      <Input value={newAddress.pincode} onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))} placeholder="Pincode" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => createAddressMutation.mutate()} disabled={createAddressMutation.isPending}>
                      {createAddressMutation.isPending ? 'Adding...' : 'Add Address'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Address list for this customer */}
              {addressesLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading addresses...</p>
              ) : addresses.length === 0 && !showNewAddressForm ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved addresses for this customer. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3 rounded-lg cursor-pointer border text-sm transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Badge variant="outline" className="mb-1 capitalize text-xs">{addr.address_type}</Badge>
                      <p className="font-medium">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-muted-foreground">{addr.address_line2}</p>}
                      {addr.landmark && <p className="text-muted-foreground">Near: {addr.landmark}</p>}
                      <p className="text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Products */}
          {step === 'products' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2">
                {products.map((product: any) => {
                  const inCart = selectedProducts.find(p => p.id === product.id);
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <img
                        src={product.primary_image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-sm">
                          <span className="font-semibold">₹{product.selling_price}</span>
                          {product.mrp > product.selling_price && (
                            <span className="text-muted-foreground line-through ml-1 text-xs">₹{product.mrp}</span>
                          )}
                        </p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateProductQuantity(product.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-5 text-center">{inCart.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateProductQuantity(product.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => addProduct(product)}>
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Separator />
                  <h4 className="text-sm font-medium">Selected Items ({selectedProducts.length})</h4>
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate flex-1">{p.name} × {p.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">₹{(p.selling_price * p.quantity).toFixed(0)}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeProduct(p.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5"><User className="w-4 h-4" /> Customer</h4>
                <p className="text-sm">{selectedCustomer?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer?.phone}</p>
              </div>

              {selectedAddress && (
                <div className="rounded-lg border border-border p-3">
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Delivery Address</h4>
                  <p className="text-sm">{selectedAddress.address_line1}</p>
                  {selectedAddress.address_line2 && <p className="text-xs text-muted-foreground">{selectedAddress.address_line2}</p>}
                  <p className="text-xs text-muted-foreground">{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                </div>
              )}

              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-sm font-medium">Order Items</h4>
                {selectedProducts.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.name} × {p.quantity}</span>
                    <span className="font-medium">₹{(p.selling_price * p.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Delivery instructions..."
                  rows={2}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{deliveryFee}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{totalAmount.toFixed(0)}</span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 shrink-0 flex-row justify-between gap-2">
          {step !== 'customer' && (
            <Button variant="outline" onClick={() => setStep(getPrevStep() as any)}>
              Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            {step === 'customer' && (
              <Button onClick={() => setStep('address')} disabled={!selectedCustomerId}>
                Next: Select Address
              </Button>
            )}
            {step === 'address' && (
              <Button onClick={() => setStep('products')} disabled={!selectedAddressId}>
                Next: Select Products
              </Button>
            )}
            {step === 'products' && (
              <Button onClick={() => setStep('review')} disabled={selectedProducts.length === 0}>
                Next: Review Order
              </Button>
            )}
            {step === 'review' && (
              <Button
                onClick={() => createOrderMutation.mutate()}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateOrder;
