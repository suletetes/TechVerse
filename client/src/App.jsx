import React from "react"
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, RouterErrorBoundary } from './components';
import { AppProviders } from './context';
import RouteGuard, { AdminRoute, UserRoute, AuthenticatedRoute } from './components/auth/RouteGuard.jsx';
import { UserRoles } from './services/authService.js';
import {
    Contact,
    HomeLayout,
    Category,
    Product,
    OrderConfirmation,
    PaymentPage,
    Wishlist,
    Cart,
    UserProfile,
    AdminProfile,
    Home,
    NotFound,
    OrderDetails,
    OrderTracking,
    OrderReview,
    AdminOrderManagement,
    AdminProductManagement
} from "./pages"


import {
    Privacy,
    Delivery,
    ReturnsPolicy,
    ShippingPolicy,
    Warranty,
    Stores,
    Faq
} from "./pages/info"


import {
    Signup,
    Login
} from "./pages/auth"

const router = createBrowserRouter([
    {
        path: '/',
        element: <HomeLayout />,
        errorElement: <RouterErrorBoundary />,
        children: [
            // Public routes
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'category/:categorySlug?',
                element: <Category />,
            },
            {
                path: 'product/:id',
                element: <Product />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'signup',
                element: <Signup />,
            },
            {
                path: 'contact',
                element: <Contact />,
            },
            {
                path: 'delivery',
                element: <Delivery />,
            },
            {
                path: 'warranty',
                element: <Warranty />,
            },
            {
                path: 'privacy',
                element: <Privacy />,
            },
            {
                path: 'ReturnsPolicy',
                element: <ReturnsPolicy />,
            },
            {
                path: 'ShippingPolicy',
                element: <ShippingPolicy />,
            },
            {
                path: 'faq',
                element: <Faq />,
            },
            {
                path: 'Stores',
                element: <Stores />,
            },

            // Admin routes - protected with AdminRoute guard
            {
                path: 'admin',
                element: (
                    <AdminRoute>
                        <AdminProfile />
                    </AdminRoute>
                ),
            },
            {
                path: 'admin/orders',
                element: (
                    <AdminRoute requiredPermissions={['manage_orders', 'view_admin_panel']}>
                        <AdminOrderManagement />
                    </AdminRoute>
                ),
            },
            {
                path: 'admin/products',
                element: (
                    <AdminRoute requiredPermissions={['manage_products', 'view_admin_panel']}>
                        <AdminProductManagement />
                    </AdminRoute>
                ),
            },

            // User routes - protected with UserRoute guard
            {
                path: 'user',
                element: (
                    <UserRoute>
                        <UserProfile />
                    </UserRoute>
                ),
            },
            {
                path: 'user/order/:orderId',
                element: (
                    <UserRoute>
                        <OrderDetails />
                    </UserRoute>
                ),
            },
            {
                path: 'user/order/:orderId/tracking',
                element: (
                    <UserRoute>
                        <OrderTracking />
                    </UserRoute>
                ),
            },
            {
                path: 'user/order/:orderId/review',
                element: (
                    <UserRoute>
                        <OrderReview />
                    </UserRoute>
                ),
            },

            // Authenticated routes - require login but any role
            {
                path: 'order-confirmation',
                element: (
                    <AuthenticatedRoute>
                        <OrderConfirmation />
                    </AuthenticatedRoute>
                ),
            },
            {
                path: 'payment',
                element: (
                    <AuthenticatedRoute>
                        <PaymentPage />
                    </AuthenticatedRoute>
                ),
            },
            {
                path: 'wishlist',
                element: (
                    <AuthenticatedRoute>
                        <Wishlist />
                    </AuthenticatedRoute>
                ),
            },
            {
                path: 'cart',
                element: (
                    <AuthenticatedRoute>
                        <Cart />
                    </AuthenticatedRoute>
                ),
            },

            // Error routes
            {
                path: 'unauthorized',
                element: (
                    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                            <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                Go Home
                            </a>
                        </div>
                    </div>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
            refetchOnWindowFocus: false,
        },
    },
});

const App = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AppProviders>
                    <RouterProvider router={router} />
                </AppProviders>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};
export default App;
