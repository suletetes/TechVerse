import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewsSummary from './ReviewsSummary';
import ReviewItem from './ReviewItem';
import WriteReview from './WriteReview';

const ReviewsSection = ({
    productId,
    reviews = [],
    averageRating,
    totalReviews,
    onSubmitReview,
    showSummary = true,
    showReviews = true,
    showLoadMore = true,
    showWriteReview = true,
    showHeader = true,
    showDividers = true,
    title = 'Customer Reviews',
    writeReviewInitialValues = {},
    writeReviewContext,
    productInfo,
    isLoading = false,
    submitButtonText = 'Submit Review',
    initialDisplayLimit = 3 // Show only 3 reviews initially
}) => {
    console.log('🔍 DEBUG ReviewsSection: Initial values:', writeReviewInitialValues);
    console.log('🔍 DEBUG ReviewsSection: Submit button text:', submitButtonText);
    
    const navigate = useNavigate();
    // Handle backend review data structure
    const processedReviews = (Array.isArray(reviews) ? reviews : []).filter(review => review && review.rating).map(review => ({
        id: review._id || review.id,
        name: review.user?.firstName && review.user?.lastName 
            ? `${review.user.firstName} ${review.user.lastName}`
            : review.user?.name || review.name || 'Anonymous',
        rating: review.rating,
        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : review.date,
        title: review.title,
        review: review.comment || review.review,
        verified: review.verified || false,
        helpful: review.helpful?.length || review.helpful || 0,
        pros: review.pros || [],
        cons: review.cons || []
    }));

    // Fallback reviews if none provided and not loading
    const allReviews = processedReviews.length > 0 ? processedReviews : (!isLoading ? [
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
    ] : []);

    // Limit displayed reviews
    const displayReviews = allReviews.slice(0, initialDisplayLimit);
    const hasMoreReviews = allReviews.length > initialDisplayLimit;

    return (
        <div className="store-card outline-card fill-card">
            <div className="p-4">
                {showHeader && (
                    <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-warning">
                            <path fill="currentColor"
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        {title}
                    </h3>
                )}

                {showSummary && (
                    <ReviewsSummary
                        averageRating={averageRating}
                        totalReviews={totalReviews}
                        reviews={displayReviews}
                    />
                )}

                {showDividers && <div className="divider-h mb-4"></div>}

                {showReviews && (
                    <div className="reviews-list">
                        {isLoading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading reviews...</span>
                                </div>
                                <p className="text-muted mt-2">Loading reviews...</p>
                            </div>
                        ) : displayReviews.length > 0 ? (
                            displayReviews.map((review) => (
                                <ReviewItem key={review.id} review={review}/>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                            </div>
                        )}
                    </div>
                )}

                {showLoadMore && hasMoreReviews && !isLoading && (
                    <div className="text-center mt-4">
                        <button 
                            className="btn btn-outline-primary btn-rd px-4"
                            onClick={() => navigate(`/product/${productInfo?.slug || productId}/reviews`)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            View All {allReviews.length} Reviews
                        </button>
                    </div>
                )}

                {showWriteReview && (
                    <>
                        {showDividers && <div className="divider-h my-4"></div>}
                        <WriteReview 
                            productId={productId}
                            productInfo={productInfo}
                            onSubmit={onSubmitReview} 
                            initialValues={writeReviewInitialValues} 
                            context={writeReviewContext}
                            submitButtonText={submitButtonText}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
