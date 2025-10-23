/**
 * Zustand Stores Index
 * Central export for all application stores
 */

// Auth store
export {
  useAuthStore,
  useAuth,
  useAuthActions,
  useAuthToken,
} from './authStore.js';

// Cart store
export {
  useCartStore,
  useCart,
  useCartActions,
  useCartUtils,
} from './cartStore.js';

// UI store
export {
  useUIStore,
  useTheme,
  useModals,
  useNotifications,
  useSearch,
  useLoading,
  useResponsive,
} from './uiStore.js';

// Store reset utility (useful for testing and logout)
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  useCartStore.getState().reset();
  useUIStore.getState().reset();
};

// Store initialization utility
export const initializeStores = () => {
  // Initialize theme
  const theme = useUIStore.getState().theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Set up responsive listener
  const updateScreenSize = () => {
    const width = window.innerWidth;
    let size = 'desktop';
    
    if (width < 768) {
      size = 'mobile';
    } else if (width < 1024) {
      size = 'tablet';
    }
    
    useUIStore.getState().setScreenSize(size);
  };
  
  // Initial screen size
  updateScreenSize();
  
  // Listen for resize events
  window.addEventListener('resize', updateScreenSize);
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', updateScreenSize);
  };
};

// Store persistence utilities
export const clearPersistedStores = () => {
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('cart-storage');
  localStorage.removeItem('ui-storage');
};

export const getPersistedStoreData = () => {
  return {
    auth: JSON.parse(localStorage.getItem('auth-storage') || '{}'),
    cart: JSON.parse(localStorage.getItem('cart-storage') || '{}'),
    ui: JSON.parse(localStorage.getItem('ui-storage') || '{}'),
  };
};