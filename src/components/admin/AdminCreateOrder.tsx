import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, MapPin } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
  const [step, setStep] = useState<'customer' | 'products' | 'review'>('customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [customerNotes, setCustomerNotes] = useState('');
  const queryClient = useQueryClient();

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
  const { data: addresses = [] } = useQuery({
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
    setSelectedProducts(prev => {
      return prev
        .map(p => p.id === productId ? { ...p, quantity: p.quantity + delta } : p)
        .filter(p => p.quantity > 0);
    });
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

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
  };

  const canProceedToProducts = !!selectedCustomerId;
  const canProceedToReview = selectedProducts.length > 0 && !!selectedAddressId;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Create Order on Behalf of Customer
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {['customer', 'products', 'review'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step === s ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {i + 1}
                  </div>
                  <span className="hidden sm:inline capitalize">{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Select Customer */}
          {step === 'customer' && (
            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-2">
                {customers.map((customer: any) => (
                  <div
                    key={customer.user_id}
                    onClick={() => setSelectedCustomerId(customer.user_id)}
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

              {/* Address Selection */}
              {selectedCustomerId && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h4>
                  {addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No saved addresses for this customer.</p>
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
                          <p className="text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Products */}
          {step === 'products' && (
            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Product list */}
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

              {/* Selected items summary */}
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

          {/* Step 3: Review & Confirm */}
          {step === 'review' && (
            <div className="space-y-4 py-2">
              {/* Customer info */}
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5"><User className="w-4 h-4" /> Customer</h4>
                <p className="text-sm">{selectedCustomer?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer?.phone}</p>
              </div>

              {/* Address */}
              {selectedAddress && (
                <div className="rounded-lg border border-border p-3">
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Delivery Address</h4>
                  <p className="text-sm">{selectedAddress.address_line1}</p>
                  <p className="text-xs text-muted-foreground">{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-sm font-medium">Order Items</h4>
                {selectedProducts.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.name} × {p.quantity}</span>
                    <span className="font-medium">₹{(p.selling_price * p.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Payment method */}
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

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Delivery instructions..."
                  rows={2}
                />
              </div>

              {/* Bill */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{deliveryFee}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{totalAmount.toFixed(0)}</span></div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-row justify-between gap-2 pt-2">
          {step !== 'customer' && (
            <Button variant="outline" onClick={() => setStep(step === 'review' ? 'products' : 'customer')}>
              Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            {step === 'customer' && (
              <Button onClick={() => setStep('products')} disabled={!canProceedToProducts || !selectedAddressId}>
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
