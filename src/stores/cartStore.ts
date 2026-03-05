import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  id: string; // This is the product_id in the local store usage
  product_id: string;
  name: string;
  image_url: string;
  unit_value: number;
  unit_type: string;
  selling_price: number;
  mrp: number;
  quantity: number;
  max_quantity: number;
  vendor_id: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  incrementQuantity: (productId: string) => Promise<void>;
  decrementQuantity: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>; // New action to sync from DB
  getItemQuantity: (productId: string) => number;
  getTotalAmount: () => number;
  getTotalItems: () => number;
  getDeliveryFee: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      fetchCart: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity, product_id, products(*)')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart:', error);
          return;
        }

        if (data) {
          const mappedItems: CartItem[] = data.map((item: any) => ({
            id: item.products.id,
            product_id: item.products.id,
            name: item.products.name,
            image_url: item.products.primary_image_url || '/placeholder.svg',
            unit_value: item.products.unit_value || 1,
            unit_type: item.products.unit_type || 'piece',
            selling_price: item.products.selling_price,
            mrp: item.products.mrp,
            quantity: item.quantity,
            max_quantity: item.products.max_order_quantity || 10,
            vendor_id: item.products.vendor_id,
          }));
          set({ items: mappedItems });
        }
      },

      addItem: async (item) => {
        // Optimistic UI Update
        set((state) => {
          const existingItem = state.items.find((i) => i.product_id === item.product_id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.max_quantity) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });

        // DB Update
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentItem = get().items.find(i => i.product_id === item.product_id);
          if (currentItem) {
            const { error } = await supabase.from('cart_items').upsert(
              {
                user_id: user.id,
                product_id: item.product_id,
                quantity: currentItem.quantity
              },
              { onConflict: 'user_id,product_id' }
            );
            if (error) console.error('Error syncing add item:', error);
          }
        }
      },

      removeItem: async (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
          if (error) console.error('Error syncing remove item:', error);
        }
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: Math.min(quantity, item.max_quantity) }
              : item
          ),
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);
          if (error) console.error('Error syncing update quantity:', error);
        }
      },

      incrementQuantity: async (productId) => {
        const item = get().items.find((i) => i.product_id === productId);
        if (item && item.quantity < item.max_quantity) {
          await get().updateQuantity(productId, item.quantity + 1);
        }
      },

      decrementQuantity: async (productId) => {
        const item = get().items.find((i) => i.product_id === productId);
        if (item) {
           await get().updateQuantity(productId, item.quantity - 1);
        }
      },

      clearCart: async () => {
        set({ items: [] });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
          if (error) console.error('Error clearing cart:', error);
        }
      },

      getItemQuantity: (productId) => {
        return get().items.find((i) => i.product_id === productId)?.quantity || 0;
      },

      getTotalAmount: () => {
        return get().items.reduce(
          (total, item) => total + item.selling_price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getDeliveryFee: () => {
        const total = get().getTotalAmount();
        return total >= 199 ? 0 : 29;
      },
    }),
    {
      name: 'ahmed-mart-cart',
    }
  )
);
