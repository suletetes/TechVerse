import React from 'react';
import { Link } from 'react-router-dom';

const ProductCardList = ({ product }) => {
    return (
        <div className="col-12 mb-3">
            <div className="store-card fill-card d-flex flex-row position-relative">
                {/* Rating Badge */}
                <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge bg-warning text-dark">
                        <i className="fa fa-star"></i> {typeof product.rating === 'object' 
                            ? product.rating?.average?.toFixed(1) || '0.0'
                            : product.rating?.toFixed(1) || '0.0'}
                    </span>
                </div>
                
                {/* Category Badge */}
                <div className="position-absolute top-0 start-0 m-2">
                    <span className="badge bg-primary">
                        {product.category && typeof product.category === 'string' 
                            ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
                            : product.category?.name || 'Category'
                        }
                    </span>
                </div>
                
                {/* Product Image */}
                <div className="flex-shrink-0" style={{width: '200px'}}>
                    <Link to={`/product/${product._id || product.id}`}>
                        <picture>
                            <source type="image/webp" srcSet={product.webp} />
                            <img
                                src={product.image || '/placeholder-image.jpg'}
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
                        <Link to={`/product/${product._id || product.id}`} className="text-decoration-none">
                            <h5 className="tc-6533 mb-2 lg-sub-title">{product.name || 'Product Name'}</h5>
                        </Link>
                        <p className="text-muted mb-2">{product.brand || 'Brand'}</p>
                        <div className="d-flex align-items-center mb-2">
                            <span className="tc-6533 fw-bold me-3">${product.price || 'Price'}</span>
                            <div className="d-flex align-items-center">
                                {[...Array(5)].map((_, i) => (
                                    <i 
                                        key={i} 
                                        className={`fa fa-star ${i < Math.floor(
                                            typeof product.rating === 'object' 
                                                ? product.rating?.average || 0
                                                : product.rating || 0
                                        ) ? 'text-warning' : 'text-muted'}`}
                                        style={{fontSize: '0.8rem'}}
                                    ></i>
                                ))}
                                <span className="small text-muted ms-1">({typeof product.rating === 'object' 
                                    ? product.rating?.average?.toFixed(1) || '0.0'
                                    : product.rating?.toFixed(1) || '0.0'})</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-end">
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary btn-rd">
                                <i className="fa fa-heart"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-primary btn-rd">
                                <i className="fa fa-eye"></i> Quick View
                            </button>
                        </div>
                        <Link
                            to={`/product/${product._id || product.id}`}
                            className="btn btn-sm btn-rd btn-c-2101 buy-btn"
                            style={{transition: 'all 0.3s ease', minWidth: '100px'}}
                        >
                            View Product
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardList;