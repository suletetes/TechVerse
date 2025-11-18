# Technology Stack & Build System

## Backend Stack
- **Runtime**: Node.js 18+ with ES modules (`"type": "module"`)
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session storage and performance optimization
- **Authentication**: JWT + Passport.js (local, Google OAuth, GitHub OAuth)
- **File Upload**: Multer + Cloudinary/AWS S3 integration
- **Security**: Helmet, CORS, rate limiting, input validation, CSRF protection
- **Monitoring**: Winston logging, Sentry error tracking, performance monitoring

## Frontend Stack
- **Framework**: React 18+ with functional components and hooks
- **Build Tool**: Vite for development and production builds
- **State Management**: Zustand + React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v7+
- **UI Components**: Radix UI primitives + custom components
- **Styling**: CSS modules with responsive design patterns
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest + React Testing Library + MSW for API mocking

## Development Tools
- **Package Manager**: npm (lockfiles committed)
- **Process Manager**: PM2 for production
- **Testing**: Jest (backend), Vitest (frontend), Supertest for API testing
- **Code Quality**: ESLint configuration, comprehensive test coverage required

## Common Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Start development servers (both client and server)
npm run dev

# Start individual services
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

### Testing
```bash
# Frontend tests
cd client && npm test              # Run all tests
cd client && npm run test:unit     # Unit tests only
cd client && npm run test:coverage # With coverage

# Backend tests  
cd server && npm test              # All tests
cd server && npm run test:unit     # Unit tests
cd server && npm run test:integration # Integration tests
cd server && npm run test:e2e      # End-to-end tests
```

### Database & Seeding
```bash
# Seed database with sample data
npm run seed        # Production seed
npm run seed:dev    # Development seed
```

### Build & Deployment
```bash
# Build frontend for production
npm run client:build

# Validate build configuration
cd client && npm run validate-build

# Deploy (uses deployment scripts)
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

## Environment Configuration
- Backend: `.env` files in `server/` directory
- Frontend: `.env` files in `client/` directory with `REACT_APP_` prefix
- Multiple environment support: development, staging, production
- Environment validation scripts included

## Architecture Patterns
- **API**: RESTful design with consistent response formats
- **Authentication**: JWT with refresh token rotation
- **Error Handling**: Centralized error middleware with structured responses
- **Validation**: Input validation on both client and server
- **Caching**: Redis for sessions, query results, and frequently accessed data
- **File Structure**: Feature-based organization with clear separation of concerns