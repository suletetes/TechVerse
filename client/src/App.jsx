import React from "react"
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, RouterErrorBoundary } from './components';
import { AppProviders } from './context';
import AuthGuard, { AdminGuard, UserGuard } from './components/Auth/AuthGuard.jsx';
import { UserRoles } from './services/authService.js';
import {
    Contact,
    HomeLayout,
    Categories,
    Products,
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
import { CategoryManagement } from "./pages/admin"
import EditProfile from "./pages/EditProfile"
import "./utils/uiUpdateSummary" // UI update summary and verification


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
                path: 'categories',
                element: <Categories />,
            },
            {
                path: 'products',
                element: <Products />,
            },
            {
                path: 'category/:categorySlug',
                element: <Products />,
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
                    <AdminGuard>
                        <AdminProfile />
                    </AdminGuard>
                ),
            },
            {
                path: 'admin/orders',
                element: (
                    <AdminGuard>
                        <AdminOrderManagement />
                    </AdminGuard>
                ),
            },
            {
                path: 'admin/products',
                element: (
                    <AdminGuard>
                        <AdminProductManagement />
                    </AdminGuard>
                ),
            },
            {
                path: 'admin/categories',
                element: (
                    <AdminGuard>
                        <CategoryManagement />
                    </AdminGuard>
                ),
            },
            {
                path: 'admin/categories/:slug/specifications',
                element: (
                    <AdminGuard>
                        <CategoryManagement />
                    </AdminGuard>
                ),
            },

            // User routes - protected with UserGuard
            {
                path: 'profile',
                element: (
                    <UserGuard>
                        <UserProfile />
                    </UserGuard>
                ),
            },
            {
                path: 'profile/:tab',
                element: (
                    <UserGuard>
                        <UserProfile />
                    </UserGuard>
                ),
            },
            {
                path: 'profile/edit',
                element: (
                    <UserGuard>
                        <EditProfile />
                    </UserGuard>
                ),
            },
            {
                path: 'user/order/:orderId',
                element: (
                    <UserGuard>
                        <OrderDetails />
                    </UserGuard>
                ),
            },
            {
                path: 'user/order/:orderId/tracking',
                element: (
                    <UserGuard>
                        <OrderTracking />
                    </UserGuard>
                ),
            },
            {
                path: 'user/order/:orderId/review',
                element: (
                    <UserGuard>
                        <OrderReview />
                    </UserGuard>
                ),
            },

            // Authenticated routes - require login but any role
            {
                path: 'order-confirmation',
                element: (
                    <AuthGuard>
                        <OrderConfirmation />
                    </AuthGuard>
                ),
            },
            {
                path: 'payment',
                element: (
                    <AuthGuard>
                        <PaymentPage />
                    </AuthGuard>
                ),
            },
            {
                path: 'wishlist',
                element: (
                    <AuthGuard>
                        <Wishlist />
                    </AuthGuard>
                ),
            },
            {
                path: 'cart',
                element: (
                    <AuthGuard>
                        <Cart />
                    </AuthGuard>
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
