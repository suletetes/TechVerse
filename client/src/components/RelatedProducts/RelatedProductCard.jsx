import React from 'react';
import { Link } from 'react-router-dom';

const RelatedProductCard = ({ product }) => {
    const { id, name, price, originalPrice, image, webp, rating, reviews, badge } = product;

    return (
        <div className="store-card outline-card fill-card h-100 position-relative overflow-hidden">
            {badge && (
                <div className="position-absolute top-0 start-0 z-index-1 m-3">
                    <span
                        className={`badge ${badge === 'Sale' ? 'bg-danger' :
                            badge === 'New' ? 'bg-success' :
                                'bg-primary'
                        } px-3 py-2 rounded-pill shadow-sm`}>
                        {badge}
                    </span>
                </div>
            )}

            <Link to={`/product/${id}`} className="text-decoration-none">
                <div className="position-relative overflow-hidden rounded-top">
                    <picture>
                        <source type="image/webp" srcSet={webp}/>
                        <img
                            src={image}
                            alt={name}
                            className="img-fluid w-100"
                            style={{height: '200px', objectFit: 'cover'}}
                        />
                    </picture>
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-0 d-flex align-items-center justify-content-center opacity-0 transition-all hover-overlay">
                        <span className="btn btn-light btn-sm rounded-pill px-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor"
                                      d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
                            </svg>
                            Quick View
                        </span>
                    </div>
                </div>
            </Link>

            <div className="p-3">
                <div className="d-flex align-items-center mb-2">
                    <div className="d-flex me-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} width="14" height="14" viewBox="0 0 24 24"
                                 className={star <= Math.floor(rating) ? 'text-warning' : 'text-muted'}>
                                <path fill="currentColor"
                                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        ))}
                    </div>
                    <span className="text-muted small">({reviews})</span>
                </div>

                <Link to={`/product/${id}`} className="text-decoration-none">
                    <h6 className="tc-6533 fw-semibold mb-2">{name}</h6>
                </Link>

                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <span className="h6 tc-6533 fw-bold mb-0">{price}</span>
                        {originalPrice && (
                            <span className="text-muted text-decoration-line-through ms-2 small">{originalPrice}</span>
                        )}
                    </div>
                    <button className="btn btn-outline-primary btn-sm rounded-circle p-2" title="Add to cart">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="m1 1 4 4 7 13h7l4-8H6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RelatedProductCard;