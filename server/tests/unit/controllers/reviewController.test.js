import { jest } from '@jest/globals';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  getUserReviews
} from '../../../src/controllers/reviewController.js';
import { Review, Product, Order } from '../../../src/models/index.js';

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
      mockReq.params = { productId: 'product123' };
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return paginated product reviews', async () => {
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
          title: 'Great product!',
          comment: 'Really love this product',
          isVerifiedPurchase: true,
          helpfulCount: 5,
          createdAt: new Date()
        },
        {
          _id: 'review2',
          user: {
            _id: 'user2',
            firstName: 'Jane',
            lastName: 'Smith'
          },
          product: 'product123',
          rating: 4,
          title: 'Good value',
          comment: 'Good product for the price',
          isVerifiedPurchase: false,
          helpfulCount: 2,
          createdAt: new Date()
        }
      ];

      const mockCountDocuments = jest.fn().mockResolvedValue(25);
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockReviews)
            })
          })
        })
      });

      Review.countDocuments = mockCountDocuments;
      Review.find = mockFind;

      await getProductReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({
        product: 'product123',
        isApproved: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product reviews retrieved successfully',
        data: {
          reviews: mockReviews,
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalReviews: 25,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });
    });

    it('should filter reviews by rating', async () => {
      mockReq.query.rating = '5';

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Review.countDocuments = jest.fn().mockResolvedValue(0);
      Review.find = mockFind;

      await getProductReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({
        product: 'product123',
        isApproved: true,
        rating: 5
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Review.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(error)
            })
          })
        })
      });

      await getProductReviews(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createReview', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123',
        rating: 5,
        title: 'Great product!',
        comment: 'Really love this product',
        pros: ['Great quality', 'Fast delivery'],
        cons: ['A bit expensive']
      };
    });

    it('should create a new review successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        rating: { average: 4.2, count: 10 },
        save: jest.fn().mockResolvedValue(true)
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
        title: 'Great product!',
        comment: 'Really love this product',
        pros: ['Great quality', 'Fast delivery'],
        cons: ['A bit expensive'],
        isVerifiedPurchase: true,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          user: { firstName: 'John', lastName: 'Doe' }
        })
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Order.findOne = jest.fn().mockResolvedValue(mockOrder);
      Review.findOne = jest.fn().mockResolvedValue(null);
      Review.mockImplementation(() => mockReview);

      await createReview(mockReq, mockRes, mockNext);

      expect(mockReview.save).toHaveBeenCalled();
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Review created successfully'
        })
      );
    });

    it('should reject if product not found', async () => {
      Product.findById = jest.fn().mockResolvedValue(null);

      await createReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          statusCode: 404
        })
      );
    });

    it('should reject duplicate review from same user', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product'
      };

      const existingReview = {
        _id: 'existing123',
        user: 'user123',
        product: 'product123'
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Review.findOne = jest.fn().mockResolvedValue(existingReview);

      await createReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You have already reviewed this product',
          statusCode: 400
        })
      );
    });

    it('should handle invalid rating', async () => {
      mockReq.body.rating = 6; // Invalid rating

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product'
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Review.findOne = jest.fn().mockResolvedValue(null);

      await createReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Rating must be between 1 and 5',
          statusCode: 400
        })
      );
    });
  });

  describe('updateReview', () => {
    beforeEach(() => {
      mockReq.params = { reviewId: 'review123' };
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
        product: 'product123',
        rating: 5,
        title: 'Original title',
        comment: 'Original comment',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          user: { firstName: 'John', lastName: 'Doe' }
        })
      };

      const mockProduct = {
        _id: 'product123',
        rating: { average: 4.2, count: 10 },
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      await updateReview(mockReq, mockRes, mockNext);

      expect(mockReview.rating).toBe(4);
      expect(mockReview.title).toBe('Updated title');
      expect(mockReview.comment).toBe('Updated comment');
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if review not found', async () => {
      Review.findById = jest.fn().mockResolvedValue(null);

      await updateReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Review not found',
          statusCode: 404
        })
      );
    });

    it('should reject if user is not the review owner', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        product: 'product123'
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await updateReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this review',
          statusCode: 403
        })
      );
    });
  });

  describe('deleteReview', () => {
    beforeEach(() => {
      mockReq.params = { reviewId: 'review123' };
    });

    it('should delete review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        product: 'product123',
        rating: 5,
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      const mockProduct = {
        _id: 'product123',
        rating: { average: 4.2, count: 10 },
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      await deleteReview(mockReq, mockRes, mockNext);

      expect(mockReview.deleteOne).toHaveBeenCalled();
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review deleted successfully'
      });
    });

    it('should reject if review not found', async () => {
      Review.findById = jest.fn().mockResolvedValue(null);

      await deleteReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Review not found',
          statusCode: 404
        })
      );
    });

    it('should reject if user is not the review owner', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        product: 'product123'
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await deleteReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to delete this review',
          statusCode: 403
        })
      );
    });
  });

  describe('markReviewHelpful', () => {
    beforeEach(() => {
      mockReq.params = { reviewId: 'review123' };
    });

    it('should mark review as helpful', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        helpfulVotes: [],
        helpfulCount: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await markReviewHelpful(mockReq, mockRes, mockNext);

      expect(mockReview.helpfulVotes).toContain('user123');
      expect(mockReview.helpfulCount).toBe(1);
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should remove helpful vote if already voted', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        helpfulVotes: ['user123'],
        helpfulCount: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await markReviewHelpful(mockReq, mockRes, mockNext);

      expect(mockReview.helpfulVotes).not.toContain('user123');
      expect(mockReview.helpfulCount).toBe(0);
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should reject if user tries to vote on own review', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'user123',
        helpfulVotes: [],
        helpfulCount: 0
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await markReviewHelpful(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot vote on your own review',
          statusCode: 400
        })
      );
    });
  });

  describe('reportReview', () => {
    beforeEach(() => {
      mockReq.params = { reviewId: 'review123' };
      mockReq.body = {
        reason: 'inappropriate',
        details: 'Contains offensive language'
      };
    });

    it('should report review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        reports: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await reportReview(mockReq, mockRes, mockNext);

      expect(mockReview.reports).toHaveLength(1);
      expect(mockReview.reports[0]).toMatchObject({
        reportedBy: 'user123',
        reason: 'inappropriate',
        details: 'Contains offensive language'
      });
      expect(mockReview.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject duplicate report from same user', async () => {
      const mockReview = {
        _id: 'review123',
        user: 'otheruser123',
        reports: [
          {
            reportedBy: 'user123',
            reason: 'spam',
            reportedAt: new Date()
          }
        ]
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await reportReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You have already reported this review',
          statusCode: 400
        })
      );
    });
  });

  describe('getUserReviews', () => {
    beforeEach(() => {
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return user reviews with pagination', async () => {
      const mockReviews = [
        {
          _id: 'review1',
          user: 'user123',
          product: {
            _id: 'product1',
            name: 'Product 1',
            images: [{ url: 'product1.jpg' }]
          },
          rating: 5,
          title: 'Great product!',
          createdAt: new Date()
        }
      ];

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockReviews)
            })
          })
        })
      });

      Review.countDocuments = jest.fn().mockResolvedValue(5);
      Review.find = mockFind;

      await getUserReviews(mockReq, mockRes, mockNext);

      expect(Review.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User reviews retrieved successfully',
        data: {
          reviews: mockReviews,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalReviews: 5,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    });
  });
});