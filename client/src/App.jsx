import React from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary, RouterErrorBoundary } from './components';
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
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'category',
                element: <Category />,
            },
            {
                path: 'product',
                element: <Product />,
            },
            {
                path: 'admin',
                element: <AdminProfile />,
            },
            {
                path: 'admin/orders',
                element: <AdminOrderManagement />,
            },
            {
                path: 'admin/products',
                element: <AdminProductManagement />,
            },
            {
                path: 'user',
                element: <UserProfile />,
            },
            {
                path: 'user/order/:orderId',
                element: <OrderDetails />,
            },
            {
                path: 'user/order/:orderId/tracking',
                element: <OrderTracking />,
            },
            {
                path: 'user/order/:orderId/review',
                element: <OrderReview />,
            },
            {
                path: 'order-confirmation',
                element: <OrderConfirmation />,
            }, {
                path: 'payment',
                element: <PaymentPage />,
            },
            {
                path: 'wishlist',
                element: <Wishlist />,
            }, {
                path: 'cart',
                element: <Cart />,
            },
            {
                path: 'login',
                element: <Login />,
            }, {
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
            }, {
                path: 'faq',
                element: <Faq />,
            },
            {
                path: 'Stores',
                element: <Stores />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

const App = () => {
    return (
        <ErrorBoundary>
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
};
export default App;
