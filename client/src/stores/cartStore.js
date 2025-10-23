import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Shopping Cart Store with Zustand
 * Manages cart items, quantities, and cart-related actions
 */
export const useCartStore = create(
  persist(
    immer((set, get) => ({
      // State
      items: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Computed values
      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce((total, item) => {
          const price = item.product.salePrice || item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },

      get subtotal() {
        return get().totalPrice;
      },

      get tax() {
        return get().totalPrice * 0.1; // 10% tax
      },

      get shipping() {
        const total = get().totalPrice;
        return total > 50 ? 0 : 5.99; // Free shipping over $50
      },

      get grandTotal() {
        return get().totalPrice + get().tax + get().shipping;
      },

      // Actions
      addItem: (product, quantity = 1) => set((state) => {
        const existingItemIndex = state.items.findIndex(
          item => item.product._id === product._id
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          state.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          state.items.push({
            id: `${product._id}-${Date.now()}`,
            product,
            quantity,
            addedAt: new Date().toISOString(),
          });
        }

        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }),

      removeItem: (itemId) => set((state) => {
        state.items = state.items.filter(item => 
          item.id !== itemId && item.product._id !== itemId
        );
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }),

      updateQuantity: (itemId, quantity) => set((state) => {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.items = state.items.filter(item => 
            item.id !== itemId && item.product._id !== itemId
          );
        } else {
          const itemIndex = state.items.findIndex(
            item => item.id === itemId || item.product._id === itemId
          );
          
          if (itemIndex >= 0) {
            state.items[itemIndex].quantity = quantity;
          }
        }

        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }),

      clearCart: () => set((state) => {
        state.items = [];
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),

      setError: (error) => set((state) => {
        state.error = error;
        state.isLoading = false;
      }),

      clearError: () => set((state) => {
        state.error = null;
      }),

      // Sync cart with server (for authenticated users)
      syncWithServer: async (authToken) => {
        if (!authToken) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Get server cart
          const response = await fetch('/api/cart', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          if (response.ok) {
            const serverCart = await response.json();
            
            set((state) => {
              // Merge local cart with server cart
              const mergedItems = [...state.items];
              
              serverCart.items?.forEach(serverItem => {
                const existingIndex = mergedItems.findIndex(
                  item => item.product._id === serverItem.product._id
                );
                
                if (existingIndex >= 0) {
                  // Use higher quantity
                  mergedItems[existingIndex].quantity = Math.max(
                    mergedItems[existingIndex].quantity,
                    serverItem.quantity
                  );
                } else {
                  mergedItems.push(serverItem);
                }
              });

              state.items = mergedItems;
              state.isLoading = false;
              state.lastUpdated = new Date().toISOString();
            });

            // Update server with merged cart
            await get().updateServerCart(authToken);
          }
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.isLoading = false;
          });
        }
      },

      updateServerCart: async (authToken) => {
        if (!authToken) return;

        try {
          const { items } = get();
          
          await fetch('/api/cart', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items }),
          });
        } catch (error) {
          console.warn('Failed to sync cart with server:', error.message);
        }
      },

      // Utility methods
      getItem: (productId) => {
        return get().items.find(item => 
          item.product._id === productId || item.id === productId
        );
      },

      hasItem: (productId) => {
        return get().items.some(item => 
          item.product._id === productId || item.id === productId
        );
      },

      getItemQuantity: (productId) => {
        const item = get().getItem(productId);
        return item ? item.quantity : 0;
      },

      isEmpty: () => {
        return get().items.length === 0;
      },

      // Validation
      validateCart: () => {
        const { items } = get();
        const errors = [];

        items.forEach((item, index) => {
          if (!item.product) {
            errors.push(`Item ${index + 1}: Missing product information`);
          }
          
          if (item.quantity <= 0) {
            errors.push(`Item ${index + 1}: Invalid quantity`);
          }
          
          if (!item.product?.price && !item.product?.salePrice) {
            errors.push(`Item ${index + 1}: Missing price information`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // Reset store
      reset: () => set((state) => {
        state.items = [];
        state.isLoading = false;
        state.error = null;
        state.lastUpdated = null;
      }),
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration logic for version 0 to 1
          return {
            ...persistedState,
            lastUpdated: new Date().toISOString(),
          };
        }
        return persistedState;
      },
    }
  )
);

// Selectors for better performance
export const useCart = () => useCartStore((state) => ({
  items: state.items,
  totalItems: state.totalItems,
  totalPrice: state.totalPrice,
  subtotal: state.subtotal,
  tax: state.tax,
  shipping: state.shipping,
  grandTotal: state.grandTotal,
  isLoading: state.isLoading,
  error: state.error,
  isEmpty: state.isEmpty(),
}));

export const useCartActions = () => useCartStore((state) => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  syncWithServer: state.syncWithServer,
  clearError: state.clearError,
}));

export const useCartUtils = () => useCartStore((state) => ({
  getItem: state.getItem,
  hasItem: state.hasItem,
  getItemQuantity: state.getItemQuantity,
  validateCart: state.validateCart,
}));