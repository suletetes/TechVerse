import React from 'react';

const ProductQuantity = ({ quantity, onQuantityChange }) => {
    const handleDecrease = () => {
        onQuantityChange(Math.max(1, quantity - 1));
    };

    const handleIncrease = () => {
        onQuantityChange(quantity + 1);
    };

    return (
        <div className="mb-4">
            <h5 className="tc-6533 mb-3">Quantity</h5>
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
                <span className="mx-3 fw-bold">{quantity}</span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleIncrease}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProductQuantity;