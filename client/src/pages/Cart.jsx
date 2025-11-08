import React, { useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../context';
import { LoadingSpinner } from '../components/Common';

const Cart = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { 
        items, 
        total, 
        itemCount, 
        isLoading, 
        error,
        updateCartItem, 
        removeFromCart, 
        clearCart, 
        loadCart 
    } = useCart();

    const [promoCode, setPromoCode] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Debug logging
    console.log('🛒 Cart Page State:', {
        items,
        itemsLength: items?.length,
        total,
        itemCount,
        isLoading,
        error
    });

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: '/cart' },
                    message: 'Please login to view your cart'
                }
            });
        }
    }, [isAuthenticated, navigate]);

    const updateQuantity = useCallback(async (itemId, newQuantity) => {
        if (newQuantity === 0) {
            await removeFromCart(itemId);
            return;
        }
        try {
            setIsUpdating(true);
            await updateCartItem(itemId, { quantity: newQuantity });
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [updateCartItem, removeFromCart]);

    const removeItem = useCallback(async (itemId) => {
        try {
            setIsUpdating(true);
            await removeFromCart(itemId);
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [removeFromCart]);

    const handleClearCart = useCallback(async () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            try {
                setIsUpdating(true);
                await clearCart();
            } catch (error) {
                console.error('Error clearing cart:', error);
            } finally {
                setIsUpdating(false);
            }
        }
    }, [clearCart]);

    const handlePromoCode = useCallback(() => {
        // TODO: Implement promo code functionality
        console.log('Applying promo code:', promoCode);
    }, [promoCode]);

    // Show loading state only on initial load
    if (isLoading && items.length === 0 && !error) {
        return (
            <div className="container py-5">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-3 text-muted">Loading your cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    <h4>Error Loading Cart</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => loadCart()}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Show empty cart
    if (!isLoading && items.length === 0 && !error) {
        return (
            <div className="container py-5 text-center">
                <div className="py-5">
                    <svg width="80" height="80" viewBox="0 0 24 24" className="text-muted mb-4">
                        <path fill="currentColor" d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
                    </svg>
                    <h3>Your cart is empty</h3>
                    <p className="text-muted mb-4">Add some products to get started!</p>
                    <Link to="/category" className="btn btn-primary btn-lg">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate totals safely
    const subtotal = Array.isArray(items) ? items.reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
    }, 0) : 0;
    
    const shipping = subtotal > 50 ? 0 : 9.99;
    const tax = subtotal * 0.2; // 20% VAT
    const finalTotal = subtotal + shipping + tax;

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="cart-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Title */}
                    <div className="col-12 mb-4">
                        <h1 className="tc-6533 bold-text">Shopping Cart</h1>
                        <p className="tc-6533">Review your items and proceed to checkout</p>
                    </div>

                    {/* Cart Items */}
                    <div className="col-lg-8 mb-4 mb-lg-0">
                        <div className="store-card fill-card position-relative">
                            {(isLoading || isUpdating) && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 10 }}>
                                    <LoadingSpinner size="md" />
                                </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="tc-6533 bold-text mb-0">Cart Items ({itemCount})</h3>
                                {Array.isArray(items) && items.length > 0 && (
                                    <button 
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={handleClearCart}
                                        disabled={isLoading || isUpdating}
                                    >
                                        {isUpdating ? 'Clearing...' : 'Clear Cart'}
                                    </button>
                                )}
                            </div>

                            {Array.isArray(items) && items.map((item, index) => (
                                <div key={item._id}>
                                    <div className="row align-items-center py-3">
                                        {/* Product Image */}
                                        <div className="col-md-2 col-3 mb-3 mb-md-0">
                                            <img
                                                src={item.product?.images?.[0] || item.product?.thumbnail || '/img/placeholder.jpg'}
                                                className="img-fluid rounded"
                                                alt={item.product?.name || 'Product'}
                                                width="80"
                                                height="80"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="col-md-4 col-9 mb-3 mb-md-0">
                                            <h5 className="tc-6533 mb-1">{item.product?.name}</h5>
                                            {item.options?.color && (
                                                <p className="tc-6533 sm-text mb-1">Color: {item.options.color}</p>
                                            )}
                                            {item.options?.storage && (
                                                <p className="tc-6533 sm-text mb-0">Storage: {item.options.storage}</p>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="col-md-2 col-6 mb-3 mb-md-0">
                                            <div className="d-flex align-items-center">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    disabled={isLoading || isUpdating}
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    -
                                                </button>
                                                <span className="mx-3 tc-6533 bold-text">{item.quantity || 0}</span>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    disabled={isLoading || isUpdating}
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="col-md-2 col-4 mb-3 mb-md-0">
                                            <p className="tc-6533 bold-text mb-0">£{item.price?.toFixed(2)}</p>
                                        </div>

                                        {/* Remove Button */}
                                        <div className="col-md-2 col-2">
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeItem(item._id)}
                                                disabled={isLoading || isUpdating}
                                                title="Remove item"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    {index < items.length - 1 && <hr className="my-3" />}
                                </div>
                            ))}

                            {/* Continue Shopping */}
                            <div className="mt-4 pt-3 border-top">
                                <Link to="/category" className="btn btn-outline-secondary btn-rd">
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
                                    <span className="tc-2101 bold-text h5">£{finalTotal.toFixed(2)}</span>
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
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                    />
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button"
                                        onClick={handlePromoCode}
                                        disabled={!promoCode.trim()}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <Link
                                to="/payment"
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
                </div>
            </div>
        </div>
    );
};

export default Cart;