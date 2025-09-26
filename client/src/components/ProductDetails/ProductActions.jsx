import React from 'react';
import { Link } from 'react-router-dom';

const ProductActions = ({ 
    totalPrice, 
    onBuyNow, 
    onAddToCart 
}) => {
    return (
        <div className="d-grid gap-2">
            <Link
                to="/payment"
                className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center"
                onClick={onBuyNow}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                Buy Now - £{totalPrice.toLocaleString()}
            </Link>
            <button
                className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center"
                onClick={onAddToCart}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="m1 1 4 4 7 13h7l4-8H6"/>
                </svg>
                Add to Cart
            </button>
        </div>
    );
};

export default ProductActions;