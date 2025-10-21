import React from 'react';

const ProductQuantity = ({ 
    quantity, 
    onQuantityChange, 
    maxQuantity, 
    inStock,
    product 
}) => {
    // Get max quantity from backend data
    const stockQuantity = product?.stock?.quantity || maxQuantity || 10;
    const trackQuantity = product?.stock?.trackQuantity !== false;
    const actualMaxQuantity = trackQuantity ? Math.min(stockQuantity, 99) : 99; // Cap at 99 for UI purposes
    
    const handleDecrease = () => {
        onQuantityChange(Math.max(1, quantity - 1));
    };

    const handleIncrease = () => {
        if (quantity < actualMaxQuantity) {
            onQuantityChange(quantity + 1);
        }
    };

    const handleInputChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        const clampedValue = Math.max(1, Math.min(value, actualMaxQuantity));
        onQuantityChange(clampedValue);
    };

    if (!inStock) {
        return (
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Quantity</h5>
                <div className="text-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                    </svg>
                    Out of stock
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <h5 className="tc-6533 mb-3">Quantity</h5>
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    title="Decrease quantity"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
                
                <div className="mx-3 position-relative">
                    <input
                        type="number"
                        className="form-control text-center fw-bold"
                        style={{ width: '70px' }}
                        value={quantity}
                        onChange={handleInputChange}
                        min="1"
                        max={actualMaxQuantity}
                    />
                </div>
                
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleIncrease}
                    disabled={quantity >= actualMaxQuantity}
                    title="Increase quantity"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
            </div>
            
            {/* Stock information */}
            <div className="mt-2">
                {trackQuantity && stockQuantity <= 10 && stockQuantity > 0 && (
                    <small className="text-warning">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        Only {stockQuantity} left in stock
                    </small>
                )}
                {!trackQuantity && (
                    <small className="text-success">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        In stock
                    </small>
                )}
                {quantity >= actualMaxQuantity && trackQuantity && (
                    <small className="text-info d-block">
                        Maximum quantity available: {actualMaxQuantity}
                    </small>
                )}
            </div>
        </div>
    );
};

export default ProductQuantity;