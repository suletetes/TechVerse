# TechVerse API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... },
  "error": { ... } // Only present on errors
}
```

## Products API

### Get Latest Products
```
GET /products/latest?limit=10
```

### Get Top Sellers
```
GET /products/top-sellers?limit=10&timeframe=30
```

### Get Quick Picks
```
GET /products/quick-picks?limit=8
```

### Get Weekly Deals
```
GET /products/weekly-deals?limit=6
```

### Get All Products
```
GET /products?page=1&limit=20&sort=newest&category=smartphones
```

### Get Product by ID
```
GET /products/:id
```

## Admin API (Requires Admin Role)

### Get Homepage Sections
```
GET /admin/sections
```

### Update Homepage Section
```
PUT /admin/sections/:sectionType
Content-Type: application/json

{
  "mode": "manual|auto",
  "productIds": ["id1", "id2"],
  "autoConfig": {
    "limit": 10,
    "sortBy": "newest",
    "filters": {}
  }
}
```

### Get Dashboard Stats
```
GET /admin/dashboard
```

## Stores API

### Get All Stores
```
GET /stores
```

### Get Store by ID
```
GET /stores/:id
```

## Pages API

### Get All Pages
```
GET /pages
```

### Get Page by Slug
```
GET /pages/:slug
```