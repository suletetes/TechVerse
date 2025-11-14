import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
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

    const getStockStatus = () => {
        // If stock tracking is disabled, assume in stock
        if (!product.stock || product.stock.trackQuantity === false) {
            return { text: 'In Stock', class: 'text-success' };
        }
        
        const quantity = product.stock.quantity || 0;
        const lowStockThreshold = product.stock.lowStockThreshold || 10;
        
        if (quantity === 0) return { text: 'Out of Stock', class: 'text-danger' };
        if (quantity <= lowStockThreshold) return { text: `Low Stock (${quantity})`, class: 'text-warning' };
        return { text: 'In Stock', class: 'text-success' };
    };

    const stockStatus = getStockStatus();
    const inStock = product.status === 'active' && (
        !product.stock || 
        product.stock.trackQuantity === false || 
        (product.stock.quantity && product.stock.quantity > 0)
    );



    return (
        <div className="text-start d-flex col-md-6 col-lg-4 mb-4">
            <div className="store-card fill-card position-relative w-100">
                {/* Rating Badge */}
                {product.rating && (
                    <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                        <span className="badge bg-warning text-dark">
                            <i className="fa fa-star"></i> {typeof product.rating === 'object' 
                                ? product.rating?.average?.toFixed(1) || '0.0'
                                : product.rating?.toFixed(1) || '0.0'}
                        </span>
                    </div>
                )}
                
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
                        <small className="text-muted">{product.brand || 'Brand'}</small>
                    </div>
                    <div className="col-lg-8">
                        <p className="tc-6533 float-lg-none mb-1 fw-bold">${product.price || 'Price'}</p>
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