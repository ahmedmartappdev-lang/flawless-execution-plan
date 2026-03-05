import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Minus, Plus } from 'lucide-react';
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;

      // Find removed items
      const originalIds = (order.order_items || []).map((i: any) => i.id);
      const currentIds = items.map(i => i.id);
      const removedIds = originalIds.filter((id: string) => !currentIds.includes(id));

      // Delete removed items
      if (removedIds.length > 0) {
        const { error } = await supabase.from('order_items').delete().in('id', removedIds);
        if (error) throw error;
      }

      // Update remaining items
      for (const item of items) {
        const { error } = await supabase
          .from('order_items')
          .update({ quantity: item.quantity, total_price: item.unit_price * item.quantity })
          .eq('id', item.id);
        if (error) throw error;
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
            <h4 className="font-medium mb-3">Order Items</h4>
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
