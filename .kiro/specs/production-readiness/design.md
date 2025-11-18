# Design Document

## Overview

This design document outlines the technical approach for preparing the TechVerse e-commerce application for production deployment. The solution focuses on nine key areas: environment-aware logging, centralized API configuration, notification system, AWS S3 file uploads, comprehensive testing, code quality improvements, documentation cleanup, performance optimization, and dead code removal.

The design follows a modular approach where each component can be implemented and tested independently while maintaining compatibility with the existing system. The implementation prioritizes backward compatibility during the transition period and ensures zero downtime for production deployments.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ API Config     │  │ Notification │  │ Components      │ │
│  │ Service        │  │ System       │  │ (No alerts)     │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│           │                  │                   │           │
│           └──────────────────┴───────────────────┘           │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │ HTTPS/REST
┌──────────────────────────────┼───────────────────────────────┐
│                     Backend (Node.js/Express)                │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Winston Logger │  │ Upload       │  │ Controllers     │ │
│  │ (Env-aware)    │  │ Service      │  │ & Routes        │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│           │                  │                   │           │
│           │         ┌────────┴────────┐          │           │
│           │         │                 │          │           │
│  ┌────────▼─────┐  ┌▼──────────┐  ┌──▼──────┐  │           │
│  │ File Logger  │  │ Local FS  │  │ AWS S3  │  │           │
│  │ (Errors)     │  │ (Dev)     │  │ (Prod)  │  │           │
│  └──────────────┘  └───────────┘  └─────────┘  │           │
│                                                  │           │
│  ┌──────────────────────────────────────────────▼─────────┐ │
│  │              MongoDB Database                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. Frontend components import API endpoints from centralized config
2. API calls go through axios interceptors for error handling
3. Backend receives requests and logs based on environment
4. Upload service routes to appropriate storage backend
5. Errors are logged to file and returned as structured responses
6. Frontend displays errors/success via notification system

## Components and Interfaces

### 1. Environment-Aware Logging System

#### Backend Logger Enhancement

**File**: `server/src/utils/logger.js` (enhance existing)

**Interface**:
```javascript
class Logger {
  constructor(options)
  
  // Core logging methods
  error(message, error, meta)
  warn(message, meta)
  info(message, meta)
  debug(message, meta)
  http(req, res, responseTime)
  
  // Specialized logging
  database(operation, details)
  security(event, details)
  performance(metric, value, meta)
  
  // Internal methods
  shouldLog(level): boolean
  formatLog(level, message, meta, error): object
}
```

**Configuration**:
- Production: Only error and warn levels to console, all errors to file
- Development: All levels to console with emoji and formatting
- File transport: `logs/error-%DATE%.log` with 14-day rotation
- JSON format for production, pretty format for development

**Winston Configuration**:
```javascript
const transports = [
  // Console transport (environment-aware)
  new winston.transports.Console({
    level: isProduction ? 'warn' : 'debug',
    format: isProduction ? jsonFormat : prettyFormat
  }),
  
  // File transport for errors (all environments)
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '14d',
    format: jsonFormat
  })
];
```

#### Frontend Console Suppression

**File**: `client/vite.config.js` (enhance existing)

**Configuration**:
```javascript
export default defineConfig({
  define: {
    'console.log': isProduction ? '(() => {})' : 'console.log',
    'console.debug': isProduction ? '(() => {})' : 'console.debug',
    'console.info': isProduction ? '(() => {})' : 'console.info'
  },
  esbuild: {
    drop: isProduction ? ['console', 'debugger'] : []
  }
});
```

### 2. Centralized API Configuration

#### API Configuration Service

**File**: `client/src/config/api.js` (new file)

**Interface**:
```javascript
// Environment detection
const getEnvironment = (): string

// Base URL resolution
const getApiBaseUrl = (): string

// API Configuration object
export const API_CONFIG = {
  BASE_URL: string,
  TIMEOUT: number,
  RETRY_ATTEMPTS: number,
  ENDPOINTS: {
    AUTH: { ... },
    PRODUCTS: { ... },
    ORDERS: { ... },
    ADMIN: { ... },
    UPLOAD: { ... },
    PAYMENTS: { ... },
    USERS: { ... },
    CART: { ... },
    WISHLIST: { ... },
    REVIEWS: { ... }
  }
}

// Helper functions
export const buildUrl = (endpoint: string, params?: object): string
export const getFullUrl = (path: string): string
```

**Environment Resolution**:
```javascript
const API_BASE_URLS = {
  development: 'http://localhost:5000/api',
  staging: process.env.VITE_API_URL_STAGING,
  production: process.env.VITE_API_URL_PRODUCTION
};

const getApiBaseUrl = () => {
  const env = import.meta.env.MODE || 'development';
  return import.meta.env.VITE_API_URL || API_BASE_URLS[env];
};
```

**Migration Strategy**:
1. Create centralized config with all endpoints
2. Update BaseApiService to use centralized config
3. Remove hardcoded URLs from all service files
4. Update direct fetch calls in admin components
5. Add validation to prevent hardcoded URLs in future

### 3. Notification System

#### Notification Component Architecture

**Files**:
- `client/src/components/Common/Notification.jsx` (new)
- `client/src/components/Common/Modal.jsx` (enhance existing)
- `client/src/hooks/useNotification.js` (new)
- `client/src/context/NotificationContext.jsx` (new)

**Notification Component Interface**:
```javascript
interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number; // Auto-dismiss after ms (default 5000)
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps>
```

**Notification Hook Interface**:
```javascript
const useNotification = () => ({
  showSuccess: (message, options?) => void,
  showError: (message, options?) => void,
  showWarning: (message, options?) => void,
  showInfo: (message, options?) => void,
  dismiss: (id) => void,
  dismissAll: () => void
});
```

**Modal Component Interface**:
```javascript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps>
```

**Implementation Details**:
- Use Radix UI Dialog for accessible modals
- Toast-style notifications positioned top-right
- Stack multiple notifications vertically
- Smooth enter/exit animations
- Keyboard navigation support (Escape to dismiss)
- Screen reader announcements

### 4. AWS S3 Upload Service

#### Upload Service Architecture

**File**: `server/src/services/uploadService.js` (new)

**Interface**:
```javascript
class UploadService {
  constructor()
  
  // Core upload methods
  uploadSingle(file, options): Promise<UploadResult>
  uploadMultiple(files, options): Promise<UploadResult[]>
  deleteFile(fileKey): Promise<void>
  
  // Storage backend methods
  uploadToS3(file, options): Promise<S3Result>
  uploadToLocal(file, options): Promise<LocalResult>
  
  // Helper methods
  getStorageBackend(): 's3' | 'local'
  generateFileName(originalName): string
  validateFile(file): ValidationResult
  getPublicUrl(fileKey): string
}

interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}
```

**AWS S3 Configuration**:
```javascript
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET,
  acl: 'public-read',
  signatureVersion: 'v4'
};

const s3Client = new AWS.S3(s3Config);
```

**Storage Backend Selection**:
```javascript
const getStorageBackend = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasS3Config = process.env.AWS_ACCESS_KEY_ID && 
                      process.env.AWS_S3_BUCKET;
  
  return (isProduction && hasS3Config) ? 's3' : 'local';
};
```

**File Organization**:
```
S3 Bucket Structure:
├── products/
│   ├── {productId}/
│   │   ├── primary-{timestamp}.webp
│   │   └── gallery-{timestamp}.webp
├── users/
│   └── avatars/
│       └── {userId}-{timestamp}.webp
├── reviews/
│   └── {reviewId}/
│       └── {timestamp}.webp
└── categories/
    └── {categoryId}-{timestamp}.webp
```

**Migration Strategy**:
1. Create new UploadService with dual backend support
2. Update upload routes to use new service
3. Add S3 credentials to production environment
4. Test uploads in staging environment
5. Deploy to production with S3 enabled
6. Existing local files remain accessible via static middleware

### 5. Comprehensive Test Suite

#### Backend Test Structure

**Directory Structure**:
```
server/tests/
├── unit/
│   ├── controllers/
│   │   ├── authController.test.js
│   │   ├── productController.test.js
│   │   ├── orderController.test.js
│   │   └── adminController.test.js
│   ├── services/
│   │   ├── uploadService.test.js
│   │   ├── emailService.test.js
│   │   └── paymentService.test.js
│   └── utils/
│       ├── logger.test.js
│       └── validation.test.js
├── integration/
│   ├── auth.test.js
│   ├── products.test.js
│   ├── orders.test.js
│   └── payments.test.js
└── setup/
    ├── testDb.js
    ├── fixtures.js
    └── helpers.js
```

**Test Configuration**:
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000
};
```

**Test Utilities**:
```javascript
// tests/setup/helpers.js
export const createTestUser = async (role = 'user')
export const generateAuthToken = (userId)
export const createTestProduct = async (overrides)
export const createTestOrder = async (userId, items)
export const cleanupTestData = async ()
```

#### Frontend Test Structure

**Directory Structure**:
```
client/src/
├── components/
│   └── __tests__/
│       ├── Auth/
│       │   ├── Login.test.jsx
│       │   └── Signup.test.jsx
│       ├── Common/
│       │   ├── Notification.test.jsx
│       │   └── Modal.test.jsx
│       └── integration/
│           ├── checkout.test.jsx
│           └── productBrowsing.test.jsx
├── hooks/
│   └── __tests__/
│       └── useNotification.test.js
└── utils/
    └── __tests__/
        └── api.test.js
```

**Test Configuration**:
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}'
      ]
    }
  }
});
```

### 6. Code Quality Improvements

#### Code Quality Standards

**Naming Conventions**:
- Components: PascalCase (e.g., `ProductCard.jsx`)
- Functions/Variables: camelCase (e.g., `getUserProfile`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Files: Match component name or use camelCase for utilities

**Code Organization**:
- Separate business logic from presentation
- Use custom hooks for reusable logic
- Keep components under 300 lines
- Extract complex logic into utility functions
- Use async/await consistently (no callback mixing)

**Import Organization**:
```javascript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal dependencies (absolute imports)
import { API_CONFIG } from '@/config/api';
import { useNotification } from '@/hooks/useNotification';

// 3. Relative imports
import ProductCard from './ProductCard';
import './styles.css';
```

**Cleanup Checklist**:
- Remove unused imports
- Remove commented-out code
- Remove TODO comments (convert to issues)
- Remove console.log statements
- Remove duplicate utility functions
- Consolidate similar components
- Remove unused dependencies from package.json

### 7. Documentation Cleanup

#### Emoji Removal Strategy

**Files to Process**:
- All `.md` files in `docs/` directory
- Root `README.md`
- `STRIPE_ARCHITECTURE.md`
- Any other markdown documentation

**Replacement Rules**:
```
[DONE] → [] or remove
[ERROR] → [] or remove
[WARNING] → WARNING: or **Note:**
[SECURE] → [Security] or **Security:**
[PACKAGE] → [Package] or remove
[LAUNCH] → [Deploy] or remove
[TIP] → [Tip] or **Tip:**
```

**Automated Processing**:
```javascript
// Script: scripts/removeEmojis.js
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

function removeEmojis(content) {
  return content.replace(emojiRegex, '');
}
```

### 8. Performance Optimization

#### Frontend Performance

**Code Splitting**:
```javascript
// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/product/:id" element={<ProductDetails />} />
  </Routes>
</Suspense>
```

**Image Optimization**:
```javascript
// Lazy loading
<img 
  src={imageUrl} 
  alt={altText}
  loading="lazy"
  decoding="async"
/>

// Responsive images
<img
  srcSet={`${image.small} 400w, ${image.medium} 800w, ${image.large} 1200w`}
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  src={image.medium}
  alt={altText}
/>
```

**Search Debouncing**:
```javascript
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

#### Backend Performance

**Response Caching**:
```javascript
// Cache frequently accessed data
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (data) => {
      redis.setex(key, duration, JSON.stringify(data));
      res.sendResponse(data);
    };
    
    next();
  };
};

// Apply to routes
router.get('/products', cacheMiddleware(600), getProducts);
router.get('/categories', cacheMiddleware(3600), getCategories);
```

**Build Optimization**:
```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    },
    sourcemap: false, // Disable in production
    chunkSizeWarningLimit: 1000
  }
});
```

### 9. Dead Code Removal

#### Detection Strategy

**Unused Exports Detection**:
```bash
# Use ts-prune or similar tool
npx ts-prune --project tsconfig.json

# Manual grep for exports
grep -r "export " client/src/ | grep -v "test"
```

**Unused Dependencies**:
```bash
# Use depcheck
npx depcheck

# Check for unused packages
npm prune
```

**Unused Files**:
- Files not imported anywhere
- Test files for deleted features
- Backup files (*.bak, *.old)
- Temporary files

**Consolidation Opportunities**:
- Duplicate utility functions across modules
- Similar components with minor differences
- Redundant API service methods

## Data Models

### Notification State Model

```javascript
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration: number;
  timestamp: number;
}
```

### Upload Result Model

```javascript
interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    originalName: string;
    uploadedAt: string;
    uploadedBy: string;
  };
}
```

### Logger Entry Model

```javascript
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'http';
  message: string;
  meta?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  requestId?: string;
}
```

## Error Handling

### Frontend Error Handling

**API Error Interceptor**:
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    const { showError } = useNotification();
    
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      showError(message);
    } else if (error.request) {
      // Request made but no response
      showError('Network error. Please check your connection.');
    } else {
      // Error in request setup
      showError('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);
```

**Component Error Boundaries**:
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Backend Error Handling

**Structured Error Responses**:
```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  
  // Log error
  logger.error(message, err, {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id
  });
  
  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**Upload Error Handling**:
```javascript
try {
  const result = await uploadService.uploadSingle(file, options);
  res.json({ success: true, data: result });
} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    throw new AppError('File size exceeds limit', 400, 'FILE_TOO_LARGE');
  } else if (error.code === 'INVALID_FILE_TYPE') {
    throw new AppError('Invalid file type', 400, 'INVALID_FILE_TYPE');
  } else if (error.code === 'S3_UPLOAD_FAILED') {
    logger.error('S3 upload failed', error);
    throw new AppError('Upload failed', 500, 'UPLOAD_FAILED');
  }
  throw error;
}
```

## Testing Strategy

### Unit Testing

**Backend Unit Tests**:
- Test individual controller methods with mocked dependencies
- Test service methods with mocked external APIs
- Test utility functions with various inputs
- Test middleware with mocked req/res objects

**Frontend Unit Tests**:
- Test components in isolation with mocked props
- Test custom hooks with renderHook
- Test utility functions with various inputs
- Test context providers with mocked values

### Integration Testing

**Backend Integration Tests**:
- Test complete API endpoints with test database
- Test authentication flow end-to-end
- Test file upload with mock S3
- Test payment processing with Stripe test mode

**Frontend Integration Tests**:
- Test user flows (login → browse → add to cart → checkout)
- Test form submissions with API mocking
- Test navigation and routing
- Test state management across components

### Test Data Management

**Test Database**:
```javascript
// tests/setup/testDb.js
export const setupTestDb = async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI);
  await mongoose.connection.dropDatabase();
};

export const teardownTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};
```

**Test Fixtures**:
```javascript
// tests/setup/fixtures.js
export const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#',
  firstName: 'Test',
  lastName: 'User'
};

export const testProduct = {
  name: 'Test Product',
  price: 99.99,
  category: 'Phones',
  status: 'active'
};
```

## Performance Considerations

### Frontend Performance Targets

- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- First contentful paint: < 1.5 seconds
- Lighthouse score: > 90

### Backend Performance Targets

- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- File upload time: < 5 seconds for 5MB file
- Concurrent requests: Support 1000 req/s

### Monitoring

**Frontend Monitoring**:
- Web Vitals tracking (LCP, FID, CLS)
- Error tracking with Sentry
- Performance API for custom metrics
- User session recording (optional)

**Backend Monitoring**:
- Request/response time tracking
- Error rate monitoring
- Database query performance
- Memory and CPU usage
- S3 upload success rate

## Security Considerations

### API Configuration Security

- Never commit API keys or secrets
- Use environment variables for all sensitive config
- Validate environment variables on startup
- Use different credentials for each environment

### Upload Security

- Validate file types and sizes
- Scan uploaded files for malware (optional)
- Use signed URLs for S3 access
- Implement rate limiting on upload endpoints
- Store files with random names to prevent enumeration

### Logging Security

- Never log sensitive data (passwords, tokens, credit cards)
- Sanitize user input before logging
- Restrict access to log files
- Rotate logs regularly
- Use structured logging for easier parsing

## Deployment Strategy

### Phase 1: Preparation (Week 1)

1. Create feature branch
2. Implement logging enhancements
3. Create API configuration service
4. Implement notification system
5. Create comprehensive test suite

### Phase 2: Core Features (Week 2)

1. Implement AWS S3 upload service
2. Remove hardcoded API URLs
3. Replace alert() calls with notifications
4. Clean up code and remove dead code
5. Run full test suite

### Phase 3: Optimization (Week 3)

1. Implement performance optimizations
2. Remove emojis from documentation
3. Optimize build configuration
4. Add monitoring and alerting
5. Load testing

### Phase 4: Deployment (Week 4)

1. Deploy to staging environment
2. Run smoke tests
3. Performance testing
4. Security audit
5. Deploy to production
6. Monitor for issues

### Rollback Plan

- Keep previous version deployed and ready
- Database migrations must be backward compatible
- Feature flags for new functionality
- Automated rollback on error threshold
- Manual rollback procedure documented

## Migration Considerations

### Backward Compatibility

- API configuration service provides fallback to environment variables
- Upload service supports both local and S3 simultaneously
- Existing local files remain accessible
- Logging changes don't affect existing log parsing

### Data Migration

- No database schema changes required
- Existing uploaded files don't need migration
- Can migrate files to S3 gradually using background job
- Old log files can be archived or deleted

### Testing Migration

- Run new tests alongside old tests initially
- Verify coverage meets or exceeds old tests
- Remove old tests only after new tests proven stable
- Keep test utilities for future use
