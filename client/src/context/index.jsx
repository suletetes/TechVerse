import React from 'react';

// Import providers for use in AppProviders
import { AuthProvider } from './AuthContext.jsx';
import { CartProvider } from './CartContext.jsx';
import { NotificationProvider } from './NotificationContext.jsx';
import { ProductProvider } from './ProductContext.jsx';
import { OrderProvider } from './OrderContext.jsx';
import { AdminProvider } from './AdminContext.jsx';
import { WishlistProvider } from './WishlistContext.jsx';

// Context Providers Export
export { AuthProvider, useAuth } from './AuthContext.jsx';
export { CartProvider, useCart } from './CartContext.jsx';
export { NotificationProvider, useNotification } from './NotificationContext.jsx';
export { ProductProvider, useProduct } from './ProductContext.jsx';
export { OrderProvider, useOrder } from './OrderContext.jsx';
export { AdminProvider, useAdmin } from './AdminContext.jsx';
export { WishlistProvider, useWishlist } from './WishlistContext.jsx';

// Combined providers for easy setup
export const AppProviders = ({ children }) => {
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