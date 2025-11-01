import { vi } from 'vitest';

export const useCart = vi.fn(() => ({
  cart: { items: [], totalAmount: 0, itemCount: 0 },
  addToCart: vi.fn().mockResolvedValue({}),
  removeFromCart: vi.fn().mockResolvedValue({}),
  updateQuantity: vi.fn().mockResolvedValue({}),
  clearCart: vi.fn().mockResolvedValue({}),
  isLoading: false
}));

export const CartProvider = ({ children }) => children;