import React from 'react';

const ProductInfo = ({
    product,
    price,
    originalPrice,
    discount,
    rating,
    reviewCount,
    inStock,
    stockCount,
    isInWishlist,
    onToggleWishlist,
    isWishlistLoading
}) => {
    // Handle missing product data gracefully
    if (!product) {
        return (
            <div className="d-flex justify-content-center align-items-center py-4">
                <div className="text-muted">Loading product information...</div>
            </div>
        );
    }

    // Extract data from backend product structure
    const productName = product.name || 'Product';
    const productPrice = price || product.price || 0;
    const comparePrice = originalPrice || product.comparePrice;
    const averageRating = rating || product.rating?.average || 0;
    const totalReviews = reviewCount || product.rating?.count || 0;
    const stockQuantity = stockCount || product.stock?.quantity || 0;
    const isInStock = inStock !== undefined ? inStock : (product.stock?.quantity > 0 || product.stockStatus === 'in_stock');
    const discountPercent = discount || product.discountPercentage || 0;

    // Calculate discount if compare price exists
    const calculatedDiscount = comparePrice && comparePrice > productPrice 
        ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
        : discountPercent;

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-warning">
                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-warning">
                        <defs>
                            <linearGradient id="half-star">
                                <stop offset="50%" stopColor="currentColor"/>
                                <stop offset="50%" stopColor="transparent"/>
                            </linearGradient>
                        </defs>
                        <path fill="url(#half-star)" stroke="currentColor" strokeWidth="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            } else {
                stars.push(
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" className="text-muted">
                        <path fill="none" stroke="currentColor" strokeWidth="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            }
        }
        return stars;
    };

    return (
        <div className="product-info">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="flex-grow-1">
                    <p className="sm-product-title tc-2101 mb-0">
                        {product.shipping?.free ? 'Free Delivery' : 'Standard Delivery'}
                    </p>
                    <h3 className="tc-6533 mb-1">Buy {productName}</h3>
                    
                    {/* Price Display */}
                    <div className="price-section mb-2">
                        <div className="d-flex align-items-center gap-2">
                            <span className="tc-6533 h4 mb-0 fw-bold">
                                £{productPrice.toLocaleString()}
                            </span>
                            {comparePrice && comparePrice > productPrice && (
                                <>
                                    <span className="text-muted text-decoration-line-through">
                                        £{comparePrice.toLocaleString()}
                                    </span>
                                    <span className="badge bg-danger">
                                        {calculatedDiscount}% OFF
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Rating Display */}
                    {averageRating > 0 && (
                        <div className="rating-section mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center">
                                    {renderStars(averageRating)}
                                </div>
                                <span className="text-muted small">
                                    {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Stock Status */}
                    <div className="stock-status mb-2">
                        {isInStock ? (
                            <div className="d-flex align-items-center text-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <span className="small fw-medium">
                                    In Stock
                                    {stockQuantity > 0 && stockQuantity <= 10 && (
                                        <span className="text-warning ms-1">
                                            (Only {stockQuantity} left)
                                        </span>
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center text-danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                                </svg>
                                <span className="small fw-medium">Out of Stock</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wishlist Button */}
                <button
                    className={`btn btn-link p-2 ${isInWishlist ? 'text-danger' : 'text-muted'}`}
                    onClick={onToggleWishlist}
                    disabled={isWishlistLoading}
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {isWishlistLoading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24"
                             fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor"
                             strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    )}
                </button>
            </div>

            {/* Product Description */}
            {product.shortDescription && (
                <div className="product-description">
                    <p className="text-muted mb-0">{product.shortDescription}</p>
                </div>
            )}
        </div>
    );
};

export default ProductInfo;