import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * UI State Store with Zustand
 * Manages global UI state, modals, notifications, and user preferences
 */
export const useUIStore = create(
  persist(
    immer((set, get) => ({
      // Theme and preferences
      theme: 'light',
      sidebarCollapsed: false,
      language: 'en',
      currency: 'USD',
      
      // Loading states
      globalLoading: false,
      loadingStates: {},
      
      // Modals and dialogs
      modals: {
        login: false,
        register: false,
        cart: false,
        productQuickView: false,
        addressForm: false,
        paymentForm: false,
        confirmDialog: false,
      },
      
      // Modal data
      modalData: {
        productQuickView: null,
        confirmDialog: null,
      },
      
      // Notifications
      notifications: [],
      
      // Search and filters
      searchQuery: '',
      filters: {
        category: '',
        priceRange: [0, 1000],
        sortBy: 'name',
        sortOrder: 'asc',
        inStock: false,
      },
      
      // Page states
      currentPage: 1,
      itemsPerPage: 12,
      
      // Mobile responsiveness
      isMobile: false,
      screenSize: 'desktop',
      
      // Actions
      setTheme: (theme) => set((state) => {
        state.theme = theme;
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
      }),
      
      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),
      
      setSidebarCollapsed: (collapsed) => set((state) => {
        state.sidebarCollapsed = collapsed;
      }),
      
      setLanguage: (language) => set((state) => {
        state.language = language;
      }),
      
      setCurrency: (currency) => set((state) => {
        state.currency = currency;
      }),
      
      // Loading states
      setGlobalLoading: (loading) => set((state) => {
        state.globalLoading = loading;
      }),
      
      setLoadingState: (key, loading) => set((state) => {
        if (loading) {
          state.loadingStates[key] = true;
        } else {
          delete state.loadingStates[key];
        }
      }),
      
      isLoading: (key) => {
        return get().loadingStates[key] || false;
      },
      
      // Modal management
      openModal: (modalName, data = null) => set((state) => {
        state.modals[modalName] = true;
        if (data) {
          state.modalData[modalName] = data;
        }
      }),
      
      closeModal: (modalName) => set((state) => {
        state.modals[modalName] = false;
        state.modalData[modalName] = null;
      }),
      
      closeAllModals: () => set((state) => {
        Object.keys(state.modals).forEach(key => {
          state.modals[key] = false;
        });
        state.modalData = {};
      }),
      
      // Notification management
      addNotification: (notification) => set((state) => {
        const id = Date.now().toString();
        const newNotification = {
          id,
          type: 'info',
          duration: 5000,
          ...notification,
          timestamp: new Date().toISOString(),
        };
        
        state.notifications.push(newNotification);
        
        // Auto-remove notification after duration
        if (newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      }),
      
      removeNotification: (id) => set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),
      
      clearNotifications: () => set((state) => {
        state.notifications = [];
      }),
      
      // Notification helpers
      showSuccess: (message, options = {}) => {
        get().addNotification({
          type: 'success',
          message,
          ...options,
        });
      },
      
      showError: (message, options = {}) => {
        get().addNotification({
          type: 'error',
          message,
          duration: 8000, // Longer duration for errors
          ...options,
        });
      },
      
      showWarning: (message, options = {}) => {
        get().addNotification({
          type: 'warning',
          message,
          ...options,
        });
      },
      
      showInfo: (message, options = {}) => {
        get().addNotification({
          type: 'info',
          message,
          ...options,
        });
      },
      
      // Search and filters
      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query;
        state.currentPage = 1; // Reset to first page
      }),
      
      setFilter: (filterName, value) => set((state) => {
        state.filters[filterName] = value;
        state.currentPage = 1; // Reset to first page
      }),
      
      setFilters: (filters) => set((state) => {
        state.filters = { ...state.filters, ...filters };
        state.currentPage = 1; // Reset to first page
      }),
      
      clearFilters: () => set((state) => {
        state.filters = {
          category: '',
          priceRange: [0, 1000],
          sortBy: 'name',
          sortOrder: 'asc',
          inStock: false,
        };
        state.currentPage = 1;
      }),
      
      // Pagination
      setCurrentPage: (page) => set((state) => {
        state.currentPage = page;
      }),
      
      setItemsPerPage: (items) => set((state) => {
        state.itemsPerPage = items;
        state.currentPage = 1; // Reset to first page
      }),
      
      // Responsive design
      setScreenSize: (size) => set((state) => {
        state.screenSize = size;
        state.isMobile = size === 'mobile' || size === 'tablet';
        
        // Auto-collapse sidebar on mobile
        if (state.isMobile) {
          state.sidebarCollapsed = true;
        }
      }),
      
      // Confirmation dialog
      showConfirmDialog: (options) => {
        return new Promise((resolve) => {
          set((state) => {
            state.modals.confirmDialog = true;
            state.modalData.confirmDialog = {
              ...options,
              onConfirm: () => {
                get().closeModal('confirmDialog');
                resolve(true);
              },
              onCancel: () => {
                get().closeModal('confirmDialog');
                resolve(false);
              },
            };
          });
        });
      },
      
      // Utility methods
      getActiveFiltersCount: () => {
        const { filters } = get();
        let count = 0;
        
        if (filters.category) count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
        if (filters.inStock) count++;
        
        return count;
      },
      
      hasActiveFilters: () => {
        return get().getActiveFiltersCount() > 0;
      },
      
      // Reset store
      reset: () => set((state) => {
        state.theme = 'light';
        state.sidebarCollapsed = false;
        state.language = 'en';
        state.currency = 'USD';
        state.globalLoading = false;
        state.loadingStates = {};
        state.modals = {
          login: false,
          register: false,
          cart: false,
          productQuickView: false,
          addressForm: false,
          paymentForm: false,
          confirmDialog: false,
        };
        state.modalData = {};
        state.notifications = [];
        state.searchQuery = '';
        state.filters = {
          category: '',
          priceRange: [0, 1000],
          sortBy: 'name',
          sortOrder: 'asc',
          inStock: false,
        };
        state.currentPage = 1;
        state.itemsPerPage = 12;
      }),
    })),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
        currency: state.currency,
        itemsPerPage: state.itemsPerPage,
      }),
      version: 1,
    }
  )
);

// Selectors for better performance
export const useTheme = () => useUIStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
}));

export const useModals = () => useUIStore((state) => ({
  modals: state.modals,
  modalData: state.modalData,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
}));

export const useNotifications = () => useUIStore((state) => ({
  notifications: state.notifications,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  showSuccess: state.showSuccess,
  showError: state.showError,
  showWarning: state.showWarning,
  showInfo: state.showInfo,
}));

export const useSearch = () => useUIStore((state) => ({
  searchQuery: state.searchQuery,
  filters: state.filters,
  currentPage: state.currentPage,
  itemsPerPage: state.itemsPerPage,
  setSearchQuery: state.setSearchQuery,
  setFilter: state.setFilter,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  setCurrentPage: state.setCurrentPage,
  setItemsPerPage: state.setItemsPerPage,
  getActiveFiltersCount: state.getActiveFiltersCount,
  hasActiveFilters: state.hasActiveFilters,
}));

export const useLoading = () => useUIStore((state) => ({
  globalLoading: state.globalLoading,
  setGlobalLoading: state.setGlobalLoading,
  setLoadingState: state.setLoadingState,
  isLoading: state.isLoading,
}));

export const useResponsive = () => useUIStore((state) => ({
  isMobile: state.isMobile,
  screenSize: state.screenSize,
  sidebarCollapsed: state.sidebarCollapsed,
  setScreenSize: state.setScreenSize,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
}));