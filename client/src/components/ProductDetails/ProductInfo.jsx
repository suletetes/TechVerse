import React from 'react';

const ProductInfo = ({
    title = "Tablet Air",
    price,
    isInWishlist,
    onToggleWishlist,
    description = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
}) => {
    return (
        <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
                <p className="sm-product-title tc-2101 mb-0">Free Delivery</p>
                <h3 className="tc-6533 mb-1">Buy {title}</h3>
                <p className="tc-6533 h4 mb-0">£{price.toLocaleString()}</p>
            </div>
            <button
                className={`btn btn-link p-2 ${isInWishlist ? 'text-danger' : 'text-muted'}`}
                onClick={onToggleWishlist}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <svg width="24" height="24" viewBox="0 0 24 24"
                     fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor"
                     strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
        </div>
    );
};

export default ProductInfo;