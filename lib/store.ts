import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartVariant {
  id?: string;
  label?: string;
  size?: string;
  color?: string;
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image_url?: string;
  variant?: CartVariant;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: any, variant?: CartVariant) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

function lineIdFor(product: any, variant?: CartVariant) {
  return `${product.id}:${variant?.id ?? variant?.label ?? 'default'}`;
}

function numericStock(product: any) {
  return Math.max(0, Number(product.stock ?? 0));
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant) => {
        const stock = numericStock(product);
        if (stock < 1) return;
        const lineId = lineIdFor(product, variant);
        const price = Number(product.discount_price ?? product.price ?? 0);
        const existing = get().items.find((item) => item.lineId === lineId);

        if (existing) {
          set({
            items: get().items.map((item) => item.lineId === lineId
              ? { ...item, stock, price, quantity: Math.min(stock, item.quantity + 1) }
              : item),
          });
          return;
        }

        set({
          items: [...get().items, {
            lineId,
            productId: product.id,
            name: product.name,
            price,
            stock,
            image_url: product.image_url,
            quantity: 1,
            variant,
          }],
        });
      },

      removeItem: (lineId) => set({ items: get().items.filter((item) => item.lineId !== lineId) }),

      updateQty: (lineId, qty) => {
        const item = get().items.find((entry) => entry.lineId === lineId);
        if (!item || qty < 1) {
          set({ items: get().items.filter((entry) => entry.lineId !== lineId) });
          return;
        }
        set({ items: get().items.map((entry) => entry.lineId === lineId
          ? { ...entry, quantity: Math.min(item.stock, Math.floor(qty)) }
          : entry) });
      },

      clearCart: () => set({ items: [] }),
      totalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'emmaashop-cart',
      version: 2,
      migrate: (persisted: any) => ({
        items: Array.isArray(persisted?.items)
          ? persisted.items.map((item: any) => ({
              ...item,
              lineId: item.lineId ?? item.id,
              productId: item.productId ?? item.id,
              stock: Math.max(0, Number(item.stock ?? 999999)),
            }))
          : [],
      }),
    },
  ),
);
