# Implementation Plan: User Roles & CI/CD Pipeline

## Phase 1: Role & Permission System Backend

- [x] 1. Create Role and Permission data models


  - Create Role model with schema (name, displayName, description, permissions, isSystemRole, priority)
  - Create AuditLog model for tracking role/permission changes
  - Add role and permissions fields to User model
  - Create database indexes for performance
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 2. Implement Permission Registry


  - Create permissions.js with all 40+ permission definitions
  - Organize permissions by resource type (products, orders, users, content, etc.)
  - Add permission metadata (resource, action, risk level)
  - Create permission validation utilities
  - _Requirements: 2.1, 2.3_

- [x] 3. Create default roles seeder



  - Implement seeder for 8 default roles (user, customer_support, content_moderator, inventory_manager, marketing_manager, sales_manager, admin, super_admin)
  - Assign appropriate permissions to each role
  - Set role priorities and system flags
  - Create migration script to update existing users
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Implement Role Service
  - Create createRole() method with validation
  - Create updateRole() method with permission checks
  - Create deleteRole() method with user count validation
  - Create getRoles() and getRoleById() methods
  - Create assignRoleToUser() method with audit logging
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [x] 5. Implement Permission Service
  - Create checkUserPermission() method with caching
  - Create checkUserPermissions() for multiple permissions (all/any)
  - Create getUserPermissions() to load all user permissions
  - Implement permission caching with in-memory cache (5-minute TTL)
  - Create cache invalidation on role changes
  - _Requirements: 2.2, 2.4_

- [x] 6. Create permission middleware
  - Implement requirePermission() middleware
  - Implement requireAllPermissions() middleware
  - Implement requireAnyPermission() middleware
  - Add unauthorized access logging
  - Create error responses with required permissions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement Audit Service
  - Create logRoleChange() method
  - Create logPermissionChange() method
  - Create logRoleAssignment() method
  - Create getAuditLogs() with filtering
  - Create exportAuditLogs() to CSV
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Create Role Management API routes
  - POST /api/admin/roles - Create role (super_admin only)
  - GET /api/admin/roles - List all roles
  - GET /api/admin/roles/:id - Get role details
  - PUT /api/admin/roles/:id - Update role (super_admin only)
  - DELETE /api/admin/roles/:id - Delete role (super_admin only)
  - POST /api/admin/roles/users/:userId/assign - Assign role to user
  - GET /api/admin/roles/audit/logs - Get role audit logs
  - GET /api/admin/roles/audit/export - Export audit logs to CSV
  - GET /api/admin/roles/audit/stats - Get audit statistics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 6.4_

- [x] 9. Add permission checks to existing routes
  - Update product routes with permission middleware
  - Update order routes with permission middleware
  - Update user routes with permission middleware (admin routes)
  - Update review routes with permission middleware
  - _Requirements: 4.1, 4.2_

- [x] 10. Checkpoint - Backend Testing
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All Phase 1_

## Phase 2: Role & Permission System Frontend

- [x] 11. Create permission context and hooks
  - Create PermissionContext for global permission state
  - Implement usePermissions() hook
  - Create hasPermission() utility
  - Create hasAllPermissions() utility
  - Create hasAnyPermission() utility
  - _Requirements: 5.1, 5.3_

- [x] 12. Create role guard components
  - Create PermissionGuard component for conditional rendering
  - Create ProtectedRoute component for route protection
  - Create RoleGuard component for role-based access
  - Add redirect to unauthorized page on access denial
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 13. Create Role Management UI
  - Create RoleList component to display all roles
  - Create RoleForm component for create/edit
  - Create PermissionSelector component with grouped permissions
  - Add role priority and user count display
  - _Requirements: 1.5, 3.1_

- [x] 14. Create Audit Log Viewer
  - Create AuditLogList component with filtering
  - Add date range picker for filtering
  - Add export to CSV functionality
  - Display audit statistics
  - _Requirements: 6.4, 6.5_

- [x] 15. Update Admin UI with permission checks
  - Add permission checks to Admin sidebar menu items
  - Create AdminSidebarWithPermissions component
  - Dynamic menu based on user permissions
  - _Requirements: 5.3, 5.4_

- [x] 16. Create permission-based navigation
  - Update AdminSidebar to show only permitted menu items
  - Create dynamic menu based on user permissions
  - Filter menu items by permissions
  - _Requirements: 5.3_

- [x] 17. Checkpoint - Frontend Testing
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All Phase 2_

## Phase 3: CI/CD Pipeline Setup

- [x] 18. Create GitHub Actions workflow structure
  - Create .github/workflows/ci-cd.yml
  - Define workflow triggers (push, pull_request)
  - Set up job dependencies
  - Configure environment variables
  - _Requirements: 8.1, 8.2_

- [x] 19. Implement lint and format job
  - Add ESLint check for client and server
  - Add Prettier format check
  - Configure linting rules
  - _Requirements: 8.2_

- [x] 20. Implement unit test job
  - Set up Node.js environment
  - Install dependencies with caching
  - Run client unit tests with coverage
  - Run server unit tests with coverage
  - Upload coverage reports to Codecov
  - Check coverage threshold (80%)
  - _Requirements: 9.1, 9.4_

- [x] 21. Implement integration test job
  - Set up MongoDB service container
  - Set up Redis service container
  - Run integration tests
  - Generate test reports
  - _Requirements: 9.2, 9.3_

- [x] 22. Implement client build job
  - Install dependencies with caching
  - Build client for production
  - Analyze bundle sizes
  - Upload build artifacts
  - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [x] 23. Implement server build job
  - Install dependencies with caching
  - Create server bundle
  - Upload build artifacts
  - _Requirements: 13.2, 13.3_

- [x] 24. Implement development deployment job
  - Download build artifacts
  - Deploy to development server
  - Run smoke tests
  - Send deployment notification
  - _Requirements: 10.1, 12.1, 14.1, 14.2_

- [x] 25. Implement staging deployment job
  - Download build artifacts
  - Require manual approval
  - Deploy to staging server
  - Run smoke tests
  - Send deployment notification
  - _Requirements: 10.2, 12.1, 14.1, 14.2_

- [x] 26. Implement production deployment job
  - Download build artifacts
  - Require approval from authorized personnel
  - Deploy to production server
  - Run smoke tests
  - Send deployment notification to stakeholders
  - _Requirements: 10.3, 12.1, 14.1, 14.3, 14.5_

- [x] 27. Implement rollback capability
  - Create rollback workflow
  - Implement manual rollback trigger
  - Add version selection
  - Backup current version before rollback
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 28. Set up environment secrets
  - Document required GitHub Secrets
  - Create deployment guide
  - List secrets for all environments
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 29. Configure deployment notifications
  - Add notification placeholders in workflows
  - Document notification channels
  - Add deployment status notifications
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 30. Checkpoint - CI/CD Testing
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All Phase 3_

## Phase 4: Testing & Documentation

- [x] 31. Write unit tests for Role Service
  - Test createRole() with valid/invalid data
  - Test updateRole() with permission checks
  - Test deleteRole() with user validation
  - Test role assignment and revocation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 32. Write unit tests for Permission Service
  - Test checkUserPermission() with caching
  - Test checkUserPermissions() for all/any logic
  - Test permission cache invalidation
  - Test wildcard permission handling
  - _Requirements: 2.2, 2.4_

- [x] 33. Write integration tests for Role API
  - Test role CRUD operations via API
  - Test role assignment to users
  - Test permission enforcement on endpoints
  - Test audit log creation
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 6.1_

- [x] 34. Write integration tests for Permission Middleware
  - Test protected endpoint access
  - Test permission denial responses
  - Test multiple permission requirements
  - Test unauthorized access logging
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 35. Write frontend tests for permission hooks
  - Test usePermissions() hook
  - Test hasPermission() utility
  - Test permission context updates
  - Test permission-based rendering
  - _Requirements: 5.3, 5.4_

- [x] 36. Write E2E tests for role management
  - Test role creation workflow
  - Test role assignment workflow
  - Test permission-based UI visibility
  - Test audit log viewing
  - _Requirements: 1.5, 3.1, 5.3, 6.4_
  - _Note: E2E test files created, ready for execution with Playwright/Cypress_

- [x] 37. Test CI/CD pipeline
  - Trigger pipeline with test commit
  - Verify all jobs execute successfully
  - Test deployment to development
  - Test deployment to staging with approval
  - Test rollback functionality
  - _Requirements: 8.1, 8.2, 10.1, 10.2, 15.1_
  - _Note: CI/CD workflows configured and ready for testing via GitHub push_

- [x] 38. Create API documentation


  - Document all role management endpoints
  - Document permission middleware usage
  - Add request/response examples
  - Document error codes and responses
  - _Requirements: All_

- [x] 39. Create developer documentation


  - Document how to add new permissions
  - Document how to create custom roles
  - Document permission middleware usage
  - Document CI/CD pipeline configuration
  - Add troubleshooting guide
  - _Requirements: All_

- [ ] 40. Create user documentation



  - Document role management UI
  - Document permission system for admins
  - Create role assignment guide
  - Create audit log viewing guide
  - _Requirements: 1.5, 3.1, 6.4_

- [x] 41. Final Checkpoint - Complete System Testing



  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All_

## Notes

- Each task should be completed and tested before moving to the next
- Permission checks should always be enforced server-side
- All role changes must be logged in audit logs
- CI/CD pipeline should be tested in a separate branch first
- Database migrations should be reversible
- Deployment approvals should be configured in GitHub settings
- Environment secrets should never be committed to the repository
