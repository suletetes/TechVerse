import BaseApiService from '../core/BaseApiService.js';

class ReviewService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'ReviewService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                reviews: '/reviews'
            },
            cacheEnabled: false, // Review data should always be fresh
            retryEnabled: true,
            defaultOptions: {
                timeout: 15000
            }
        });
    }

    // Get reviews for a product
    async getProductReviews(productId, options = {}) {
        const params = new URLSearchParams();
        
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);
        if (options.sort) params.append('sort', options.sort);
        if (options.rating) params.append('rating', options.rating);
        if (options.verified !== undefined) params.append('verified', options.verified);

        const queryString = params.toString();
        const url = `/reviews/product/${productId}${queryString ? `?${queryString}` : ''}`;
        
        return this.read(url);
    }

    // Create a new review
    async createReview(reviewData) {
        return this.create('/reviews', reviewData);
    }

    // Update a review
    async updateReview(reviewId, updateData) {
        return this.update(`/reviews/${reviewId}`, updateData);
    }

    // Delete a review
    async deleteReview(reviewId) {
        return this.delete(`/reviews/${reviewId}`);
    }

    // Vote on review helpfulness
    async voteOnReview(reviewId, helpful) {
        return this.create(`/reviews/${reviewId}/helpful`, { helpful });
    }

    // Report a review
    async reportReview(reviewId, reason, details = '') {
        return this.create(`/reviews/${reviewId}/report`, { reason, details });
    }

    // Get user's review history
    async getUserReviews(options = {}) {
        const params = new URLSearchParams();
        
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);

        const queryString = params.toString();
        const url = `/reviews/user/my-reviews${queryString ? `?${queryString}` : ''}`;
        
        return this.read(url);
    }

    // Get user's reviews for a specific order
    async getOrderReviews(orderId) {
        if (!orderId) {
            throw new Error('Order ID is required');
        }
        
        return this.read(`/reviews/order/${orderId}`);
    }

    // Get review statistics for a product
    async getProductReviewStats(productId) {
        return this.read(`/reviews/product/${productId}/stats`);
    }

    // Utility functions for local state (no API calls)
    calculateAverageRating(reviews = []) {
        if (!Array.isArray(reviews) || reviews.length === 0) return 0;
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return sum / reviews.length;
    }

    getRatingBreakdown(reviews = []) {
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        reviews.forEach(review => {
            if (breakdown[review.rating] !== undefined) {
                breakdown[review.rating]++;
            }
        });
        
        return breakdown;
    }

    formatReviewForDisplay(review) {
        return {
            ...review,
            user: {
                name: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
                initials: review.user ? 
                    `${review.user.firstName?.[0] || ''}${review.user.lastName?.[0] || ''}`.toUpperCase() : 
                    'A'
            },
            formattedDate: new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            helpfulnessPercentage: review.totalVotes > 0 ? 
                Math.round((review.helpfulCount / review.totalVotes) * 100) : 0
        };
    }

    validateReviewData(reviewData) {
        const errors = [];

        if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
            errors.push('Rating must be between 1 and 5');
        }

        if (!reviewData.title || reviewData.title.trim().length < 5) {
            errors.push('Title must be at least 5 characters long');
        }

        if (reviewData.title && reviewData.title.length > 100) {
            errors.push('Title must be less than 100 characters');
        }

        if (!reviewData.comment || reviewData.comment.trim().length < 10) {
            errors.push('Comment must be at least 10 characters long');
        }

        if (reviewData.comment && reviewData.comment.length > 1000) {
            errors.push('Comment must be less than 1000 characters');
        }

        if (reviewData.pros && reviewData.pros.length > 5) {
            errors.push('Maximum 5 pros allowed');
        }

        if (reviewData.cons && reviewData.cons.length > 5) {
            errors.push('Maximum 5 cons allowed');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if user can review a product (based on purchase history)
    async canUserReviewProduct(productId) {
        try {
            // This would typically check if user has purchased the product
            // For now, we'll assume they can review if they're authenticated
            return { canReview: true, reason: null };
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            return { canReview: false, reason: 'Unable to verify purchase history' };
        }
    }

    // Get review sorting options
    getSortingOptions() {
        return [
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'rating_high', label: 'Highest Rating' },
            { value: 'rating_low', label: 'Lowest Rating' },
            { value: 'helpful', label: 'Most Helpful' }
        ];
    }

    // Get rating filter options
    getRatingFilterOptions() {
        return [
            { value: '', label: 'All Ratings' },
            { value: '5', label: '5 Stars' },
            { value: '4', label: '4 Stars' },
            { value: '3', label: '3 Stars' },
            { value: '2', label: '2 Stars' },
            { value: '1', label: '1 Star' }
        ];
    }

    // Get report reasons
    getReportReasons() {
        return [
            { value: 'spam', label: 'Spam or fake review' },
            { value: 'inappropriate', label: 'Inappropriate content' },
            { value: 'offensive', label: 'Offensive language' },
            { value: 'fake', label: 'Fake or misleading' },
            { value: 'other', label: 'Other' }
        ];
    }
}

export const reviewService = new ReviewService();
export default reviewService;