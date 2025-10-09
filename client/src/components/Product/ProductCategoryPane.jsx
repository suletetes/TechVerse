import React from 'react';
import { Link } from 'react-router-dom';

const ProductCategoryPane = ({ 
    category = 'Tablets', 
    subcategory = 'iPad & Tablets',
    breadcrumbs = [
        { name: 'Home', path: '/' },
        { name: 'Electronics', path: '/category/electronics' },
        { name: 'Tablets', path: '/category/tablets' },
        { name: 'iPad & Tablets', path: '/category/tablets/ipad' }
    ],
    relatedCategories = [
        { name: 'iPad Pro', path: '/category/tablets/ipad-pro', count: 12 },
        { name: 'iPad Air', path: '/category/tablets/ipad-air', count: 8 },
        { name: 'iPad Mini', path: '/category/tablets/ipad-mini', count: 6 },
        { name: 'Android Tablets', path: '/category/tablets/android', count: 15 },
        { name: 'Tablet Accessories', path: '/category/tablets/accessories', count: 24 }
    ]
}) => {
    return (
        <div className="category-pane mb-4">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-section mb-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 bg-light rounded-3 p-3">
                        {breadcrumbs.map((crumb, index) => (
                            <li 
                                key={crumb.name}
                                className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                                {...(index === breadcrumbs.length - 1 ? { 'aria-current': 'page' } : {})}
                            >
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-primary fw-medium">{crumb.name}</span>
                                ) : (
                                    <Link 
                                        to={crumb.path} 
                                        className="text-decoration-none text-muted hover-primary"
                                    >
                                        {crumb.name}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Category Information Card */}
            <div className="store-card outline-card fill-card">
                <div className="p-4">
                    <div className="d-flex align-items-center mb-3">
                        <div className="category-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary">
                                <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                            </svg>
                        </div>
                        <div>
                            <h5 className="mb-1 tc-6533 fw-bold">{category}</h5>
                            <p className="text-muted small mb-0">Browse our {category.toLowerCase()} collection</p>
                        </div>
                    </div>

                    {/* Quick Category Actions */}
                    <div className="d-flex gap-2 mb-3">
                        <Link 
                            to={`/category/${category.toLowerCase()}`}
                            className="btn btn-outline-primary btn-sm btn-rd"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                            View All {category}
                        </Link>
                        <Link 
                            to="/category"
                            className="btn btn-outline-secondary btn-sm btn-rd"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            All Categories
                        </Link>
                    </div>

                    {/* Related Categories */}
                    <div className="related-categories">
                        <h6 className="fw-semibold mb-3 text-muted">Related Categories</h6>
                        <div className="row g-2">
                            {relatedCategories.map((relatedCat) => (
                                <div key={relatedCat.name} className="col-12">
                                    <Link 
                                        to={relatedCat.path}
                                        className="d-flex justify-content-between align-items-center p-2 rounded-2 text-decoration-none hover-bg-light border border-light"
                                    >
                                        <span className="text-dark small">{relatedCat.name}</span>
                                        <span className="badge bg-light text-muted">{relatedCat.count}</span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Features */}
                    <div className="category-features mt-4 pt-3 border-top">
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="text-center">
                                    <div className="bg-success bg-opacity-10 rounded-circle p-2 d-inline-flex mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="text-success">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                    <div className="small text-muted">Free Shipping</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-center">
                                    <div className="bg-info bg-opacity-10 rounded-circle p-2 d-inline-flex mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="text-info">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                    <div className="small text-muted">2 Year Warranty</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCategoryPane;