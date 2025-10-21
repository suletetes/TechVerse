import React from 'react';

const ProductActions = ({ 
    totalPrice, 
    onBuyNow, 
    onAddToCart,
    isAddingToCart,
    inStock,
    isAuthenticated,
    product
}) => {
    // Handle missing or incomplete data
    const price = totalPrice || product?.price || 0;
    const stockAvailable = inStock !== undefined ? inStock : (product?.stock?.quantity > 0 || product?.stockStatus === 'in_stock');
    
    const handleBuyNow = (e) => {
        e.preventDefault();
        if (onBuyNow) {
            onBuyNow();
        }
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        if (onAddToCart) {
            onAddToCart();
        }
    };

    if (!stockAvailable) {
        return (
            <div className="d-grid gap-2">
                <button
                    className="btn btn-secondary btn-rd btn-lg d-flex align-items-center justify-content-center"
                    disabled
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                    </svg>
                    Out of Stock
                </button>
                <button
                    className="btn btn-outline-secondary btn-rd btn-lg d-flex align-items-center justify-content-center"
                    disabled
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 17h5l-5 5-5-5h5v-5a7.07 7.07 0 0 1 0-14h2a7.07 7.07 0 0 1 0 14v5z"/>
                    </svg>
                    Notify When Available
                </button>
            </div>
        );
    }

    return (
        <div className="d-grid gap-2">
            <button
                className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center"
                onClick={handleBuyNow}
                disabled={isAddingToCart || !stockAvailable}
            >
                {isAddingToCart ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        Buy Now - £{price.toLocaleString()}
                    </>
                )}
            </button>
            
            <button
                className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center"
                onClick={handleAddToCart}
                disabled={isAddingToCart || !stockAvailable}
            >
                {isAddingToCart ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        Adding...
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="m1 1 4 4 7 13h7l4-8H6"/>
                        </svg>
                        Add to Cart
                    </>
                )}
            </button>

            {!isAuthenticated && (
                <small className="text-muted text-center mt-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    Login required for purchase
                </small>
            )}
        </div>
    );
};

export default ProductActions;