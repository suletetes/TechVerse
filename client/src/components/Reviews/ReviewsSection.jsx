import React from 'react';
import ReviewsSummary from './ReviewsSummary';
import ReviewItem from './ReviewItem';
import WriteReview from './WriteReview';

const ReviewsSection = ({ onSubmitReview }) => {
    const sampleReviews = [
        {
            id: 1,
            name: "Sarah Johnson",
            rating: 5,
            date: "2 days ago",
            title: "Excellent tablet, highly recommended!",
            review: "I've been using this tablet for a month now and I'm extremely satisfied. The build quality is outstanding, the display is crisp and vibrant, and the performance is smooth. The battery life is impressive - I can use it all day without worrying about charging.",
            verified: true,
            helpful: 12
        },
        {
            id: 2,
            name: "Michael Chen",
            rating: 5,
            date: "1 week ago",
            title: "Perfect for work and entertainment",
            review: "This tablet has exceeded my expectations. The screen size is perfect for both work presentations and watching movies. The speakers are surprisingly good, and the camera quality is decent for video calls. The design is sleek and modern.",
            verified: true,
            helpful: 8
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            rating: 4,
            date: "2 weeks ago",
            title: "Great value for money",
            review: "Overall a great tablet. The performance is solid and the display is beautiful. The only minor issue I have is that it can get a bit warm during intensive use, but it's not a deal-breaker. Would definitely recommend to others.",
            verified: true,
            helpful: 5
        },
        {
            id: 4,
            name: "David Thompson",
            rating: 5,
            date: "3 weeks ago",
            title: "Amazing build quality and performance",
            review: "I've owned several tablets over the years, and this one stands out. The aluminum body feels premium, the screen is gorgeous, and the battery life is fantastic. The software is smooth and responsive. Worth every penny!",
            verified: true,
            helpful: 15
        },
        {
            id: 5,
            name: "Lisa Wang",
            rating: 4,
            date: "1 month ago",
            title: "Good tablet with minor drawbacks",
            review: "This is a solid tablet with great features. The display is excellent and the performance is smooth. However, I wish the storage options were more flexible and the price point was a bit lower. Still, it's a good purchase overall.",
            verified: true,
            helpful: 3
        }
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

                {/* Overall Rating Summary */}
                <ReviewsSummary />

                <div className="divider-h mb-4"></div>

                {/* Individual Reviews */}
                <div className="reviews-list">
                    {sampleReviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                    ))}
                </div>

                {/* Load More Reviews Button */}
                <div className="text-center mt-4">
                    <button className="btn btn-outline-primary btn-rd px-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M7 14l5-5 5 5z"/>
                        </svg>
                        Load More Reviews
                    </button>
                </div>

                <div className="divider-h my-4"></div>

                {/* Write a Review Section */}
                <WriteReview onSubmit={onSubmitReview} />
            </div>
        </div>
    );
};

export default ReviewsSection;