import express from 'express';
import { Review, Product, Order } from '../models/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation middleware for review operations
const validateProductId = [
    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID format'),
    validate
];

const validateReviewId = [
    param('reviewId')
        .isMongoId()
        .withMessage('Invalid review ID format'),
    validate
];

const validateReviewCreate = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('comment')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Comment must be between 10 and 1000 characters'),
    body('pros')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 pros allowed'),
    body('pros.*')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Each pro must be less than 200 characters'),
    body('cons')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 cons allowed'),
    body('cons.*')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Each con must be less than 200 characters'),
    body('orderId')
        .optional()
        .isMongoId()
        .withMessage('Invalid order ID format'),
    validate
];

const validateReviewUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('comment')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Comment must be between 10 and 1000 characters'),
    body('pros')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 pros allowed'),
    body('cons')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 cons allowed'),
    validate
];

const validateHelpfulVote = [
    body('helpful')
        .isBoolean()
        .withMessage('Helpful must be true or false'),
    validate
];

const validateReportReview = [
    body('reason')
        .isIn(['spam', 'inappropriate', 'fake', 'offensive', 'other'])
        .withMessage('Invalid report reason'),
    body('details')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Details must be less than 500 characters'),
    validate
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
        .toInt(),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
        .withMessage('Invalid sort option'),
    query('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating filter must be between 1 and 5')
        .toInt(),
    query('verified')
        .optional()
        .isBoolean()
        .withMessage('Verified must be true or false')
        .toBoolean(),
    validate
];

// Get reviews for a specific product
router.get('/product/:productId', validateProductId, validatePagination, async (req, res) => {
    try {
        const { productId } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            sort = 'newest', 
            rating, 
            verified 
        } = req.query;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build query options
        const options = {
            page,
            limit,
            sort,
            ...(rating && { rating }),
            ...(verified !== undefined && { verified })
        };

        // Get reviews using the static method
        const reviews = await Review.findByProduct(productId, options)
            .populate('user', 'firstName lastName')
            .populate({
                path: 'response.respondedBy',
                select: 'firstName lastName role'
            });

        // Get total count for pagination
        const totalQuery = Review.find({ 
            product: productId, 
            status: 'approved' 
        });
        
        if (rating) totalQuery.where('rating').equals(rating);
        if (verified !== undefined) totalQuery.where('verifiedPurchase').equals(verified);
        
        const totalReviews = await totalQuery.countDocuments();

        // Get rating breakdown
        const ratingBreakdown = await Review.getProductRatingBreakdown(productId);
        const breakdown = ratingBreakdown[0] || {
            ratings: [],
            totalReviews: 0,
            averageRating: 0
        };

        // Format rating breakdown for frontend
        const formattedBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        breakdown.ratings.forEach(item => {
            formattedBreakdown[item.rating] = item.count;
        });

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    ...review.toObject(),
                    helpfulCount: review.helpful.length,
                    notHelpfulCount: review.notHelpful.length,
                    totalVotes: review.totalVotes,
                    helpfulnessScore: review.helpfulnessScore
                })),
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit),
                    hasMore: page * limit < totalReviews
                },
                summary: {
                    averageRating: breakdown.averageRating || 0,
                    totalReviews: breakdown.totalReviews || 0,
                    ratingBreakdown: formattedBreakdown
                }
            }
        });
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve reviews',
            error: error.message
        });
    }
});

// Create a new review
router.post('/', authenticate, validateReviewCreate, async (req, res) => {
    try {
        const { 
            productId, 
            rating, 
            title, 
            comment, 
            pros = [], 
            cons = [], 
            orderId 
        } = req.body;

        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: productId
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Validate order if provided
        let verifiedPurchase = false;
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                user: req.user._id,
                status: 'delivered',
                'items.product': productId
            });

            if (order) {
                verifiedPurchase = true;
            }
        }

        // Create review
        const review = new Review({
            user: req.user._id,
            product: productId,
            rating,
            title: title.trim(),
            comment: comment.trim(),
            pros: pros.filter(pro => pro.trim()),
            cons: cons.filter(con => con.trim()),
            ...(orderId && { order: orderId }),
            verifiedPurchase,
            verified: verifiedPurchase,
            status: 'pending' // Reviews need approval
        });

        await review.save();

        // Populate user data for response
        await review.populate('user', 'firstName lastName');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully and is pending approval',
            data: {
                ...review.toObject(),
                helpfulCount: 0,
                notHelpfulCount: 0,
                totalVotes: 0,
                helpfulnessScore: 0
            }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review',
            error: error.message
        });
    }
});

// Update a review (only by owner)
router.put('/:reviewId', authenticate, validateReviewId, validateReviewUpdate, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { title, comment, pros, cons } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews'
            });
        }

        // Check if review can be updated (not if it's been moderated)
        if (review.status === 'rejected' || review.moderatedAt) {
            return res.status(400).json({
                success: false,
                message: 'This review cannot be updated'
            });
        }

        // Update fields
        if (title !== undefined) review.title = title.trim();
        if (comment !== undefined) review.comment = comment.trim();
        if (pros !== undefined) review.pros = pros.filter(pro => pro.trim());
        if (cons !== undefined) review.cons = cons.filter(con => con.trim());

        // Reset status to pending if it was approved
        if (review.status === 'approved') {
            review.status = 'pending';
        }

        await review.save();
        await review.populate('user', 'firstName lastName');

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: {
                ...review.toObject(),
                helpfulCount: review.helpful.length,
                notHelpfulCount: review.notHelpful.length,
                totalVotes: review.totalVotes,
                helpfulnessScore: review.helpfulnessScore
            }
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
});

// Delete a review (only by owner)
router.delete('/:reviewId', authenticate, validateReviewId, async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
});

// Vote on review helpfulness
router.post('/:reviewId/helpful', authenticate, validateReviewId, validateHelpfulVote, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { helpful } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Users cannot vote on their own reviews
        if (review.user.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot vote on your own review'
            });
        }

        // Apply the vote
        if (helpful) {
            await review.markHelpful(req.user._id);
        } else {
            await review.markNotHelpful(req.user._id);
        }

        res.json({
            success: true,
            message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
            data: {
                helpfulCount: review.helpful.length,
                notHelpfulCount: review.notHelpful.length,
                totalVotes: review.totalVotes,
                helpfulnessScore: review.helpfulnessScore
            }
        });
    } catch (error) {
        console.error('Vote on review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to vote on review',
            error: error.message
        });
    }
});

// Report a review
router.post('/:reviewId/report', authenticate, validateReviewId, validateReportReview, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reason, details = '' } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Users cannot report their own reviews
        if (review.user.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot report your own review'
            });
        }

        try {
            await review.reportReview(req.user._id, reason, details);
            
            res.json({
                success: true,
                message: 'Review reported successfully. Thank you for helping maintain quality.'
            });
        } catch (error) {
            if (error.message.includes('already reported')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Report review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report review',
            error: error.message
        });
    }
});

// Get user's review history
router.get('/user/my-reviews', authenticate, validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.findByUser(req.user._id)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('product', 'name images price')
            .populate({
                path: 'response.respondedBy',
                select: 'firstName lastName role'
            });

        const totalReviews = await Review.countDocuments({ user: req.user._id });

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    ...review.toObject(),
                    helpfulCount: review.helpful.length,
                    notHelpfulCount: review.notHelpful.length,
                    totalVotes: review.totalVotes,
                    helpfulnessScore: review.helpfulnessScore
                })),
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit),
                    hasMore: page * limit < totalReviews
                }
            }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve your reviews',
            error: error.message
        });
    }
});

// Get review statistics for a product
router.get('/product/:productId/stats', validateProductId, async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get rating breakdown
        const ratingBreakdown = await Review.getProductRatingBreakdown(productId);
        const breakdown = ratingBreakdown[0] || {
            ratings: [],
            totalReviews: 0,
            averageRating: 0
        };

        // Format rating breakdown for frontend
        const formattedBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        breakdown.ratings.forEach(item => {
            formattedBreakdown[item.rating] = item.count;
        });

        // Get additional stats
        const verifiedReviewsCount = await Review.countDocuments({
            product: productId,
            status: 'approved',
            verifiedPurchase: true
        });

        res.json({
            success: true,
            data: {
                averageRating: breakdown.averageRating || 0,
                totalReviews: breakdown.totalReviews || 0,
                verifiedReviews: verifiedReviewsCount,
                ratingBreakdown: formattedBreakdown,
                verificationRate: breakdown.totalReviews > 0 
                    ? Math.round((verifiedReviewsCount / breakdown.totalReviews) * 100) 
                    : 0
            }
        });
    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve review statistics',
            error: error.message
        });
    }
});

export default router;