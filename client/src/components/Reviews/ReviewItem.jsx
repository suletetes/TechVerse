import React from 'react';

const ReviewItem = ({ review }) => {
    const { name, rating, date, title, review: reviewText, verified, helpful } = review;

    return (
        <div className="review-item border-bottom pb-4 mb-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center">
                    <div
                        className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                        style={{width: '40px', height: '40px'}}>
                        <span className="text-primary fw-bold">
                            {name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                    <div>
                        <div className="d-flex align-items-center mb-1">
                            <h6 className="tc-6533 mb-0 me-2">{name}</h6>
                            {verified && (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor"
                                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    Verified Purchase
                                </span>
                            )}
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="d-flex me-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} width="16" height="16" viewBox="0 0 24 24"
                                         className={star <= rating ? 'text-warning' : 'text-muted'}>
                                        <path fill="currentColor"
                                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                ))}
                            </div>
                            <span className="text-muted small">{date}</span>
                        </div>
                    </div>
                </div>
            </div>

            <h6 className="tc-6533 fw-semibold mb-2">{title}</h6>
            <p className="text-muted mb-3">{reviewText}</p>

            {/* <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <button className="btn btn-sm btn-outline-secondary me-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M7 14l5-5 5 5z"/>
                        </svg>
                        Helpful ({helpful})
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M7 14l5 5 5-5z"/>
                        </svg>
                        Not helpful
                    </button>
                </div>
                <button className="btn btn-sm btn-outline-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                        <path fill="currentColor"
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Report
                </button>
            </div> */}
        </div>
    );
};

export default ReviewItem;