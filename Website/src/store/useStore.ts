import { create } from 'zustand';
import { CartItem, Product, User, Order } from '../types';

interface Store {
  cart: CartItem[];
  orders: Order[];
  user: User | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setUser: (user: User | null) => void;
  placeOrder: () => void;
}

export const useStore = create<Store>((set) => ({
  cart: [],
  orders: [],
  user: null,
  addToCart: (product) =>
    set((state) => {
      const existingItem = state.cart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1, status: 'pending' }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: quantity === 0
        ? state.cart.filter((item) => item.product.id !== productId)
        : state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
    })),
  setUser: (user) => set({ user }),
  placeOrder: () =>
    set((state) => {
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        items: state.cart.map(item => ({ ...item, status: 'processing' })),
        total: state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        orders: [...state.orders, newOrder],
        cart: [] // Clear the cart after order is placed
      };
    }),
}));