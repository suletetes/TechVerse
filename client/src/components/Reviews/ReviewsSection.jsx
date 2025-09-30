import React from 'react';
import ReviewsSummary from './ReviewsSummary';
import ReviewItem from './ReviewItem';
import WriteReview from './WriteReview';

const ReviewsSection = ({
                            onSubmitReview,
                            showSummary = true,
                            showReviews = true,
                            showLoadMore = true,
                            showWriteReview = true,
                        }) => {
    const sampleReviews = [
        {
            id: 1,
            name: "Sarah Johnson",
            rating: 5,
            date: "2 days ago",
            title: "Excellent tablet, highly recommended!",
            review: "I've been using this tablet for a month now...",
            verified: true,
            helpful: 12
        },
        {
            id: 2,
            name: "Michael Chen",
            rating: 5,
            date: "1 week ago",
            title: "Perfect for work and entertainment",
            review: "This tablet has exceeded my expectations...",
            verified: true,
            helpful: 8
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            rating: 4,
            date: "2 weeks ago",
            title: "Great value for money",
            review: "Overall a great tablet...",
            verified: true,
            helpful: 5
        },
    ];

    return (
        <div className="store-card outline-card fill-card">
            <div className="p-4">
                <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-warning">
                        <path fill="currentColor"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Customer Reviews
                </h3>

                {showSummary && <ReviewsSummary/>}

                <div className="divider-h mb-4"></div>

                {showReviews && (
                    <div className="reviews-list">
                        {sampleReviews.map((review) => (
                            <ReviewItem key={review.id} review={review}/>
                        ))}
                    </div>
                )}

                {showLoadMore && (
                    <div className="text-center mt-4">
                        <button className="btn btn-outline-primary btn-rd px-4">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M7 14l5-5 5 5z"/>
                            </svg>
                            Load More Reviews
                        </button>
                    </div>
                )}

                {showWriteReview && (
                    <>
                        <div className="divider-h my-4"></div>
                        <WriteReview onSubmit={onSubmitReview}/>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
