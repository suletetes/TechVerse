# TechVerse E-commerce Platform - API Documentation

## Overview

This document provides comprehensive documentation for the TechVerse E-commerce Platform REST API. The API follows RESTful principles and returns JSON responses.

**Base URL**: `http://localhost:3001/api`  
**Version**: 1.0  
**Authentication**: JWT Bearer Token  

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Cart Management](#cart-management)
5. [Wishlist](#wishlist)
6. [Orders](#orders)
7. [Reviews](#reviews)
8. [User Management](#user-management)
9. [Admin Endpoints](#admin-endpoints)
10. [File Upload](#file-upload)
11. [Error Handling](#error-handling)

---

## Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "isEmailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/logout
Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Products

### GET /products
Get paginated list of products with filtering and sorting.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category slug
- `search` (string): Search in product name and description
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `brand` (string): Filter by brand
- `rating` (number): Minimum rating filter
- `sort` (string): Sort field (name, price, rating, createdAt)
- `order` (string): Sort order (asc, desc)
- `inStock` (boolean): Filter by stock availability

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "iPhone 15 Pro",
        "slug": "iphone-15-pro",
        "description": "The most advanced iPhone yet",
        "price": 999,
        "comparePrice": 1199,
        "discountPercentage": 17,
        "images": [
          {
            "url": "/images/iphone-15-pro-1.jpg",
            "webp": "/images/iphone-15-pro-1.webp",
            "alt": "iPhone 15 Pro Front View",
            "isPrimary": true
          }
        ],
        "rating": {
          "average": 4.5,
          "count": 128
        },
        "stock": {
          "quantity": 50,
          "trackQuantity": true,
          "lowStockThreshold": 10
        },
        "category": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Smartphones",
          "slug": "smartphones"
        },
        "brand": "Apple",
        "status": "active",
        "featured": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 100,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    }
  }
}
```

### GET /products/:id
Get detailed product information by ID or slug.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "description": "The most advanced iPhone yet with titanium design",
      "price": 999,
      "comparePrice": 1199,
      "variants": [
        {
          "name": "Color",
          "options": [
            {
              "_id": "color1",
              "value": "Natural Titanium",
              "stock": 25,
              "priceModifier": 0
            }
          ]
        }
      ],
      "specifications": {
        "Display & Design": [
          {
            "label": "Display Size",
            "value": "6.1-inch Super Retina XDR",
            "highlight": true
          }
        ]
      },
      "features": [
        "Action Button",
        "Dynamic Island"
      ],
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "stock": {
        "quantity": 50,
        "trackQuantity": true
      }
    }
  }
}
```

---

## Cart Management

### GET /cart
Get current user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "507f1f77bcf86cd799439014",
      "user": "507f1f77bcf86cd799439011",
      "items": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "product": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "iPhone 15 Pro",
            "price": 999
          },
          "quantity": 2,
          "selectedVariants": {
            "color": "Natural Titanium",
            "storage": "256GB"
          },
          "unitPrice": 1099,
          "totalPrice": 2198
        }
      ],
      "summary": {
        "itemCount": 2,
        "subtotal": 2198,
        "tax": 175.84,
        "shipping": 0,
        "total": 2373.84
      }
    }
  }
}
```

### POST /cart/add
Add item to cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "selectedVariants": {
    "color": "Natural Titanium",
    "storage": "256GB"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": {
      "summary": {
        "itemCount": 2,
        "total": 2373.84
      }
    }
  }
}
```

---

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

---

This documentation covers the major API endpoints for the TechVerse E-commerce Platform.