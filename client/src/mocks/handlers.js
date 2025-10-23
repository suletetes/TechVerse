import { http, HttpResponse } from 'msw';

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'admin@techverse.com',
    name: 'Admin User',
    role: 'admin',
    avatar: null,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'user@techverse.com',
    name: 'Regular User',
    role: 'user',
    avatar: null,
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

const mockProducts = [
  {
    id: '1',
    name: 'Tablet Air',
    category: 'Tablets',
    price: 1999,
    originalPrice: 2199,
    stock: 45,
    status: 'Active',
    sales: 234,
    image: '/img/tablet-product.jpg',
    featured: true,
    sku: 'TAB-001',
    description: 'Premium tablet with advanced features',
    specifications: {
      display: '12.9-inch Liquid Retina',
      processor: 'M2 chip',
      storage: '128GB',
      connectivity: 'Wi-Fi + Cellular'
    }
  },
  {
    id: '2',
    name: 'Phone Pro',
    category: 'Phones',
    price: 999,
    originalPrice: null,
    stock: 12,
    status: 'Low Stock',
    sales: 567,
    image: '/img/phone-product.jpg',
    featured: false,
    sku: 'PHN-002',
    description: 'Professional smartphone with advanced camera',
    specifications: {
      display: '6.7-inch Super Retina XDR',
      processor: 'A17 Pro chip',
      storage: '256GB',
      camera: 'Triple camera system'
    }
  },
  {
    id: '3',
    name: 'Ultra Laptop',
    category: 'Laptops',
    price: 2599,
    originalPrice: null,
    stock: 0,
    status: 'Out of Stock',
    sales: 123,
    image: '/img/laptop-product.jpg',
    featured: true,
    sku: 'LAP-003',
    description: 'High-performance laptop for professionals',
    specifications: {
      display: '16-inch Retina',
      processor: 'Intel Core i9',
      memory: '32GB RAM',
      storage: '1TB SSD'
    }
  }
];

const mockOrders = [
  {
    id: 'TV-2024-001234',
    customer: 'John Smith',
    email: 'john.smith@email.com',
    date: '2024-01-15',
    status: 'Processing',
    total: 2999.00,
    items: 2,
    paymentMethod: 'Credit Card',
    shippingAddress: '123 Main St, London, UK',
    products: [
      { ...mockProducts[0], quantity: 1 },
      { ...mockProducts[1], quantity: 1 }
    ]
  },
  {
    id: 'TV-2024-001233',
    customer: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    date: '2024-01-15',
    status: 'Shipped',
    total: 1299.00,
    items: 1,
    paymentMethod: 'PayPal',
    shippingAddress: '456 Oak Ave, Manchester, UK',
    products: [
      { ...mockProducts[1], quantity: 1 }
    ]
  }
];

const mockCategories = [
  { id: '1', name: 'Tablets', slug: 'tablets', productCount: 15 },
  { id: '2', name: 'Phones', slug: 'phones', productCount: 25 },
  { id: '3', name: 'Laptops', slug: 'laptops', productCount: 18 },
  { id: '4', name: 'TVs', slug: 'tvs', productCount: 12 },
  { id: '5', name: 'Headphones', slug: 'headphones', productCount: 30 }
];

// Helper functions
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = array.slice(startIndex, endIndex);
  
  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: array.length,
      pages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
};

const filterProducts = (products, filters = {}) => {
  let filtered = [...products];
  
  if (filters.category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
  }
  
  if (filters.status) {
    filtered = filtered.filter(p => p.status.toLowerCase() === filters.status.toLowerCase());
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }
  
  if (filters.minPrice) {
    filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
  }
  
  if (filters.maxPrice) {
    filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
  }
  
  return filtered;
};

// MSW Handlers
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500); // Simulate network delay
    
    const { email, password } = await request.json();
    
    if (email === 'admin@techverse.com' && password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token-admin',
          refreshToken: 'mock-refresh-token-admin'
        }
      });
    }
    
    if (email === 'user@techverse.com' && password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsers[1],
          token: 'mock-jwt-token-user',
          refreshToken: 'mock-refresh-token-user'
        }
      });
    }
    
    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid credentials'
      },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(500);
    
    const { email, password, name } = await request.json();
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User already exists'
        },
        { status: 409 }
      );
    }
    
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      name,
      role: 'user',
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    return HttpResponse.json({
      success: true,
      data: {
        user: newUser,
        token: 'mock-jwt-token-new-user',
        refreshToken: 'mock-refresh-token-new-user'
      }
    });
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    await delay(200);
    
    const { refreshToken } = await request.json();
    
    if (refreshToken && refreshToken.startsWith('mock-refresh-token')) {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token-refreshed',
          refreshToken: 'mock-refresh-token-refreshed'
        }
      });
    }
    
    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid refresh token'
      },
      { status: 401 }
    );
  }),

  http.post('/api/auth/logout', async () => {
    await delay(200);
    
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }),

  // Products endpoints
  http.get('/api/products', async ({ request }) => {
    await delay(300);
    
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || 1;
    const limit = url.searchParams.get('limit') || 10;
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    
    const filters = { category, status, search, minPrice, maxPrice };
    const filteredProducts = filterProducts(mockProducts, filters);
    const result = paginate(filteredProducts, page, limit);
    
    return HttpResponse.json({
      success: true,
      data: result
    });
  }),

  http.get('/api/products/:id', async ({ params }) => {
    await delay(200);
    
    const product = mockProducts.find(p => p.id === params.id);
    
    if (!product) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: product
    });
  }),

  http.post('/api/products', async ({ request }) => {
    await delay(500);
    
    const productData = await request.json();
    
    const newProduct = {
      id: String(mockProducts.length + 1),
      ...productData,
      sales: 0,
      createdAt: new Date().toISOString()
    };
    
    mockProducts.push(newProduct);
    
    return HttpResponse.json({
      success: true,
      data: newProduct
    }, { status: 201 });
  }),

  http.put('/api/products/:id', async ({ params, request }) => {
    await delay(400);
    
    const productIndex = mockProducts.findIndex(p => p.id === params.id);
    
    if (productIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    const updates = await request.json();
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json({
      success: true,
      data: mockProducts[productIndex]
    });
  }),

  http.delete('/api/products/:id', async ({ params }) => {
    await delay(300);
    
    const productIndex = mockProducts.findIndex(p => p.id === params.id);
    
    if (productIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    mockProducts.splice(productIndex, 1);
    
    return HttpResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  }),

  // Orders endpoints
  http.get('/api/orders', async ({ request }) => {
    await delay(300);
    
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || 1;
    const limit = url.searchParams.get('limit') || 10;
    const status = url.searchParams.get('status');
    
    let filteredOrders = [...mockOrders];
    
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(o => 
        o.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    const result = paginate(filteredOrders, page, limit);
    
    return HttpResponse.json({
      success: true,
      data: result
    });
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(200);
    
    const order = mockOrders.find(o => o.id === params.id);
    
    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: order
    });
  }),

  http.put('/api/orders/:id/status', async ({ params, request }) => {
    await delay(400);
    
    const orderIndex = mockOrders.findIndex(o => o.id === params.id);
    
    if (orderIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }
    
    const { status } = await request.json();
    mockOrders[orderIndex].status = status;
    mockOrders[orderIndex].updatedAt = new Date().toISOString();
    
    return HttpResponse.json({
      success: true,
      data: mockOrders[orderIndex]
    });
  }),

  // Categories endpoints
  http.get('/api/categories', async () => {
    await delay(200);
    
    return HttpResponse.json({
      success: true,
      data: mockCategories
    });
  }),

  // User endpoints
  http.get('/api/users/profile', async ({ request }) => {
    await delay(200);
    
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token.includes('admin')) {
      return HttpResponse.json({
        success: true,
        data: mockUsers[0]
      });
    }
    
    if (token.includes('user')) {
      return HttpResponse.json({
        success: true,
        data: mockUsers[1]
      });
    }
    
    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid token'
      },
      { status: 401 }
    );
  }),

  // Admin endpoints
  http.get('/api/admin/stats', async () => {
    await delay(300);
    
    return HttpResponse.json({
      success: true,
      data: {
        totalProducts: mockProducts.length,
        totalOrders: mockOrders.length,
        totalUsers: mockUsers.length,
        revenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
        lowStockProducts: mockProducts.filter(p => p.stock <= 10).length,
        recentOrders: mockOrders.slice(0, 5)
      }
    });
  }),

  // Error simulation endpoints
  http.get('/api/test/error', () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Simulated server error'
      },
      { status: 500 }
    );
  }),

  http.get('/api/test/timeout', async () => {
    await delay(10000); // 10 second delay to simulate timeout
    
    return HttpResponse.json({
      success: true,
      data: 'This should timeout'
    });
  }),

  // Fallback handler for unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    
    return HttpResponse.json(
      {
        success: false,
        error: `Unhandled request: ${request.method} ${request.url}`
      },
      { status: 404 }
    );
  })
];

export default handlers;