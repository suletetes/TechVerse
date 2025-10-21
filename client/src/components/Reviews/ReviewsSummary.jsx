import React from 'react';

const ReviewsSummary = ({ 
    averageRating,
    totalReviews,
    reviews = [],
    ratingBreakdown
}) => {
    // Handle backend data or calculate from reviews
    const overallRating = averageRating || (reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0);
    
    const reviewCount = totalReviews || reviews.length;

    // Calculate rating breakdown from reviews if not provided
    const calculateBreakdown = () => {
        if (ratingBreakdown) return ratingBreakdown;
        
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            if (breakdown[review.rating] !== undefined) {
                breakdown[review.rating]++;
            }
        });
        return breakdown;
    };

    const breakdown = calculateBreakdown();
    const getPercentage = (count) => {
        return reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    };

    // Don't render if no reviews
    if (reviewCount === 0) {
        return (
            <div className="text-center py-4">
                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p className="text-muted">No reviews yet</p>
            </div>
        );
    }

    return (
        <div className="row mb-4">
            <div className="col-md-4">
                <div className="text-center">
                    <div className="display-4 fw-bold text-warning mb-2">{overallRating.toFixed(1)}</div>
                    <div className="d-flex justify-content-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} width="20" height="20" viewBox="0 0 24 24" className={`me-1 ${star <= Math.round(overallRating) ? 'text-warning' : 'text-muted'}`}>
                                <path fill="currentColor"
                                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        ))}
                    </div>
                    <p className="text-muted mb-0">Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                </div>
            </div>
            <div className="col-md-8">
                <div className="rating-breakdown">
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="d-flex align-items-center mb-2">
                            <span className="text-muted me-2">{rating}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-warning me-2">
                                <path fill="currentColor"
                                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                <div
                                    className="progress-bar bg-warning"
                                    style={{width: `${getPercentage(breakdown[rating])}%`}}
                                ></div>
                            </div>
                            <span className="text-muted small">{breakdown[rating]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewsSummary;