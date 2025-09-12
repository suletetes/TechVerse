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
    Signup, Faq, OrderConfirmation, PaymentPage, Wishlist, Cart, UserProfile, AdminProfile
} from "./pages"
import Warranty from "./pages/Warranty.jsx";
import Stores from "./pages/Stores.jsx";


const router = createBrowserRouter([
    {
        path: '/',
        element: <HomeLayout/>,
        children: [
            {
                index: true,
                element: <Contact/>,
            },

            {
                path: 'contact',
                element: <Contact/>,
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
            },{
                path: 'payment',
                element: <PaymentPage/>,
            },
            {
                path: 'wishlist',
                element: <Wishlist/>,
            },{
                path: 'cart',
                element: <Cart/>,
            },
            {
                path: 'delivery',
                element: <Delivery/>,
            },
            {
                path: 'privacy',
                element: <Privacy/>,
            }, {
                path: 'login',
                element: <Login/>,
            }, {
                path: 'signup',
                element: <Signup/>,
            },
            {
                path: 'warranty',
                element: <Warranty/>,
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
