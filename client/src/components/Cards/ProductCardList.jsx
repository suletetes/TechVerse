import React from 'react';
import { Link } from 'react-router-dom';

const ProductCardList = ({ product }) => {
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

    // Get stock status
    const getStockStatus = () => {
        if (!product.stock) {
            return { text: 'In Stock', class: 'text-success' };
        }
        
        if (product.stock.trackQuantity === false) {
            return { text: 'In Stock', class: 'text-success' };
        }
        
        const quantity = typeof product.stock.quantity === 'number' ? product.stock.quantity : 0;
        const lowStockThreshold = product.stock.lowStockThreshold || 10;
        
        if (quantity === 0) return { text: 'Out of Stock', class: 'text-danger' };
        if (quantity <= lowStockThreshold) return { text: `Low Stock (${quantity})`, class: 'text-warning' };
        return { text: 'In Stock', class: 'text-success' };
    };

    const stockStatus = getStockStatus();
    const inStock = product.status === 'active' && (
        !product.stock || 
        product.stock.trackQuantity === false || 
        (typeof product.stock.quantity === 'number' && product.stock.quantity > 0)
    );

    return (
        <div className="col-12 mb-3">
            <div className="store-card fill-card d-flex flex-row position-relative">
                {/* Category Badge */}
                <div className="position-absolute top-0 start-0 m-2">
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
                
                {/* Product Image */}
                <div className="flex-shrink-0" style={{width: '200px'}}>
                    <Link to={`/product/${product.slug || product._id || product.id}`}>
                        <picture>
                            <source type="image/webp" srcSet={product.webp} />
                            <img
                                src={
                                    product.images && product.images.length > 0 
                                        ? product.images.find(img => img.isPrimary)?.url || product.images[0]?.url
                                        : product.image || '/placeholder-image.jpg'
                                }
                                alt={product.name || 'Product'}
                                className="img-fluid"
                                width="200"
                                height="200"
                                style={{
                                    transition: 'transform 0.3s ease',
                                    objectFit: 'cover',
                                    borderRadius: '8px 0 0 8px',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            />
                        </picture>
                    </Link>
                </div>
                
                {/* Product Details */}
                <div className="flex-grow-1 p-3 d-flex flex-column justify-content-between">
                    <div>
                        <Link to={`/product/${product.slug || product._id || product.id}`} className="text-decoration-none">
                            <h5 className="tc-6533 mb-2 lg-sub-title">{product.name || 'Product Name'}</h5>
                        </Link>
                        <p className="text-muted mb-2">{product.brand || 'Brand'}</p>
                        
                        {/* Price and Stock */}
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <span className="tc-6533 fw-bold fs-5">£{product.price || 'Price'}</span>
                            <small className={`${stockStatus.class} fw-bold`}>{stockStatus.text}</small>
                        </div>
                        
                        {/* Rating Display */}
                        {ratingValue > 0 && (
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="text-warning">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i 
                                            key={star}
                                            className={`fa fa-star${star <= Math.round(ratingValue) ? '' : '-o'}`}
                                            style={{ fontSize: '0.9rem' }}
                                        ></i>
                                    ))}
                                </div>
                                <small className="text-muted">
                                    {ratingValue.toFixed(1)} {reviewCount > 0 && `(${reviewCount} reviews)`}
                                </small>
                            </div>
                        )}
                        
                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-muted small mb-0" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {product.shortDescription}
                            </p>
                        )}
                    </div>
                    
                    <div className="d-flex justify-content-end align-items-end mt-3">
                        <Link
                            to={`/product/${product.slug || product._id || product.id}`}
                            className={`btn btn-sm btn-rd ${!inStock ? 'btn-secondary disabled' : 'btn-c-2101'} buy-btn`}
                            style={{transition: 'all 0.3s ease', minWidth: '120px', pointerEvents: !inStock ? 'none' : 'auto'}}
                        >
                            {inStock ? 'View Product' : 'Out of Stock'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardList;
