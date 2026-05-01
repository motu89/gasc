import { create } from 'zustand';
import { CartItem, User } from '@/types';
import { buildCartItemId } from '@/lib/checkout';

interface AppState {
  hydrated: boolean;
  user: User | null;
  cart: CartItem[];
  initializeAppState: () => void;
  setUser: (user: User | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}

function getInitialUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('app_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
}

function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('app_cart');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
}

export const useStore = create<AppState>((set) => ({
  hydrated: false,
  user: null,
  cart: [],
  initializeAppState: () => {
    if (typeof window === 'undefined') return;

    set({
      hydrated: true,
      user: getInitialUser(),
      cart: getInitialCart(),
    });
  },
  setUser: (user) => {
    set({ user });

    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('app_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('app_current_user');
      }
    }
  },
  addToCart: (item) =>
    set((state) => {
      const normalizedItem = {
        ...item,
        cartItemId:
          item.cartItemId ||
          buildCartItemId({
            productId: item.productId,
            purchaseOption: item.purchaseOption,
            startDate: item.startDate,
            endDate: item.endDate,
          }),
      };
      const existingItem = state.cart.find(
        (cartItem) => cartItem.cartItemId === normalizedItem.cartItemId
      );
      const newCart = existingItem
        ? state.cart.map((cartItem) =>
            cartItem.cartItemId === normalizedItem.cartItemId
              ? { ...cartItem, quantity: cartItem.quantity + normalizedItem.quantity }
              : cartItem
          )
        : [...state.cart, normalizedItem];

      if (typeof window !== 'undefined') {
        localStorage.setItem('app_cart', JSON.stringify(newCart));
      }

      return { cart: newCart };
    }),
  removeFromCart: (cartItemId) =>
    set((state) => {
      const newCart = state.cart.filter((item) => item.cartItemId !== cartItemId);

      if (typeof window !== 'undefined') {
        localStorage.setItem('app_cart', JSON.stringify(newCart));
      }

      return { cart: newCart };
    }),
  updateCartItem: (cartItemId, updates) =>
    set((state) => {
      const newCart = state.cart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, ...updates } : item
      );

      if (typeof window !== 'undefined') {
        localStorage.setItem('app_cart', JSON.stringify(newCart));
      }

      return { cart: newCart };
    }),
  clearCart: () => {
    set({ cart: [] });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_cart');
    }
  },
}));
