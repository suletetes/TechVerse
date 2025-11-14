import React, { useState } from 'react';
import { Toast } from '../Common';

const AdminReviews = ({
    reviews = [],
    onApproveReview,
    onRejectReview,
    onDeleteReview,
    isLoading = false,
    error = null
}) => {
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(10);
    const [expandedReviews, setExpandedReviews] = useState(new Set());

    const toggleReviewExpansion = (reviewId) => {
        const newExpanded = new Set(expandedReviews);
        if (newExpanded.has(reviewId)) {
            newExpanded.delete(reviewId);
        } else {
            newExpanded.add(reviewId);
        }
        setExpandedReviews(newExpanded);
    };

    const handleApprove = async (reviewId) => {
        console.log('✅ Approve review clicked:', reviewId);
        
        try {
            if (onApproveReview) {
                await onApproveReview(reviewId);
                setToast({
                    message: 'Review approved successfully!',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('❌ Error approving review:', error);
            setToast({
                message: error.message || 'Failed to approve review',
                type: 'error'
            });
        }
    };

    const handleReject = async (reviewId) => {
        console.log('❌ Reject review clicked:', reviewId);
        
        if (window.confirm('Are you sure you want to reject this review?')) {
            try {
                if (onRejectReview) {
                    await onRejectReview(reviewId);
                    setToast({
                        message: 'Review rejected successfully!',
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('❌ Error rejecting review:', error);
                setToast({
                    message: error.message || 'Failed to reject review',
                    type: 'error'
                });
            }
        }
    };

    const handleDelete = async (reviewId) => {
        console.log('🗑️ Delete review clicked:', reviewId);
        
        if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                if (onDeleteReview) {
                    await onDeleteReview(reviewId);
                    setToast({
                        message: 'Review deleted successfully!',
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('❌ Error deleting review:', error);
                setToast({
                    message: error.message || 'Failed to delete review',
                    type: 'error'
                });
            }
        }
    };

    // Filter reviews
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const filteredReviews = safeReviews.filter(review => {
        if (searchTerm) {
            const productName = (review.product?.name || '').toLowerCase();
            const userName = (review.user?.name || '').toLowerCase();
            const comment = (review.comment || '').toLowerCase();
            
            if (!productName.includes(searchTerm.toLowerCase()) &&
                !userName.includes(searchTerm.toLowerCase()) &&
                !comment.includes(searchTerm.toLowerCase())) {
                return false;
            }
        }
        
        if (statusFilter && review.status !== statusFilter) {
            return false;
        }
        
        if (ratingFilter && review.rating !== parseInt(ratingFilter)) {
            return false;
        }
        
        return true;
    });

    // Pagination
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

    // Statistics
    const reviewStats = {
        total: safeReviews.length,
        pending: safeReviews.filter(r => r.status === 'pending').length,
        approved: safeReviews.filter(r => r.status === 'approved').length,
        rejected: safeReviews.filter(r => r.status === 'rejected').length,
        avgRating: safeReviews.length > 0 
            ? (safeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / safeReviews.length).toFixed(1)
            : 0
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'danger';
            default: return 'secondary';
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <svg
                key={index}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={index < rating ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                className={index < rating ? 'text-warning' : 'text-muted'}
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ));
    };

    return (
        <div className="store-card fill-card">
            {/* Header */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                <div>
                    <h3 className="tc-6533 bold-text mb-1">Review Management</h3>
                    <p className="text-muted mb-0">Moderate and manage customer reviews</p>
                </div>
            </div>

            {/* Statistics */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-light border-0">
                        <div className="card-body p-3">
                            <div className="row align-items-center">
                                <div className="col-md-8">
                                    <div className="d-flex gap-3 flex-wrap">
                                        <span className="badge bg-primary bg-opacity-15 text-primary px-3 py-2">
                                            <strong>{reviewStats.total}</strong> Total Reviews
                                        </span>
                                        <span className="badge bg-warning bg-opacity-15 text-warning px-3 py-2">
                                            <strong>{reviewStats.pending}</strong> Pending
                                        </span>
                                        <span className="badge bg-success bg-opacity-15 text-success px-3 py-2">
                                            <strong>{reviewStats.approved}</strong> Approved
                                        </span>
                                        <span className="badge bg-danger bg-opacity-15 text-danger px-3 py-2">
                                            <strong>{reviewStats.rejected}</strong> Rejected
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4 text-md-end mt-2 mt-md-0">
                                    <div className="text-muted small">Average Rating</div>
                                    <div className="h5 mb-0 text-warning fw-bold">
                                        ⭐ {reviewStats.avgRating} / 5.0
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3 mb-md-0">
                    <div className="input-group">
                        <span className="input-group-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search reviews, products, or users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading reviews...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading reviews from database...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="alert alert-danger mx-4">
                    <h5 className="alert-heading">Error Loading Reviews</h5>
                    <p className="mb-0">{error}</p>
                </div>
            )}

            {/* Reviews Table */}
            {!isLoading && !error && (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0 fw-semibold" width="50"></th>
                                    <th className="border-0 fw-semibold">Product</th>
                                    <th className="border-0 fw-semibold">Customer</th>
                                    <th className="border-0 fw-semibold">Rating</th>
                                    <th className="border-0 fw-semibold">Review</th>
                                    <th className="border-0 fw-semibold">Date</th>
                                    <th className="border-0 fw-semibold">Status</th>
                                    <th className="border-0 fw-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentReviews.map((review) => {
                                    const reviewId = review._id || review.id;
                                    return (
                                        <React.Fragment key={reviewId}>
                                            <tr className="border-bottom">
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => toggleReviewExpansion(reviewId)}
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        <svg 
                                                            width="14" 
                                                            height="14" 
                                                            viewBox="0 0 24 24" 
                                                            style={{ 
                                                                transform: expandedReviews.has(reviewId) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s ease'
                                                            }}
                                                        >
                                                            <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={review.product?.image || review.product?.images?.[0]?.url || '/img/placeholder.jpg'}
                                                            alt={review.product?.name || 'Product'}
                                                            className="rounded me-2"
                                                            width="40"
                                                            height="40"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                        <div>
                                                            <div className="fw-medium">{review.product?.name || 'Unknown Product'}</div>
                                                            <small className="text-muted">Order: {review.order || 'N/A'}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{review.user?.name || 'Anonymous'}</div>
                                                        <small className="text-muted">{review.user?.email || 'N/A'}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        {renderStars(review.rating || 0)}
                                                        <span className="ms-1 fw-bold">{review.rating || 0}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ maxWidth: '300px' }}>
                                                        <div className="fw-medium mb-1">{review.title || 'No title'}</div>
                                                        <small className="text-muted">
                                                            {review.comment?.substring(0, 80) || 'No comment'}
                                                            {review.comment?.length > 80 && '...'}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div>{new Date(review.createdAt || Date.now()).toLocaleDateString()}</div>
                                                        <small className="text-muted">{new Date(review.createdAt || Date.now()).toLocaleTimeString()}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${getStatusColor(review.status)} bg-opacity-15 text-${getStatusColor(review.status)} border border-${getStatusColor(review.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                                        {review.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="btn-group btn-group-sm">
                                                        {review.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-outline-success btn-sm"
                                                                    onClick={() => handleApprove(reviewId)}
                                                                    title="Approve Review"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-warning btn-sm"
                                                                    onClick={() => handleReject(reviewId)}
                                                                    title="Reject Review"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleDelete(reviewId)}
                                                            title="Delete Review"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedReviews.has(reviewId) && (
                                                <tr className="expanded-details">
                                                    <td colSpan="8" className="p-0">
                                                        <div className="bg-light border-top p-4">
                                                            <div className="row">
                                                                <div className="col-md-8">
                                                                    <h6 className="fw-bold mb-3">Full Review</h6>
                                                                    <div className="mb-3">
                                                                        <strong>Title:</strong> {review.title || 'No title'}
                                                                    </div>
                                                                    <div className="mb-3">
                                                                        <strong>Comment:</strong>
                                                                        <p className="mt-2">{review.comment || 'No comment provided'}</p>
                                                                    </div>
                                                                    {review.pros && (
                                                                        <div className="mb-3">
                                                                            <strong className="text-success">Pros:</strong>
                                                                            <p className="mt-2">{review.pros}</p>
                                                                        </div>
                                                                    )}
                                                                    {review.cons && (
                                                                        <div className="mb-3">
                                                                            <strong className="text-danger">Cons:</strong>
                                                                            <p className="mt-2">{review.cons}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="col-md-4">
                                                                    <h6 className="fw-bold mb-3">Review Details</h6>
                                                                    <div className="mb-2">
                                                                        <small className="text-muted">Review ID:</small>
                                                                        <div>{reviewId}</div>
                                                                    </div>
                                                                    <div className="mb-2">
                                                                        <small className="text-muted">Order ID:</small>
                                                                        <div>{review.order || 'N/A'}</div>
                                                                    </div>
                                                                    <div className="mb-2">
                                                                        <small className="text-muted">Verified Purchase:</small>
                                                                        <div>
                                                                            {review.verifiedPurchase ? (
                                                                                <span className="badge bg-success">Yes</span>
                                                                            ) : (
                                                                                <span className="badge bg-secondary">No</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {review.status === 'pending' && (
                                                                        <div className="mt-3 d-grid gap-2">
                                                                            <button
                                                                                className="btn btn-success btn-sm"
                                                                                onClick={() => handleApprove(reviewId)}
                                                                            >
                                                                                ✓ Approve Review
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-warning btn-sm"
                                                                                onClick={() => handleReject(reviewId)}
                                                                            >
                                                                                ✗ Reject Review
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <div className="text-muted">
                                Showing {indexOfFirstReview + 1}-{Math.min(indexOfLastReview, filteredReviews.length)} of {filteredReviews.length} reviews
                            </div>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>
                                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = index + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + index;
                                        } else {
                                            pageNum = currentPage - 2 + index;
                                        }
                                        
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredReviews.length === 0 && (
                        <div className="text-center py-5">
                            <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                                <path fill="currentColor" d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z" />
                            </svg>
                            <h5 className="text-muted">No reviews found</h5>
                            <p className="text-muted">
                                {searchTerm || statusFilter || ratingFilter
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'No reviews have been submitted yet'
                                }
                            </p>
                            {(searchTerm || statusFilter || ratingFilter) && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('');
                                        setRatingFilter('');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AdminReviews;
