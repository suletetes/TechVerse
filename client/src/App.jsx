import React from 'react';
import {RouterProvider, createBrowserRouter} from 'react-router-dom';
import {
    Contact,
    Delivery,
    HomeLayout,
    Privacy,
    Category,
    Product,
    ReturnsPolicy,
    ShippingPolicy,
    Login,
    Warranty,
    Stores,
    Signup, Faq, OrderConfirmation, PaymentPage, Wishlist, Cart, UserProfile, AdminProfile, Home
} from "./pages"


const router = createBrowserRouter([
    {
        path: '/',
        element: <HomeLayout/>,
        children: [
            {
                index: true,
                element: <Home/>,
            },
            {
                path: 'category',
                element: <Category/>,
            },
            {
                path: 'product',
                element: <Product/>,
            },
            {
                path: 'admin',
                element: <AdminProfile/>,
            },
            {
                path: 'user',
                element: <UserProfile/>,
            },
            {
                path: 'order-confirmation',
                element: <OrderConfirmation/>,
            }, {
                path: 'payment',
                element: <PaymentPage/>,
            },
            {
                path: 'wishlist',
                element: <Wishlist/>,
            }, {
                path: 'cart',
                element: <Cart/>,
            },
            {
                path: 'login',
                element: <Login/>,
            }, {
                path: 'signup',
                element: <Signup/>,
            },
            {
                path: 'contact',
                element: <Contact/>,
            },
            {
                path: 'delivery',
                element: <Delivery/>,
            },
            {
                path: 'warranty',
                element: <Warranty/>,
            },
            {
                path: 'privacy',
                element: <Privacy/>,
            },
            {
                path: 'ReturnsPolicy',
                element: <ReturnsPolicy/>,
            },
            {
                path: 'ShippingPolicy',
                element: <ShippingPolicy/>,
            }, {
                path: 'faq',
                element: <Faq/>,
            },
            {
                path: 'Stores',
                element: <Stores/>,
            },
        ],
    },
]);

const App = () => {
    return <RouterProvider router={router}/>;
};
export default App;
