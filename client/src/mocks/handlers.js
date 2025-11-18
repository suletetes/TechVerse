import { http, HttpResponse } from 'msw';

// Mock API handlers for testing
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          _id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isEmailVerified: true
        },
        token: 'mock-jwt-token'
      }
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          _id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isEmailVerified: false
        }
      }
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }),

  // Products endpoints
  http.get('/api/products', () => {
    return HttpResponse.json({
      success: true,
      data: {
        products: [
          {
            _id: 'product-123',
            name: 'Test Product',
            slug: 'test-product',
            price: 999,
            comparePrice: 1199,
            rating: { average: 4.5, count: 128 },
            stock: { quantity: 50, trackQuantity: true },
            category: { _id: 'cat-123', name: 'Electronics', slug: 'electronics' },
            images: [{ url: '/test-image.jpg', alt: 'Test Product' }]
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProducts: 1
        }
      }
    });
  }),

  http.get('/api/products/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        product: {
          _id: params.id,
          name: 'Test Product',
          slug: 'test-product',
          description: 'This is a test product',
          price: 999,
          comparePrice: 1199,
          rating: { average: 4.5, count: 128 },
          stock: { quantity: 50, trackQuantity: true },
          category: { _id: 'cat-123', name: 'Electronics', slug: 'electronics' },
          images: [{ url: '/test-image.jpg', alt: 'Test Product' }],
          variants: [
            {
              name: 'Color',
              options: [
                { _id: 'color1', value: 'Black', stock: 25 },
                { _id: 'color2', value: 'White', stock: 25 }
              ]
            }
          ]
        }
      }
    });
  }),

  // Cart endpoints
  http.get('/api/cart', () => {
    return HttpResponse.json({
      success: true,
      data: {
        cart: {
          _id: 'cart-123',
          items: [],
          totalAmount: 0,
          itemCount: 0
        }
      }
    });
  }),

  http.post('/api/cart/add', () => {
    return HttpResponse.json({
      success: true,
      data: {
        cart: {
          _id: 'cart-123',
          items: [
            {
              _id: 'item-123',
              product: {
                _id: 'product-123',
                name: 'Test Product',
                price: 999
              },
              quantity: 1,
              totalPrice: 999
            }
          ],
          totalAmount: 999,
          itemCount: 1
        }
      }
    });
  }),

  // User endpoints
  http.get('/api/users/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          _id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isEmailVerified: true
        }
      }
    });
  }),

  // Admin endpoints
  http.get('/api/admin/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        metrics: {
          totalSales: 50000,
          totalOrders: 150,
          totalUsers: 500,
          totalProducts: 100
        },
        recentOrders: [],
        lowStockProducts: []
      }
    });
  }),

  // Reviews endpoints
  http.get('/api/reviews/product/:productId', () => {
    return HttpResponse.json({
      success: true,
      data: {
        reviews: [
          {
            _id: 'review-123',
            rating: 5,
            title: 'Great product!',
            comment: 'Really happy with this purchase.',
            user: { firstName: 'John', lastName: 'Doe' },
            createdAt: new Date().toISOString()
          }
        ],
        ratingBreakdown: {
          totalReviews: 128,
          averageRating: 4.5,
          ratings: [
            { rating: 5, count: 80 },
            { rating: 4, count: 30 },
            { rating: 3, count: 15 },
            { rating: 2, count: 2 },
            { rating: 1, count: 1 }
          ]
        }
      }
    });
  }),

  // Fallback handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { success: false, error: `Unhandled request: ${request.method} ${request.url}` },
      { status: 404 }
    );
  })
];