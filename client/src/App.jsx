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
    NotFound
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
                path: 'user',
                element: <UserProfile />,
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
