import { jest } from '@jest/globals';
import { reviewController } from '../../../src/controllers/reviewController.js';
import { Review, Product, User, Order } from '../../../src/models/index.js';

// Mock the models
jest.mock('../../../src/models/index.js');

describe('Review Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'user123' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getProductReviews', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return product reviews successfully', async () => {
      const mockReviews = [
        {
          _id: 'review1',
          user: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe'
          },
          product: 'product123',
          rating: 5,
          title: 'Great product',
          comment: 'Really love this product',
          createdAt: new Date(),
          helpfulVotes: 5,
          isVerifiedPurchase: true
        }
      ];

      const mockPagination = {
        totalReviews: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReviews)
      });

      Review.countDocuments.mockResolvedValue(1);

      await reviewController.getProductReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({ 
        product: 'product123',
        status: 'approved'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviews: mockReviews,
          pagination: mockPagination
        }
      });
    });

    it('should filter reviews by rating', async () => {
      mockReq.query.rating = '5';

      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Review.countDocuments.mockResolvedValue(0);

      await reviewController.getProductReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({ 
        product: 'product123',
        status: 'approved',
        rating: 5
      });
    });

    it('should sort reviews by different criteria', async () => {
      mockReq.query.sortBy = 'helpful';

      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Review.countDocuments.mockResolvedValue(0);

      await reviewController.getProductReviews(mockReq, mockRes, mockNext);

      expect(Review.find().sort).toHaveBeenCalledWith({ helpfulVotes: -1, createdAt: -1 });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      await reviewController.getProductReviews(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createReview', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123',
        rating: 5,
        title: 'Great product',
        comment: 'Really love this product'
      };
    });

    it('should create review successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        status: 'active'
      };

      const mockOrder = {
        _id: 'order123',
        user: 'user123',
        items: [{ product: 'product123' }],
        status: 'delivered'
      };

      const mockReview = {
        _id: 'review123',
        user: 'user123',
        product: 'product123',
        rating: 5,
        title: 'Great product',
        comment: 'Really love this product',
        isVerifiedPurchase: true,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          user: { firstName: 'John', lastName: 'Doe' },
          product: mockProduct
        })
      };

      Product.findById.mockResolvedValue(mockProduct);
      Order.findOne.mockResolvedValue(mockOrder);
      Review.findOne.mockResolvedValue(null); // No existing review
      Review.prototype.save = jest.fn().mockResolvedValue(mockReview);
      Review.prototype.populate = jest.fn().mockResolvedValue(mockReview);

      await reviewController.createReview(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(Order.findOne).toHaveBeenCalledWith({
        user: 'user123',
        'items.product': 'product123',
        status: { $in: ['delivered', 'completed'] }
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should reject if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await reviewController.createReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should reject if user already reviewed product', async () => {
      const mockProduct = {
        _id: 'product123',
        status: 'active'
      };

      const mockExistingReview = {
        _id: 'existing123',
        user: 'user123',
        product: 'product123'
      };

      Product.findById.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(mockExistingReview);

      await reviewController.createReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You have already reviewed this product'
      });
    });

    it('should validate rating range', async () => {
      mockReq.body.rating = 6; // Invalid rating

      await reviewController.createReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = { productId: 'product123' }; // Missing rating

      await reviewController.createReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Rating is required'
      });
    });
  });

  describe('updateReview', () => {
    beforeEach(() => {
      mockReq.params.reviewId = 'review123';
      mockReq.body = {
        rating: 4,
        title: 'Updated title',
        comment: 'Updated comment'
      };
    });

    it('should update review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        rating: 5,
        title: 'Original title',
        comment: 'Original comment',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          user: { firstName: 'John', lastName: 'Doe' }
        })
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.updateReview(mockReq, mockRes, mockNext);

      expect(mockReview.rating).toBe(4);
      expect(mockReview.title).toBe('Updated title');
      expect(mockReview.comment).toBe('Updated comment');
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if review not found', async () => {
      Review.findById.mockResolvedValue(null);

      await reviewController.updateReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Review not found'
      });
    });

    it('should reject if user is not review owner', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123'
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.updateReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You can only update your own reviews'
      });
    });
  });

  describe('deleteReview', () => {
    beforeEach(() => {
      mockReq.params.reviewId = 'review123';
    });

    it('should delete review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      expect(mockReview.deleteOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review deleted successfully'
      });
    });

    it('should reject if review not found', async () => {
      Review.findById.mockResolvedValue(null);

      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Review not found'
      });
    });

    it('should reject if user is not review owner', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123'
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.deleteReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You can only delete your own reviews'
      });
    });
  });

  describe('voteHelpful', () => {
    beforeEach(() => {
      mockReq.params.reviewId = 'review123';
    });

    it('should add helpful vote successfully', async () => {
      const mockReview = {
        _id: 'review123',
        helpfulVotes: 5,
        helpfulVoters: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.voteHelpful(mockReq, mockRes, mockNext);

      expect(mockReview.helpfulVotes).toBe(6);
      expect(mockReview.helpfulVoters).toContain('user123');
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should remove helpful vote if already voted', async () => {
      const mockReview = {
        _id: 'review123',
        helpfulVotes: 5,
        helpfulVoters: ['user123'],
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.voteHelpful(mockReq, mockRes, mockNext);

      expect(mockReview.helpfulVotes).toBe(4);
      expect(mockReview.helpfulVoters).not.toContain('user123');
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should reject if review not found', async () => {
      Review.findById.mockResolvedValue(null);

      await reviewController.voteHelpful(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Review not found'
      });
    });
  });

  describe('reportReview', () => {
    beforeEach(() => {
      mockReq.params.reviewId = 'review123';
      mockReq.body = {
        reason: 'inappropriate',
        description: 'Contains offensive language'
      };
    });

    it('should report review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        reports: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.reportReview(mockReq, mockRes, mockNext);

      expect(mockReview.reports).toHaveLength(1);
      expect(mockReview.reports[0].reportedBy).toBe('user123');
      expect(mockReview.reports[0].reason).toBe('inappropriate');
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if user already reported review', async () => {
      const mockReview = {
        _id: 'review123',
        reports: [{ reportedBy: 'user123', reason: 'spam' }]
      };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.reportReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'You have already reported this review'
      });
    });

    it('should validate report reason', async () => {
      mockReq.body.reason = 'invalid-reason';

      await reviewController.reportReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid report reason'
      });
    });
  });

  describe('getUserReviews', () => {
    it('should return user reviews successfully', async () => {
      const mockReviews = [
        {
          _id: 'review1',
          product: {
            _id: 'product1',
            name: 'Product 1',
            images: [{ url: 'image1.jpg', isPrimary: true }]
          },
          rating: 5,
          title: 'Great product',
          createdAt: new Date()
        }
      ];

      Review.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReviews)
      });

      Review.countDocuments.mockResolvedValue(1);

      await reviewController.getUserReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reviews: mockReviews,
          pagination: expect.any(Object)
        }
      });
    });
  });
});