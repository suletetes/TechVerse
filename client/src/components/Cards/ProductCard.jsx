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

    return (
        <div className="text-start d-flex col-md-6 col-lg-4 mb-4">
            <div className="store-card fill-card position-relative">
                {/* Rating Badge */}
                {product.rating && (
                    <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-warning text-dark">
                            <i className="fa fa-star"></i> {product.rating}
                        </span>
                    </div>
                )}
                
                {/* Category Badge */}
                <div className="position-absolute top-0 start-0 m-2">
                    <span className="badge bg-primary">
                        {product.category && typeof product.category === 'string' 
                            ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
                            : product.category?.name || 'Category'
                        }
                    </span>
                </div>
                
                <Link to={product.link || '#'}>
                    <picture>
                        <source type="image/webp" srcSet={product.webp} />
                        <img
                            src={product.image || '/placeholder-image.jpg'}
                            alt={product.name || 'Product'}
                            className="img-fluid mx-auto d-block"
                            width="360"
                            height="360"
                            style={{transition: 'transform 0.3s ease'}}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        />
                    </picture>
                </Link>
                
                <div className="row g-0 p-3">
                    <div className="col-12 mb-2">
                        <h5 className="tc-6533 mb-1 lg-sub-title">{product.name || 'Product Name'}</h5>
                        <small className="text-muted">{product.brand || 'Brand'}</small>
                    </div>
                    <div className="col-lg-8">
                        <p className="tc-6533 float-lg-none mb-2 fw-bold">{product.price || 'Price'}</p>
                    </div>
                    <div className="col-lg-4 align-self-end">
                        <Link
                            to={product.link || '#'}
                            className="btn btn-sm btn-rd btn-c-2101 float-lg-end buy-btn w-100"
                            style={{transition: 'all 0.3s ease'}}
                        >
                            Buy Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;