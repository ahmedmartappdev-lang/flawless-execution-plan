import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
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
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalAmount: () => number;
  getTotalItems: () => number;
  getDeliveryFee: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.product_id === item.product_id
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.max_quantity) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: Math.min(quantity, item.max_quantity) }
              : item
          ),
        }));
      },

      incrementQuantity: (productId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId && item.quantity < item.max_quantity
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }));
      },

      decrementQuantity: (productId) => {
        const item = get().items.find((i) => i.product_id === productId);
        if (item && item.quantity <= 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: i.quantity - 1 }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

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
