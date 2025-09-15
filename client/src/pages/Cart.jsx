import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Cart = () => {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Tablet Air',
            color: 'Silver',
            storage: '128GB',
            price: 1999,
            quantity: 1,
            image: 'img/tablet-product.jpg',
            imageWebp: 'img/tablet-product.webp'
        },
        {
            id: 2,
            name: 'Phone Pro',
            color: 'Black',
            storage: '256GB',
            price: 999,
            quantity: 2,
            image: 'img/phone-product.jpg',
            imageWebp: 'img/phone-product.webp'
        },
        {
            id: 3,
            name: 'Ultra Laptop',
            color: 'Space Gray',
            storage: '512GB',
            price: 2000,
            quantity: 1,
            image: 'img/laptop-product.jpg',
            imageWebp: 'img/laptop-product.webp'
        }
    ]);

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity === 0) {
            removeItem(id);
            return;
        }
        setCartItems(items =>
            items.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeItem = (id) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.2; // 20% VAT
    const total = subtotal + shipping + tax;

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="cart-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Title */}
                    <div className="col-12 mb-4">
                        <h1 className="tc-6533 bold-text">Shopping Cart</h1>
                        <p className="tc-6533">Review your items and proceed to checkout</p>
                    </div>

                    {cartItems.length === 0 ? (
                        /* Empty Cart */
                        <div className="col-12 text-center">
                            <div className="store-card fill-card">
                                <div className="py-5">
                                    <h3 className="tc-6533 mb-4">Your cart is empty</h3>
                                    <p className="tc-6533 mb-4">Looks like you haven't added any items to your cart yet.</p>
                                    <Link to="/" className="btn btn-c-2101 btn-rd btn-lg">
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="col-lg-8 mb-4 mb-lg-0">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 mb-4 bold-text">Cart Items ({cartItems.length})</h3>

                                    {cartItems.map((item, index) => (
                                        <div key={item.id}>
                                            <div className="row align-items-center py-3">
                                                {/* Product Image */}
                                                <div className="col-md-2 col-3 mb-3 mb-md-0">
                                                    <picture>
                                                        <source type="image/webp" srcSet={item.imageWebp} />
                                                        <img
                                                            src={item.image}
                                                            className="img-fluid rounded"
                                                            alt={item.name}
                                                            width="80"
                                                            height="80"
                                                        />
                                                    </picture>
                                                </div>

                                                {/* Product Details */}
                                                <div className="col-md-4 col-9 mb-3 mb-md-0">
                                                    <h5 className="tc-6533 mb-1">{item.name}</h5>
                                                    <p className="tc-6533 sm-text mb-1">Color: {item.color}</p>
                                                    <p className="tc-6533 sm-text mb-0">Storage: {item.storage}</p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="col-md-2 col-6 mb-3 mb-md-0">
                                                    <div className="d-flex align-items-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            style={{ width: '32px', height: '32px' }}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="mx-3 tc-6533 bold-text">{item.quantity}</span>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            style={{ width: '32px', height: '32px' }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="col-md-2 col-4 mb-3 mb-md-0">
                                                    <p className="tc-6533 bold-text mb-0">£{item.price}</p>
                                                </div>

                                                {/* Remove Button */}
                                                <div className="col-md-2 col-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeItem(item.id)}
                                                        title="Remove item"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            {index < cartItems.length - 1 && <hr className="my-3" />}
                                        </div>
                                    ))}

                                    {/* Continue Shopping */}
                                    <div className="mt-4 pt-3 border-top">
                                        <Link to="/" className="btn btn-outline-secondary btn-rd">
                                            ← Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="col-lg-4">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 mb-4 bold-text">Order Summary</h3>

                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="tc-6533">Subtotal:</span>
                                            <span className="tc-6533">£{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="tc-6533">Shipping:</span>
                                            <span className="tc-6533">
                                                {shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="tc-6533">Tax (VAT):</span>
                                            <span className="tc-6533">£{tax.toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-4">
                                            <span className="tc-6533 bold-text h5">Total:</span>
                                            <span className="tc-2101 bold-text h5">£{total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Shipping Notice */}
                                    {shipping === 0 && (
                                        <div className="alert alert-success mb-4" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
                                            <small className="tc-6533">🚚 Free shipping on orders over £50!</small>
                                        </div>
                                    )}

                                    {/* Promo Code */}
                                    <div className="mb-4">
                                        <label className="form-label tc-6533 bold-text">Promo Code</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter code"
                                            />
                                            <button className="btn btn-outline-secondary" type="button">
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    {/* Checkout Button */}
                                    <Link
                                        to="/checkout"
                                        className="btn btn-c-2101 btn-rd btn-lg w-100 mb-3"
                                    >
                                        Proceed to Checkout
                                    </Link>

                                    {/* Payment Methods */}
                                    <div className="text-center">
                                        <p className="tc-6533 sm-text mb-2">We accept:</p>
                                        <div className="d-flex justify-content-center gap-2">
                                            <span className="badge bg-light text-dark">Visa</span>
                                            <span className="badge bg-light text-dark">Mastercard</span>
                                            <span className="badge bg-light text-dark">PayPal</span>
                                            <span className="badge bg-light text-dark">Apple Pay</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cart;