import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import wishlistService from '../../api/services/wishlistService';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Safety check for product prop
    if (!product) {
        return (
            <div className="text-start d-flex col-md-6 col-lg-4 mb-4">
                <div className="store-card fill-card">
                    <div className="p-3 text-center">
                        <p className="text-muted">Product not available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Check if product is in wishlist
    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!product._id || !isAuthenticated) {
                setIsInWishlist(false);
                return;
            }

            try {
                const response = await wishlistService.checkWishlistStatus(product._id);
                setIsInWishlist(response.data?.isInWishlist || false);
            } catch (error) {
                setIsInWishlist(false);
            }
        };

        checkWishlistStatus();
    }, [product._id, isAuthenticated]);

    const getStockStatus = () => {
        // If stock object doesn't exist, assume in stock
        if (!product.stock) {
            return { text: 'In Stock', class: 'text-success' };
        }
        
        // If stock tracking is disabled, assume in stock
        if (product.stock.trackQuantity === false) {
            return { text: 'In Stock', class: 'text-success' };
        }
        
        // Get quantity, default to 0 only if stock object exists but quantity is undefined
        const quantity = typeof product.stock.quantity === 'number' ? product.stock.quantity : 0;
        const lowStockThreshold = product.stock.lowStockThreshold || 10;
        
        if (quantity === 0) return { text: 'Out of Stock', class: 'text-danger' };
        if (quantity <= lowStockThreshold) return { text: `Low Stock (${quantity})`, class: 'text-warning' };
        return { text: 'In Stock', class: 'text-success' };
    };

    const stockStatus = getStockStatus();
    
    // Determine if product is in stock
    const inStock = product.status === 'active' && (
        !product.stock || 
        product.stock.trackQuantity === false || 
        (typeof product.stock.quantity === 'number' && product.stock.quantity > 0)
    );

    // Handle wishlist toggle
    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: `/product/${product.slug || product._id}` },
                    message: 'Please login to add items to your wishlist'
                }
            });
            return;
        }

        try {
            setWishlistLoading(true);
            
            if (isInWishlist) {
                await wishlistService.removeFromWishlist(product._id);
                setIsInWishlist(false);
            } else {
                await wishlistService.addToWishlist(product._id);
                setIsInWishlist(true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        } finally {
            setWishlistLoading(false);
        }
    };

    // Get rating value
    const getRating = () => {
        if (typeof product.rating === 'object' && product.rating?.average) {
            return product.rating.average;
        } else if (typeof product.rating === 'number') {
            return product.rating;
        }
        return 0;
    };

    const ratingValue = getRating();
    const reviewCount = product.rating?.count || product.reviewCount || 0;



    return (
        <div className="text-start d-flex col-md-6 col-lg-4 mb-4">
            <div className="store-card fill-card position-relative w-100">
                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                    style={{ 
                        zIndex: 11,
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #dee2e6',
                        transition: 'all 0.2s ease'
                    }}
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <i className={`fa fa-heart ${isInWishlist ? 'text-danger' : 'text-muted'}`}></i>
                </button>
                
                {/* Category Badge */}
                <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 10 }}>
                    <span className="badge bg-primary">
                        {(() => {
                            if (!product.category) return 'Category';
                            if (typeof product.category === 'string') {
                                return product.category.charAt(0).toUpperCase() + product.category.slice(1);
                            }
                            if (typeof product.category === 'object' && product.category.name) {
                                return product.category.name.charAt(0).toUpperCase() + product.category.name.slice(1);
                            }
                            return 'Category';
                        })()}
                    </span>
                </div>
                
                <Link to={`/product/${product.slug || product._id || product.id}`} className="text-decoration-none">
                    <picture>
                        <source type="image/webp" srcSet={product.webp} />
                        <img
                            src={
                                product.images && product.images.length > 0 
                                    ? product.images.find(img => img.isPrimary)?.url || product.images[0]?.url
                                    : product.image || '/placeholder-image.jpg'
                            }
                            alt={product.name || 'Product'}
                            className="img-fluid mx-auto d-block"
                            width="360"
                            height="360"
                            style={{transition: 'transform 0.3s ease', cursor: 'pointer'}}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        />
                    </picture>
                </Link>
                
                <div className="row g-0 p-3">
                    <div className="col-12 mb-2">
                        <Link to={`/product/${product.slug || product._id || product.id}`} className="text-decoration-none">
                            <h5 className="tc-6533 mb-1 lg-sub-title">{product.name || 'Product Name'}</h5>
                        </Link>
                        <small className="text-muted d-block mb-1">{product.brand || 'Brand'}</small>
                        
                        {/* Rating Display */}
                        {ratingValue > 0 && (
                            <div className="d-flex align-items-center gap-1 mb-1">
                                <div className="text-warning">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i 
                                            key={star}
                                            className={`fa fa-star${star <= Math.round(ratingValue) ? '' : '-o'}`}
                                            style={{ fontSize: '0.85rem' }}
                                        ></i>
                                    ))}
                                </div>
                                <small className="text-muted">
                                    {ratingValue.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}
                                </small>
                            </div>
                        )}
                    </div>
                    <div className="col-lg-8">
                        <p className="tc-6533 float-lg-none mb-1 fw-bold">
                            {typeof product.price === 'string' ? product.price : `£${product.price}`}
                        </p>
                        <small className={`${stockStatus.class} fw-bold`}>{stockStatus.text}</small>
                    </div>
                    <div className="col-lg-4 align-self-end">
                        <Link
                            to={`/product/${product.slug || product._id || product.id}`}
                            className={`btn btn-sm btn-rd float-lg-end buy-btn w-100 ${!inStock ? 'btn-secondary disabled' : 'btn-c-2101'}`}
                            style={{transition: 'all 0.3s ease', pointerEvents: !inStock ? 'none' : 'auto'}}
                        >
                            {inStock ? 'View Product' : 'Out of Stock'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;