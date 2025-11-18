# TechVerse E-commerce Platform

A full-stack e-commerce platform for tech products built with the MERN stack (MongoDB, Express.js, React, Node.js). Features a modern responsive interface, comprehensive admin dashboard, secure authentication, shopping cart, wishlist, order management, and payment integration.

## Features

### Customer Features
- User authentication and profile management (JWT + OAuth)
- Advanced product search with filters and autocomplete
- Shopping cart with persistent storage
- Wishlist functionality
- Order tracking and history
- Multiple payment methods (Stripe integration)
- Address management
- Product reviews and ratings
- Responsive mobile-first design

### Admin Features
- Comprehensive analytics dashboard
- Product management (CRUD operations)
- Dynamic variant builder for product options
- Order management and fulfillment
- User management
- Category and catalog management
- Homepage section management
- Inventory tracking with low stock alerts
- Security monitoring and session management

### Technical Features
- RESTful API architecture
- JWT authentication with refresh tokens
- Redis caching for performance
- File upload with Cloudinary/AWS S3
- Real-time updates with Socket.io
- Email notifications
- Rate limiting and security middleware
- Comprehensive error handling
- Unit and integration testing

## Technology Stack

### Backend
- Node.js 18+
- Express.js
- MongoDB with Mongoose ODM
- Redis for caching and sessions
- Passport.js (Local, Google OAuth, GitHub OAuth)
- JWT for authentication
- Multer + Cloudinary for file uploads
- Stripe for payments
- Winston for logging
- Jest + Supertest for testing

### Frontend
- React 18+ with Vite
- React Router DOM v7+
- Zustand for state management
- TanStack React Query for server state
- React Hook Form with Zod validation
- Radix UI components
- CSS Modules
- Vitest + React Testing Library
- MSW for API mocking

## Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- Redis 7.x or higher
- npm or yarn package manager

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/techverse-ecommerce.git
cd techverse-ecommerce
```

### 2. Install Dependencies
```bash
# Install all dependencies (both client and server)
npm run install:all

# Or install separately
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration

#### Backend Environment (.env in server directory)
```bash
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/techverse
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security
SESSION_SECRET=your-session-secret
CSRF_SECRET=your-csrf-secret
```

#### Frontend Environment (.env in client directory)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
```

### 4. Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# Start Redis (if running locally)
redis-server

# Seed the database with sample data
cd server
npm run seed
```

### 5. Start Development Servers
```bash
# Start both client and server concurrently (from root)
npm run dev

# Or start separately:

# Backend (from server directory)
cd server
npm run dev

# Frontend (from client directory)
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

## Available Scripts

### Root Level
```bash
npm run dev              # Start both client and server
npm run install:all      # Install all dependencies
npm run seed            # Seed database with sample data
```

### Backend (server directory)
```bash
npm start               # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run all tests
npm run test:unit      # Run unit tests only
npm run test:coverage  # Run tests with coverage
npm run seed           # Seed database
npm run seed:dev       # Seed with development data
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
```

### Frontend (client directory)
```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm test               # Run Vitest tests
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage
npm run test:unit      # Run unit tests
npm run test:integration # Run integration tests
```

## Project Structure

```
techverse-ecommerce/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── api/           # API services
│   │   ├── assets/        # Images, styles
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── tests/             # Test files
│   ├── scripts/           # Database scripts
│   └── package.json
├── docs/                  # Documentation
└── README.md
```

## API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/logout            # Logout user
POST   /api/auth/refresh-token     # Refresh access token
GET    /api/auth/me                # Get current user
PUT    /api/auth/profile           # Update profile
POST   /api/auth/change-password   # Change password
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
```

### Product Endpoints
```
GET    /api/products               # Get all products (with filters)
GET    /api/products/:id           # Get product by ID
GET    /api/products/slug/:slug    # Get product by slug
GET    /api/products/section/:name # Get products by section
POST   /api/products/search        # Search products
```

### Cart Endpoints
```
GET    /api/cart                   # Get user cart
POST   /api/cart/add/:productId    # Add item to cart
PUT    /api/cart/update/:itemId    # Update cart item
DELETE /api/cart/remove/:itemId    # Remove item from cart
DELETE /api/cart/clear             # Clear cart
```

### Order Endpoints
```
GET    /api/orders                 # Get user orders
GET    /api/orders/:id             # Get order by ID
POST   /api/orders                 # Create new order
PUT    /api/orders/:id/cancel      # Cancel order
```

### Wishlist Endpoints
```
GET    /api/wishlist               # Get user wishlist
POST   /api/wishlist/add/:productId # Add to wishlist
DELETE /api/wishlist/remove/:productId # Remove from wishlist
GET    /api/wishlist/check/:productId # Check if in wishlist
```

### Admin Endpoints
```
GET    /api/admin/dashboard        # Get dashboard stats
GET    /api/admin/products         # Get all products (admin)
POST   /api/admin/products         # Create product
PUT    /api/admin/products/:id     # Update product
DELETE /api/admin/products/:id     # Delete product
GET    /api/admin/orders           # Get all orders
PUT    /api/admin/orders/:id       # Update order status
GET    /api/admin/users            # Get all users
PUT    /api/admin/users/:id        # Update user
```

## Testing

### Backend Tests
```bash
cd server
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:coverage      # With coverage report
```

### Frontend Tests
```bash
cd client
npm test                   # Run all tests
npm run test:ui            # Interactive test UI
npm run test:coverage      # With coverage report
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

## Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# The build files will be in client/dist
```

### Environment Variables for Production
Ensure all production environment variables are set:
- Use strong secrets for JWT and session
- Configure production database URLs
- Set up production email service
- Configure production file storage
- Enable HTTPS
- Set appropriate CORS origins

### Deployment Options
- Docker containers
- Traditional VPS (Ubuntu/CentOS)
- Cloud platforms (AWS, Google Cloud, Azure)
- Platform-as-a-Service (Heroku, Railway, Render)

## Security

### Implemented Security Measures
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CSRF protection
- XSS protection with Helmet.js
- Input validation and sanitization
- SQL injection prevention
- Secure session management
- HTTPS enforcement in production
- Environment variable protection

## Performance Optimization

- Redis caching for frequently accessed data
- Database query optimization with indexes
- Image optimization and lazy loading
- Code splitting and lazy loading in React
- Compression middleware
- CDN integration for static assets
- Connection pooling for database
- Response caching strategies

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Redis Connection Error**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```




## Roadmap

### Planned Features
- Multi-vendor marketplace support
- Advanced analytics and reporting
- Mobile app (React Native)
- AI-powered product recommendations
- Multi-language support
- Advanced inventory management
- Subscription-based products
- Social media integration
- Live chat support
- Progressive Web App (PWA)




