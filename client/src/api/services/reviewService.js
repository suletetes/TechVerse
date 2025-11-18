import apiClient from '../../lib/apiClient';

const reviewService = {
    /**
     * Get reviews for a product
     * @param {string} productId - Product ID or slug
     * @param {object} options - Query options
     * @returns {Promise} Reviews data with pagination
     */
    getProductReviews: async (productId, options = {}) => {
        const {
            page = 1,
            limit = 10,
            sort = 'newest',
            rating,
            verified
        } = options;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sort
        });

        if (rating) params.append('rating', rating.toString());
        if (verified !== undefined) params.append('verified', verified.toString());

        const response = await apiClient.get(`/products/${productId}/reviews?${params.toString()}`);
        return response.data;
    },

    /**
     * Submit a review for a product
     * @param {string} productId - Product ID
     * @param {object} reviewData - Review data
     * @returns {Promise} Created review
     */
    submitReview: async (productId, reviewData) => {
        const response = await apiClient.post(`/products/${productId}/reviews`, reviewData);
        return response.data;
    },

    /**
     * Get user's reviews
     * @param {object} options - Query options
     * @returns {Promise} User's reviews
     */
    getUserReviews: async (options = {}) => {
        const {
            page = 1,
            limit = 10
        } = options;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        const response = await apiClient.get(`/reviews/user/my-reviews?${params.toString()}`);
        return response.data;
    }
};

export default reviewService;
