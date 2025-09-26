import React from 'react';

const ReviewsSummary = ({ 
    overallRating = 4.8, 
    totalReviews = 127,
    ratingBreakdown = {
        5: 108,
        4: 15,
        3: 3,
        2: 1,
        1: 0
    }
}) => {
    const getPercentage = (count) => {
        return Math.round((count / totalReviews) * 100);
    };

    return (
        <div className="row mb-4">
            <div className="col-md-4">
                <div className="text-center">
                    <div className="display-4 fw-bold text-warning mb-2">{overallRating}</div>
                    <div className="d-flex justify-content-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} width="20" height="20" viewBox="0 0 24 24" className="text-warning me-1">
                                <path fill="currentColor"
                                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        ))}
                    </div>
                    <p className="text-muted mb-0">Based on {totalReviews} reviews</p>
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
                                    style={{width: `${getPercentage(ratingBreakdown[rating])}%`}}
                                ></div>
                            </div>
                            <span className="text-muted small">{ratingBreakdown[rating]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewsSummary;