# Implementation Plan

- [ ] 1. Enhance environment-aware logging system
  - Enhance Winston logger configuration in `server/src/utils/logger.js` to support production and development modes with appropriate log levels (error/warn for production, all levels for development)
  - Add DailyRotateFile transport for error logs with 14-day retention in `logs/` directory
  - Update logger to output JSON format in production and pretty format with emojis in development
  - Configure Vite build to strip console.log statements in production builds via `client/vite.config.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Create centralized API configuration service
  - Create `client/src/config/api.js` with environment-aware base URL resolution and all API endpoint definitions organized by feature domain
  - Update `client/src/api/core/BaseApiService.js` to import and use centralized API configuration
  - Remove hardcoded localhost:5000 URLs from all service files in `client/src/api/services/`
  - Replace direct fetch calls with hardcoded URLs in admin components (`AdminProductsNew.jsx`, `AdminUsersNew.jsx`, `AdminOrdersNew.jsx`)
  - Update `client/src/utils/csrfUtils.js` and `client/src/pages/Product.jsx` to use centralized config
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Implement notification system
- [ ] 3.1 Create notification components and context
  - Create `client/src/components/Common/Notification.jsx` component using Radix UI with support for success, error, warning, and info types
  - Create `client/src/context/NotificationContext.jsx` to manage notification state with add, remove, and clear methods
  - Create `client/src/hooks/useNotification.js` hook with showSuccess, showError, showWarning, showInfo, and dismiss methods
  - Add notification container to `client/src/App.jsx` to render notifications in top-right corner with stacking
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 3.2 Enhance modal component
  - Enhance existing `client/src/components/Common/Modal.jsx` with size variants, closeOnOverlayClick, and keyboard navigation
  - Add confirmation modal variant with action buttons for user confirmations
  - _Requirements: 3.4_

- [ ] 3.3 Integrate notification system into API error handling
  - Update axios interceptors in API services to use notification system instead of console errors
  - Add error boundary component that uses notification system for React errors
  - _Requirements: 3.2, 3.3_

- [ ] 4. Implement AWS S3 upload service
- [ ] 4.1 Create upload service with dual backend support
  - Create `server/src/services/uploadService.js` with UploadService class supporting both S3 and local storage
  - Implement environment-based storage backend selection (S3 for production with credentials, local for development)
  - Add AWS S3 client configuration with credentials from environment variables
  - Implement uploadSingle and uploadMultiple methods that route to appropriate backend
  - Implement deleteFile method for both S3 and local storage
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 4.2 Update upload routes and controllers
  - Update `server/src/routes/upload.js` to use new UploadService
  - Update `server/src/controllers/uploadController.js` to handle both storage backends
  - Add S3 credential validation on server startup in production environment
  - _Requirements: 4.4_

- [ ] 4.3 Add AWS SDK dependency and environment variables
  - Verify aws-sdk is in `server/package.json` dependencies (already present)
  - Add AWS environment variables to `server/.env.example` (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET)
  - Update deployment documentation with S3 setup instructions
  - _Requirements: 4.4, 4.5_

- [ ] 5. Create comprehensive backend test suite
- [ ] 5.1 Set up test infrastructure
  - Create `server/tests/setup/testDb.js` with setupTestDb and teardownTestDb functions for MongoDB test database
  - Create `server/tests/setup/fixtures.js` with test data factories for users, products, orders
  - Create `server/tests/setup/helpers.js` with utility functions (createTestUser, generateAuthToken, cleanupTestData)
  - Update `server/jest.config.js` with coverage thresholds (70% for controllers and services) and 60-second timeout
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 5.2 Write controller unit tests
  - Write unit tests for `server/src/controllers/authController.js` covering login, signup, logout, password reset
  - Write unit tests for `server/src/controllers/productController.js` covering CRUD operations and filtering
  - Write unit tests for `server/src/controllers/orderController.js` covering order creation, status updates, retrieval
  - Write unit tests for `server/src/controllers/adminController.js` covering admin-specific operations
  - _Requirements: 5.1, 5.2_

- [ ] 5.3 Write service unit tests
  - Write unit tests for `server/src/services/uploadService.js` covering both S3 and local storage backends
  - Write unit tests for `server/src/services/emailService.js` with mocked nodemailer
  - _Requirements: 5.1, 5.2_

- [ ] 5.4 Write integration tests
  - Write integration tests for authentication flow (signup → login → protected route access)
  - Write integration tests for product management (create → read → update → delete)
  - Write integration tests for order processing (create order → payment → status updates)
  - Write integration tests for file upload with mocked S3
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 5.5 Remove old test files
  - Delete `server/test-comprehensive.js` and other old complicated test files
  - Remove any unused test utilities or fixtures from old test setup
  - _Requirements: 5.3_

- [ ] 6. Create frontend test suite
- [ ] 6.1 Write component tests
  - Write tests for authentication components (`Login.jsx`, `Signup.jsx`) with form validation and submission
  - Write tests for notification component with different types and auto-dismiss behavior
  - Write tests for modal component with keyboard navigation and overlay clicks
  - _Requirements: 5.4_

- [ ] 6.2 Write integration tests for critical flows
  - Write integration test for checkout flow (browse → add to cart → checkout → payment)
  - Write integration test for authentication flow (signup → login → profile access)
  - Write integration test for product browsing with filtering and search
  - _Requirements: 5.4, 5.5_

- [ ] 6.3 Write hook tests
  - Write tests for useNotification hook with all notification methods
  - Write tests for other custom hooks with renderHook from React Testing Library
  - _Requirements: 5.4_

- [ ] 7. Code quality improvements
- [ ] 7.1 Remove unused code and imports
  - Run analysis to find unused exports across all files using grep or ts-prune
  - Remove unused imports from all JavaScript and JSX files
  - Remove commented-out code blocks throughout the codebase
  - Remove TODO comments (convert important ones to GitHub issues first)
  - _Requirements: 6.1, 6.3_

- [ ] 7.2 Consolidate duplicate code
  - Identify and consolidate duplicate utility functions across modules
  - Merge similar components with minor differences into configurable single components
  - Remove redundant API service methods
  - _Requirements: 6.1_

- [ ] 7.3 Enforce code conventions
  - Ensure all components use PascalCase naming
  - Ensure all functions and variables use camelCase naming
  - Ensure all constants use UPPER_SNAKE_CASE naming
  - Organize imports consistently (external → internal → relative)
  - Ensure async/await is used consistently without mixing callbacks
  - _Requirements: 6.2, 6.5_

- [ ] 7.4 Separate business logic from presentation
  - Extract business logic from large components into custom hooks or utility functions
  - Ensure components focus on presentation and user interaction
  - Move data fetching logic to React Query hooks or service layer
  - _Requirements: 6.4_

- [ ] 7.5 Clean up dependencies
  - Run depcheck to find unused dependencies in both `client/package.json` and `server/package.json`
  - Remove unused dependencies from package.json files
  - Run npm prune to clean up node_modules
  - _Requirements: 6.1, 9.5_

- [ ] 8. Remove emojis from documentation
  - Create script `scripts/removeEmojis.js` to process markdown files and remove emoji characters
  - Process all markdown files in `docs/` directory to remove emojis and replace with text equivalents
  - Process root `README.md` and `STRIPE_ARCHITECTURE.md` to remove emojis
  - Process any other markdown files in the repository
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Implement performance optimizations
- [ ] 9.1 Implement frontend code splitting
  - Add lazy loading for route components in `client/src/App.jsx` using React.lazy
  - Wrap lazy-loaded routes in Suspense with loading fallback component
  - Configure Vite to create separate chunks for vendor libraries (react, radix-ui, tanstack)
  - _Requirements: 8.1_

- [ ] 9.2 Optimize images
  - Add loading="lazy" attribute to all image tags in components
  - Implement responsive images with srcSet for product images
  - Add decoding="async" to image tags for better performance
  - _Requirements: 8.2_

- [ ] 9.3 Implement search debouncing
  - Create useDebounce hook in `client/src/hooks/useDebounce.js`
  - Apply debouncing to search input in product search components
  - Apply debouncing to any other real-time search or filter inputs
  - _Requirements: 8.4_

- [ ] 9.4 Implement backend caching
  - Create cache middleware for frequently accessed endpoints (products, categories)
  - Apply cache middleware to product list and category endpoints with appropriate TTL
  - Add cache invalidation on product/category updates
  - _Requirements: 8.3_

- [ ] 9.5 Optimize build configuration
  - Update `client/vite.config.js` to disable source maps in production
  - Configure terser to drop console and debugger statements
  - Set up manual chunks for better code splitting
  - Set chunk size warning limit to 1000kb
  - _Requirements: 8.5_

- [ ] 10. Remove dead code and unused files
- [ ] 10.1 Identify and remove unused files
  - Find files that are not imported anywhere in the codebase
  - Remove test files for deleted features
  - Remove backup files (*.bak, *.old) and temporary files
  - _Requirements: 9.1, 9.2_

- [ ] 10.2 Remove unused exports and functions
  - Identify exported functions and classes that are never imported
  - Remove or make private functions that are not used outside their module
  - _Requirements: 9.2_

- [ ] 10.3 Consolidate utility functions
  - Identify duplicate utility functions across different modules
  - Create shared utility modules for common functionality
  - Update imports to use consolidated utilities
  - _Requirements: 9.3, 9.4_

- [ ] 11. Final integration and validation
  - Run full test suite for both frontend and backend to ensure all tests pass
  - Run build process for frontend and verify no errors or warnings
  - Test application in development mode with all new features
  - Verify logging works correctly in both development and production modes
  - Test file uploads with both local and S3 backends
  - Verify all API calls use centralized configuration
  - Verify notification system works for all user interactions
  - Run performance tests and verify metrics meet targets
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 8.1, 8.2, 8.3, 8.4, 8.5_
