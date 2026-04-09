import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Minus, Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount_amount: number;
  total_price: number;
  product_snapshot: { name: string; image_url?: string };
}

interface AdminEditOrderProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminEditOrder: React.FC<AdminEditOrderProps> = ({ order, open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Search products for adding to order
  const { data: searchResults } = useQuery({
    queryKey: ['admin-product-search', productSearch, order?.vendor_id],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2 || !order?.vendor_id) return [];
      const { data } = await supabase
        .from('products')
        .select('id, name, selling_price, mrp, primary_image_url')
        .eq('vendor_id', order.vendor_id)
        .ilike('name', `%${productSearch}%`)
        .eq('status', 'active')
        .limit(5);
      return data || [];
    },
    enabled: !!productSearch && productSearch.length >= 2 && !!order?.vendor_id,
  });

  useEffect(() => {
    if (order) {
      setItems((order.order_items || []).map((item: any) => ({ ...item })));
      setCustomerNotes(order.customer_notes || '');
    }
  }, [order]);

  const subtotal = items.reduce((s, item) => s + item.unit_price * item.quantity, 0);
  const totalAmount = subtotal + Number(order?.delivery_fee || 0) + Number(order?.platform_fee || 0) - Number(order?.discount_amount || 0);

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty, total_price: item.unit_price * newQty };
    }));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast({ title: 'Cannot remove the last item', variant: 'destructive' });
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addProductToOrder = (product: any) => {
    const newItem: OrderItem = {
      id: `new-${Date.now()}`,
      quantity: 1,
      unit_price: product.selling_price,
      mrp: product.mrp,
      discount_amount: 0,
      total_price: product.selling_price,
      product_snapshot: { name: product.name, image_url: product.primary_image_url },
    };
    setItems(prev => [...prev, newItem]);
    setShowProductSearch(false);
    setProductSearch('');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;

      const oldTotalAmount = Number(order.total_amount);

      // Find removed items
      const originalIds = (order.order_items || []).map((i: any) => i.id);
      const currentIds = items.map(i => i.id);
      const removedIds = originalIds.filter((id: string) => !currentIds.includes(id));

      // Delete removed items
      if (removedIds.length > 0) {
        const { error } = await supabase.from('order_items').delete().in('id', removedIds);
        if (error) throw error;
      }

      // Update existing items and insert new ones
      for (const item of items) {
        if (item.id.startsWith('new-')) {
          const { error } = await supabase.from('order_items').insert({
            order_id: order.id,
            product_snapshot: item.product_snapshot,
            quantity: item.quantity,
            unit_price: item.unit_price,
            mrp: item.mrp,
            discount_amount: 0,
            total_price: item.unit_price * item.quantity,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('order_items')
            .update({ quantity: item.quantity, total_price: item.unit_price * item.quantity })
            .eq('id', item.id);
          if (error) throw error;
        }
      }

      // Update order totals and notes
      const { error } = await supabase
        .from('orders')
        .update({
          subtotal,
          total_amount: totalAmount,
          customer_notes: customerNotes || null,
        })
        .eq('id', order.id);
      if (error) throw error;

      // Credit balance adjustment if order used credits and total changed
      const creditUsed = Number(order.credit_used || 0);
      if (creditUsed > 0 && totalAmount !== oldTotalAmount) {
        const diff = totalAmount - oldTotalAmount; // positive = more expensive, negative = cheaper
        
        if (diff !== 0) {
          // Adjust customer credit_balance (due amount)
          // If order got cheaper: reduce due (credit back), if more expensive: increase due
          const { data: profile } = await supabase
            .from('profiles')
            .select('credit_balance')
            .eq('user_id', order.customer_id)
            .single();

          if (profile) {
            const currentDue = Number(profile.credit_balance || 0);
            const newDue = Math.max(0, currentDue + diff);

            await supabase
              .from('profiles')
              .update({ credit_balance: newDue })
              .eq('user_id', order.customer_id);

            // Log credit transaction
            await (supabase.from('customer_credit_transactions') as any).insert({
              customer_id: order.customer_id,
              amount: Math.abs(diff),
              balance_after: newDue,
              transaction_type: diff < 0 ? 'credit' : 'debit',
              description: diff < 0
                ? `Order #${order.order_number} edited - ₹${Math.abs(diff)} credited back`
                : `Order #${order.order_number} edited - ₹${diff} additional charge`,
              order_id: order.id,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer-credits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-credit-balance'] });
      toast({ title: 'Order updated successfully' });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update order', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order - {order?.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Order Items</h4>
              <Button variant="outline" size="sm" onClick={() => setShowProductSearch(!showProductSearch)}>
                <Plus className="w-3 h-3 mr-1" /> Add Product
              </Button>
            </div>

            {showProductSearch && (
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {searchResults && searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                    {searchResults.map((p: any) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 text-left text-sm"
                        onClick={() => addProductToOrder(p)}
                      >
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {p.primary_image_url ? (
                            <img src={p.primary_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">₹{p.selling_price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product_snapshot?.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.unit_price} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Customer Notes</label>
            <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Notes..." />
          </div>

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{Number(order?.delivery_fee || 0).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>₹{totalAmount.toLocaleString()}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || items.length === 0}>
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditOrder;
