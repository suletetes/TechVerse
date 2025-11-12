import React from 'react';
import { Link } from 'react-router-dom';

const ActivityTab = ({ 
    recentlyViewed = [], 
    setRecentlyViewed = () => {}, 
    wishlistCategories = [], 
    priceAlerts = [], 
    setPriceAlerts = () => {}, 
    handleRecentlyViewedAction = () => {}, 
    handleWishlistCategoryAction = () => {}, 
    handlePriceAlertAction = () => {} 
}) => {
    return (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Activity & Alerts</h3>

            {/* Recently Viewed Products */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Recently Viewed Products</h5>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setRecentlyViewed([])}
                    >
                        Clear All
                    </button>
                </div>

                {recentlyViewed.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded">
                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                            <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        </svg>
                        <p className="text-muted mb-0">No recently viewed products</p>
                    </div>
                ) : (
                    <div className="row">
                        {recentlyViewed.map((product) => (
                            <div key={product.id} className="col-md-4 mb-3">
                                <div className="border rounded p-3 h-100">
                                    <div className="d-flex align-items-center mb-2">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="rounded me-3"
                                            width="50"
                                            height="50"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className="flex-grow-1">
                                            <h6 className="tc-6533 mb-1">{product.name}</h6>
                                            <p className="text-muted small mb-0">£{product.price}</p>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            {new Date(product.viewedAt).toLocaleDateString()}
                                        </small>
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleRecentlyViewedAction(product.id, 'view')}
                                            >
                                                View
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleRecentlyViewedAction(product.id, 'addToWishlist')}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Wishlist Categories */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Wishlist Categories</h5>
                    <button className="btn btn-sm btn-c-2101">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        New Category
                    </button>
                </div>

                <div className="row">
                    {wishlistCategories.map((category) => (
                        <div key={category.id} className="col-md-4 mb-3">
                            <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 className="tc-6533 mb-1">{category.name}</h6>
                                        <p className="text-muted small mb-0">{category.count} items</p>
                                        {category.isDefault && (
                                            <span className="badge bg-primary mt-1">Default</span>
                                        )}
                                    </div>
                                    {!category.isDefault && (
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                                ⋮
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <button 
                                                        className="dropdown-item"
                                                        onClick={() => handleWishlistCategoryAction(category.id, 'rename')}
                                                    >
                                                        Rename
                                                    </button>
                                                </li>
                                                <li>
                                                    <button 
                                                        className="dropdown-item text-danger"
                                                        onClick={() => handleWishlistCategoryAction(category.id, 'delete')}
                                                    >
                                                        Delete
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <Link to="/wishlist" className="btn btn-sm btn-outline-primary w-100">
                                    View Items
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Alerts */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Price Alerts</h5>
                    <span className="badge bg-info">{priceAlerts.filter(alert => alert.isActive).length} active</span>
                </div>

                {priceAlerts.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded">
                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                            <path fill="currentColor" d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" />
                        </svg>
                        <p className="text-muted mb-2">No price alerts set</p>
                        <small className="text-muted">Add products to your wishlist and set price alerts to get notified when prices drop!</small>
                    </div>
                ) : (
                    <div className="row">
                        {priceAlerts.map((alert) => (
                            <div key={alert.id} className="col-12 mb-3">
                                <div className="border rounded p-3">
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            <h6 className="tc-6533 mb-1">{alert.productName}</h6>
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="text-muted small">Current: £{alert.currentPrice}</span>
                                                <span className="text-success small">Target: £{alert.targetPrice}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${Math.min((alert.currentPrice / alert.targetPrice) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <small className="text-muted">
                                                {alert.currentPrice <= alert.targetPrice ? 'Target reached!' : `£${alert.currentPrice - alert.targetPrice} to go`}
                                            </small>
                                        </div>
                                        <div className="col-md-3 text-end">
                                            <div className="d-flex gap-1 justify-content-end">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handlePriceAlertAction(alert.id, 'edit')}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handlePriceAlertAction(alert.id, 'toggle')}
                                                >
                                                    {alert.isActive ? 'Pause' : 'Resume'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;