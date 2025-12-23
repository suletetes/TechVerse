# TechVerse API Documentation

## Overview

The TechVerse API is a RESTful API that provides comprehensive e-commerce functionality including user management, product catalog, shopping cart, order processing, and administrative features.

**Base URL:** `http://localhost:5000/api`

**Authentication:** Bearer Token (JWT)

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Products](#products)
4. [Search](#search)
5. [Cart & Wishlist](#cart--wishlist)
6. [Orders](#orders)
7. [Admin](#admin)
8. [Error Handling](#error-handling)

## Authentication

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Logout User
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Users

### Get User Profile
```http
GET /users/profile
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+44 20 1234 5678",
      "addresses": [],
      "paymentMethods": []
    }
  }
}
```

### Update User Profile
```http
PUT /users/profile
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+44 20 1234 5678",
  "dateOfBirth": "1990-01-01"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "Jonathan",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+44 20 1234 5678"
    }
  }
}
```

### Add User Address
```http
POST /users/addresses
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main Street",
  "city": "London",
  "postcode": "SW1A 1AA",
  "country": "United Kingdom",
  "type": "home"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "addresses": [
      {
        "_id": "address_id",
        "firstName": "John",
        "lastName": "Doe",
        "address": "123 Main Street",
        "city": "London",
        "postcode": "SW1A 1AA",
        "country": "United Kingdom",
        "type": "home",
        "isDefault": false
      }
    ]
  }
}
```

## Products

### Get All Products
```http
GET /products
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 50)
- `category` (string): Filter by category ID
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `brand` (string): Filter by brand
- `sortBy` (string): Sort field (price, name, createdAt, rating)
- `sortOrder` (string): Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Gaming Laptop",
        "description": "High-performance gaming laptop",
        "price": 1299.99,
        "comparePrice": 1499.99,
        "brand": "TechBrand",
        "category": {
          "_id": "category_id",
          "name": "Laptops",
          "slug": "laptops"
        },
        "images": [
          {
            "url": "laptop1.jpg",
            "isPrimary": true
          }
        ],
        "rating": {
          "average": 4.5,
          "count": 128
        },
        "stock": {
          "quantity": 15,
          "trackQuantity": true
        },
        "discountPercentage": 13.34,
        "stockStatus": "in_stock"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 95,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Product by ID
```http
GET /products/{product_id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "_id": "product_id",
      "name": "Gaming Laptop",
      "description": "High-performance gaming laptop with RTX graphics",
      "shortDescription": "Gaming laptop with RTX",
      "price": 1299.99,
      "comparePrice": 1499.99,
      "brand": "TechBrand",
      "sku": "LAPTOP-001",
      "category": {
        "_id": "category_id",
        "name": "Laptops",
        "slug": "laptops"
      },
      "images": [
        {
          "url": "laptop1.jpg",
          "isPrimary": true
        }
      ],
      "specifications": {
        "processor": "Intel i7",
        "memory": "16GB RAM",
        "storage": "512GB SSD"
      },
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "stock": {
        "quantity": 15,
        "trackQuantity": true,
        "lowStockThreshold": 5
      },
      "reviews": []
    }
  }
}
```

## Search

### Search Products
```http
GET /search/products
```

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category ID
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `brand` (string): Filter by brand
- `rating` (number): Minimum rating filter
- `inStock` (boolean): Filter by stock availability
- `sortBy` (string): Sort field (relevance, price, rating, newest, name, popularity)
- `sortOrder` (string): Sort order (asc, desc)
- `page` (number): Page number
- `limit` (number): Items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "products": [],
    "suggestions": ["gaming laptop", "gaming mouse"],
    "facets": {
      "brands": [
        {"_id": "TechBrand", "count": 15},
        {"_id": "GameBrand", "count": 8}
      ],
      "priceRanges": [
        {"_id": 100, "count": 5},
        {"_id": 500, "count": 12}
      ]
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalProducts": 25,
      "hasNext": true,
      "hasPrev": false
    },
    "searchQuery": {
      "q": "gaming",
      "minPrice": 100,
      "maxPrice": 2000
    }
  }
}
```

### Search Autocomplete
```http
GET /search/autocomplete?q={query}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {"type": "product", "text": "Gaming Laptop Pro"},
      {"type": "brand", "text": "GameBrand"},
      {"type": "category", "text": "Gaming"}
    ]
  }
}
```

### Get Search Filters
```http
GET /search/filters
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "priceRange": {
      "minPrice": 10,
      "maxPrice": 5000
    },
    "brands": ["TechBrand", "GameBrand", "ProBrand"],
    "categories": [
      {
        "_id": "category_id",
        "name": "Laptops",
        "slug": "laptops"
      }
    ],
    "ratings": [
      {"_id": 5, "count": 45},
      {"_id": 4, "count": 78}
    ]
  }
}
```

## Cart & Wishlist

### Get User Cart
```http
GET /users/cart
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "user": "user_id",
      "items": [
        {
          "_id": "item_id",
          "product": {
            "_id": "product_id",
            "name": "Gaming Laptop",
            "price": 1299.99,
            "images": [{"url": "laptop1.jpg", "isPrimary": true}]
          },
          "quantity": 2,
          "price": 1299.99
        }
      ],
      "totalItems": 2,
      "totalAmount": 2599.98
    }
  }
}
```

### Add Item to Cart
```http
POST /users/cart
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": {
      "_id": "cart_id",
      "items": [
        {
          "_id": "item_id",
          "product": {
            "_id": "product_id",
            "name": "Gaming Laptop"
          },
          "quantity": 2,
          "price": 1299.99
        }
      ]
    }
  }
}
```

### Update Cart Item
```http
PUT /users/cart/{item_id}
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove Item from Cart
```http
DELETE /users/cart/{item_id}
Authorization: Bearer {access_token}
```

### Clear Cart
```http
DELETE /users/cart
Authorization: Bearer {access_token}
```

### Get User Wishlist
```http
GET /users/wishlist
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "user": "user_id",
      "items": [
        {
          "_id": "item_id",
          "product": {
            "_id": "product_id",
            "name": "Gaming Laptop",
            "price": 1299.99,
            "images": [{"url": "laptop1.jpg", "isPrimary": true}]
          },
          "priceWhenAdded": 1299.99,
          "notes": "Want this for gaming",
          "addedAt": "2023-01-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

### Add Item to Wishlist
```http
POST /users/wishlist/{product_id}
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "notes": "Want this for gaming"
}
```

### Remove Item from Wishlist
```http
DELETE /users/wishlist/{product_id}
Authorization: Bearer {access_token}
```

## Orders

### Create Order
```http
POST /orders
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "items": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 1299.99
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA"
  },
  "paymentMethod": "payment_method_id",
  "totalAmount": 2599.98
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-001234",
      "user": "user_id",
      "items": [
        {
          "product": "product_id",
          "quantity": 2,
          "price": 1299.99
        }
      ],
      "totalAmount": 2599.98,
      "status": "pending",
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address": "123 Main Street",
        "city": "London",
        "postcode": "SW1A 1AA"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Get User Orders
```http
GET /orders
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by order status

**Response (200):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-001234",
        "totalAmount": 2599.98,
        "status": "pending",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "itemCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalOrders": 1
    }
  }
}
```

### Get Order by ID
```http
GET /orders/{order_id}
Authorization: Bearer {access_token}
```

## Admin

### Admin Authentication
All admin endpoints require authentication with an admin role:
```
Authorization: Bearer {admin_access_token}
```

### Get Dashboard Statistics
```http
GET /admin/dashboard
Authorization: Bearer {admin_access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalProducts": 450,
      "totalOrders": 2890,
      "totalRevenue": 125000.50,
      "newUsersToday": 15,
      "ordersToday": 45,
      "lowStockProducts": 8
    },
    "recentOrders": [],
    "topProducts": [],
    "userGrowth": []
  }
}
```

### Product Management

#### Get All Products (Admin)
```http
GET /admin/products
Authorization: Bearer {admin_access_token}
```

#### Create Product
```http
POST /admin/products
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "name": "New Gaming Laptop",
  "description": "Latest gaming laptop with RTX 4080",
  "price": 2499.99,
  "comparePrice": 2799.99,
  "category": "category_id",
  "brand": "TechPro",
  "status": "active",
  "visibility": "public",
  "stock": {
    "quantity": 10,
    "trackQuantity": true,
    "lowStockThreshold": 3
  }
}
```

#### Update Product
```http
PUT /admin/products/{product_id}
Authorization: Bearer {admin_access_token}
```

#### Delete Product (Soft Delete)
```http
DELETE /admin/products/{product_id}
Authorization: Bearer {admin_access_token}
```

### User Management

#### Get All Users
```http
GET /admin/users
Authorization: Bearer {admin_access_token}
```

#### Update User Status
```http
PUT /admin/users/{user_id}/status
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

### Order Management

#### Get All Orders
```http
GET /admin/orders
Authorization: Bearer {admin_access_token}
```

#### Update Order Status
```http
PUT /admin/orders/{order_id}/status
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Order shipped via DHL"
}
```

### Analytics

#### Get Comprehensive Analytics
```http
GET /admin/analytics/comprehensive
Authorization: Bearer {admin_access_token}
```

#### Get Real-time Metrics
```http
GET /admin/analytics/realtime
Authorization: Bearer {admin_access_token}
```

#### Get Inventory Analytics
```http
GET /admin/inventory/analytics
Authorization: Bearer {admin_access_token}
```

## Error Handling

### Error Response Format
All API errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": ["Detailed error messages"],
  "requestId": "unique_request_id"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Authentication token required
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `INSUFFICIENT_STOCK` - Not enough product stock
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
- Admin endpoints: 200 requests per 15 minutes per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```