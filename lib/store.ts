import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find(i => i.id === product.id);
        if (existing) {
          set({
            items: get().items.map(i =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          // ✅ On ne stocke que le nécessaire
          set({
            items: [...get().items, {
              id:        product.id,
              name:      product.name,
              price:     product.price,
              image_url: product.image_url,
              quantity:  1,
            }],
          });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter(i => i.id !== id) }),

      updateQty: (id, qty) => {
        if (qty < 1) {
          set({ items: get().items.filter(i => i.id !== id) });
          return;
        }
        set({ items: get().items.map(i => i.id === id ? { ...i, quantity: qty } : i) });
      },

      clearCart: () => set({ items: [] }),

      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: 'mme-kane-cart', // ← sauvegardé dans localStorage
    }
  )
);