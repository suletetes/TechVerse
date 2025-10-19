import React, { useMemo } from 'react';

// Import providers for use in AppProviders
import { AuthProvider } from './AuthContext.jsx';
import { CartProvider } from './CartContext.jsx';
import { NotificationProvider } from './NotificationContext.jsx';
import { ProductProvider } from './ProductContext.jsx';
import { OrderProvider } from './OrderContext.jsx';
import { AdminProvider } from './AdminContext.jsx';
import { WishlistProvider } from './WishlistContext.jsx';

// Import selective subscription utilities
export { 
  createSelectiveContext, 
  withContextSelector, 
  useMemoizedSelector, 
  useShallowMemo,
  useContextPerformanceMonitor 
} from './ContextSelector.jsx';

// Import split auth contexts
export {
  AuthStateProvider,
  AuthActionsProvider,
  useAuthState,
  useAuthActions,
  useAuthUser,
  useAuthStatus,
  useAuthError,
  useAuthPermissions,
  useAuthSession,
  useAuthMFA
} from './AuthStateContext.jsx';

// Context Providers Export
export { AuthProvider, useAuth } from './AuthContext.jsx';
export { CartProvider, useCart } from './CartContext.jsx';
export { NotificationProvider, useNotification } from './NotificationContext.jsx';
export { ProductProvider, useProduct } from './ProductContext.jsx';
export { OrderProvider, useOrder } from './OrderContext.jsx';
export { AdminProvider, useAdmin } from './AdminContext.jsx';
export { WishlistProvider, useWishlist } from './WishlistContext.jsx';

// Performance monitoring wrapper
const PerformanceMonitoredProvider = ({ name, children, provider: Provider, ...props }) => {
  const memoizedProps = useMemo(() => props, [props]);
  
  return (
    <Provider {...memoizedProps}>
      {children}
    </Provider>
  );
};

// Combined providers for easy setup with performance optimizations
export const AppProviders = ({ children }) => {
  return (
    <PerformanceMonitoredProvider name="Notification" provider={NotificationProvider}>
      <PerformanceMonitoredProvider name="Auth" provider={AuthProvider}>
        <PerformanceMonitoredProvider name="Product" provider={ProductProvider}>
          <PerformanceMonitoredProvider name="Cart" provider={CartProvider}>
            <PerformanceMonitoredProvider name="Wishlist" provider={WishlistProvider}>
              <PerformanceMonitoredProvider name="Order" provider={OrderProvider}>
                <PerformanceMonitoredProvider name="Admin" provider={AdminProvider}>
                  {children}
                </PerformanceMonitoredProvider>
              </PerformanceMonitoredProvider>
            </PerformanceMonitoredProvider>
          </PerformanceMonitoredProvider>
        </PerformanceMonitoredProvider>
      </PerformanceMonitoredProvider>
    </PerformanceMonitoredProvider>
  );
};

// Optimized providers with selective subscription
export const OptimizedAppProviders = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <AdminProvider>
                  {children}
                </AdminProvider>
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};