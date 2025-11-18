import React, { lazy, Suspense } from "react"
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, RouterErrorBoundary } from './components';
import { AppProviders } from './context';
import AuthGuard, { AdminGuard, UserGuard } from './components/Auth/AuthGuard.jsx';
import { UserRoles } from './services/authService.js';
import { NotificationContainer, LoadingSpinner } from './components/Common';
import "./utils/uiUpdateSummary" // UI update summary and verification

// Eager load critical components
import HomeLayout from './pages/HomeLayout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Lazy load route components for code splitting
const Contact = lazy(() => import('./pages/Contact'));
const Categories = lazy(() => import('./pages/Categories'));
const Products = lazy(() => import('./pages/Products'));
const Product = lazy(() => import('./pages/Product'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Cart = lazy(() => import('./pages/Cart'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminProfile = lazy(() => import('./pages/Admin/AdminProfile'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const OrderReview = lazy(() => import('./pages/OrderReview'));
const AdminOrderManagement = lazy(() => import('./pages/Admin/AdminOrderManagement'));
const AdminProductManagement = lazy(() => import('./pages/Admin/AdminProductManagement'));
const ProductReviews = lazy(() => import('./pages/ProductReviews'));
const AdminReviewManagement = lazy(() => import('./pages/Admin/AdminReviewManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const EditProfile = lazy(() => import('./pages/EditProfile'));

// Lazy load info pages
const Privacy = lazy(() => import('./pages/info/Privacy'));
const Delivery = lazy(() => import('./pages/info/Delivery'));
const ReturnsPolicy = lazy(() => import('./pages/info/ReturnsPolicy'));
const ShippingPolicy = lazy(() => import('./pages/info/ShippingPolicy'));
const Warranty = lazy(() => import('./pages/info/Warranty'));
const Stores = lazy(() => import('./pages/info/Stores'));
const Faq = lazy(() => import('./pages/info/Faq'));

// Lazy load auth pages
const Signup = lazy(() => import('./pages/auth/Signup'));
const Login = lazy(() => import('./pages/auth/Login'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh' 
  }}>
    <LoadingSpinner />
  </div>
);

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
                element: <Suspense fallback={<PageLoader />}><Categories /></Suspense>,
            },
            {
                path: 'products',
                element: <Suspense fallback={<PageLoader />}><Products /></Suspense>,
            },
            {
                path: 'product/:id',
                element: <Suspense fallback={<PageLoader />}><Product /></Suspense>,
            },
            {
                path: 'product/:id/reviews',
                element: <Suspense fallback={<PageLoader />}><ProductReviews /></Suspense>,
            },
            {
                path: 'login',
                element: <Suspense fallback={<PageLoader />}><Login /></Suspense>,
            },
            {
                path: 'signup',
                element: <Suspense fallback={<PageLoader />}><Signup /></Suspense>,
            },
            {
                path: 'auth/forgot-password',
                element: <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>,
            },
            {
                path: 'reset-password',
                element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>,
            },
            {
                path: 'auth/verify-email',
                element: <Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>,
            },
            {
                path: 'verify-email',
                element: <Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>,
            },
            {
                path: 'contact',
                element: <Suspense fallback={<PageLoader />}><Contact /></Suspense>,
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
            {
                path: 'admin/reviews',
                element: (
                    <AdminGuard>
                        <AdminReviewManagement />
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
                path: 'order-confirmation/:orderNumber?',
                element: (
                    <AuthGuard>
                        <OrderConfirmation />
                    </AuthGuard>
                ),
            },
            {
                path: 'payment-failed',
                element: (
                    <AuthGuard>
                        <PaymentFailed />
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
                    <NotificationContainer />
                    <RouterProvider router={router} />
                </AppProviders>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};
export default App;
