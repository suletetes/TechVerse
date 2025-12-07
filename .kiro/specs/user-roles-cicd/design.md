# Design Document: User Roles & CI/CD Pipeline

## Overview

This design implements a comprehensive Role-Based Access Control (RBAC) system with granular permissions and establishes a robust CI/CD pipeline for the TechVerse e-commerce platform. The system will support 8 predefined roles with customizable permissions, automated testing, multi-environment deployment, and rollback capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Role Guards  │  │ Permission   │  │ Admin Role   │     │
│  │              │  │ Hooks        │  │ Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth         │  │ Permission   │  │ Role         │     │
│  │ Middleware   │  │ Middleware   │  │ Routes       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Role         │  │ Permission   │  │ Audit        │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (MongoDB)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ User Model   │  │ Role Model   │  │ Audit Model  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   GitHub    │────▶│   Build &   │
│   Push      │     │   Actions   │     │   Test      │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ↓
                    ┌──────────────────────────────────┐
                    │     Test Results & Coverage      │
                    └──────────────────────────────────┘
                                               │
                    ┌──────────────┬───────────┴───────────┐
                    ↓              ↓                       ↓
            ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
            │ Development  │ │   Staging    │  │  Production  │
            │ Auto Deploy  │ │ Manual Approve│  │ Manual Approve│
            └──────────────┘ └──────────────┘  └──────────────┘
```

## Components and Interfaces

### 1. Role Model (MongoDB Schema)

```javascript
{
  name: String,              // Unique role name
  displayName: String,       // Human-readable name
  description: String,       // Role description
  permissions: [String],     // Array of permission identifiers
  isSystemRole: Boolean,     // Cannot be deleted if true
  isActive: Boolean,         // Role can be assigned
  priority: Number,          // Role hierarchy (higher = more privileged)
  createdBy: ObjectId,       // Admin who created the role
  updatedBy: ObjectId,       // Last admin to update
  metadata: {
    userCount: Number,       // Number of users with this role
    lastAssigned: Date       // Last time role was assigned
  },
  timestamps: true
}
```

### 2. Permission Registry

```javascript
const PERMISSIONS = {
  // Product Management
  'products.view': { resource: 'products', action: 'view', risk: 'low' },
  'products.create': { resource: 'products', action: 'create', risk: 'medium' },
  'products.update': { resource: 'products', action: 'update', risk: 'medium' },
  'products.delete': { resource: 'products', action: 'delete', risk: 'high' },
  'products.publish': { resource: 'products', action: 'publish', risk: 'medium' },
  
  // Order Management
  'orders.view': { resource: 'orders', action: 'view', risk: 'low' },
  'orders.update': { resource: 'orders', action: 'update', risk: 'medium' },
  'orders.cancel': { resource: 'orders', action: 'cancel', risk: 'high' },
  'orders.refund': { resource: 'orders', action: 'refund', risk: 'high' },
  
  // User Management
  'users.view': { resource: 'users', action: 'view', risk: 'medium' },
  'users.create': { resource: 'users', action: 'create', risk: 'high' },
  'users.update': { resource: 'users', action: 'update', risk: 'high' },
  'users.delete': { resource: 'users', action: 'delete', risk: 'critical' },
  'users.assign_role': { resource: 'users', action: 'assign_role', risk: 'critical' },
  
  // Content Management
  'content.view': { resource: 'content', action: 'view', risk: 'low' },
  'content.create': { resource: 'content', action: 'create', risk: 'low' },
  'content.update': { resource: 'content', action: 'update', risk: 'low' },
  'content.delete': { resource: 'content', action: 'delete', risk: 'medium' },
  'content.moderate': { resource: 'content', action: 'moderate', risk: 'medium' },
  
  // Review Management
  'reviews.view': { resource: 'reviews', action: 'view', risk: 'low' },
  'reviews.moderate': { resource: 'reviews', action: 'moderate', risk: 'medium' },
  'reviews.delete': { resource: 'reviews', action: 'delete', risk: 'medium' },
  
  // Inventory Management
  'inventory.view': { resource: 'inventory', action: 'view', risk: 'low' },
  'inventory.update': { resource: 'inventory', action: 'update', risk: 'medium' },
  'inventory.adjust': { resource: 'inventory', action: 'adjust', risk: 'high' },
  
  // Marketing
  'marketing.view': { resource: 'marketing', action: 'view', risk: 'low' },
  'marketing.create': { resource: 'marketing', action: 'create', risk: 'medium' },
  'marketing.send': { resource: 'marketing', action: 'send', risk: 'high' },
  
  // Analytics
  'analytics.view': { resource: 'analytics', action: 'view', risk: 'low' },
  'analytics.export': { resource: 'analytics', action: 'export', risk: 'medium' },
  
  // Settings
  'settings.view': { resource: 'settings', action: 'view', risk: 'medium' },
  'settings.update': { resource: 'settings', action: 'update', risk: 'critical' },
  
  // Roles & Permissions
  'roles.view': { resource: 'roles', action: 'view', risk: 'medium' },
  'roles.create': { resource: 'roles', action: 'create', risk: 'critical' },
  'roles.update': { resource: 'roles', action: 'update', risk: 'critical' },
  'roles.delete': { resource: 'roles', action: 'delete', risk: 'critical' },
  
  // Audit Logs
  'audit.view': { resource: 'audit', action: 'view', risk: 'medium' },
  'audit.export': { resource: 'audit', action: 'export', risk: 'high' }
};
```

### 3. Default Roles Configuration

```javascript
const DEFAULT_ROLES = {
  user: {
    displayName: 'Customer',
    description: 'Regular customer with basic access',
    permissions: [
      'products.view',
      'orders.view',
      'reviews.view',
      'content.view'
    ],
    priority: 1
  },
  
  customer_support: {
    displayName: 'Customer Support',
    description: 'Handle customer inquiries and orders',
    permissions: [
      'products.view',
      'orders.view',
      'orders.update',
      'users.view',
      'content.view',
      'reviews.view'
    ],
    priority: 10
  },
  
  content_moderator: {
    displayName: 'Content Moderator',
    description: 'Moderate user-generated content and reviews',
    permissions: [
      'products.view',
      'content.view',
      'content.moderate',
      'content.delete',
      'reviews.view',
      'reviews.moderate',
      'reviews.delete'
    ],
    priority: 15
  },
  
  inventory_manager: {
    displayName: 'Inventory Manager',
    description: 'Manage product inventory and stock levels',
    permissions: [
      'products.view',
      'products.update',
      'inventory.view',
      'inventory.update',
      'inventory.adjust',
      'analytics.view'
    ],
    priority: 20
  },
  
  marketing_manager: {
    displayName: 'Marketing Manager',
    description: 'Create and manage marketing campaigns',
    permissions: [
      'products.view',
      'marketing.view',
      'marketing.create',
      'marketing.send',
      'analytics.view',
      'analytics.export',
      'content.view',
      'content.create',
      'content.update'
    ],
    priority: 25
  },
  
  sales_manager: {
    displayName: 'Sales Manager',
    description: 'Manage sales, orders, and customer relationships',
    permissions: [
      'products.view',
      'products.update',
      'orders.view',
      'orders.update',
      'orders.cancel',
      'orders.refund',
      'users.view',
      'analytics.view',
      'analytics.export'
    ],
    priority: 30
  },
  
  admin: {
    displayName: 'Administrator',
    description: 'Full system access except role management',
    permissions: [
      'products.view', 'products.create', 'products.update', 'products.delete', 'products.publish',
      'orders.view', 'orders.update', 'orders.cancel', 'orders.refund',
      'users.view', 'users.create', 'users.update',
      'content.view', 'content.create', 'content.update', 'content.delete', 'content.moderate',
      'reviews.view', 'reviews.moderate', 'reviews.delete',
      'inventory.view', 'inventory.update', 'inventory.adjust',
      'marketing.view', 'marketing.create', 'marketing.send',
      'analytics.view', 'analytics.export',
      'settings.view', 'settings.update',
      'audit.view'
    ],
    priority: 90
  },
  
  super_admin: {
    displayName: 'Super Administrator',
    description: 'Complete system control including role management',
    permissions: ['*'], // All permissions
    priority: 100
  }
};
```

### 4. Permission Middleware

```javascript
// Check single permission
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }
    
    const hasPermission = await checkUserPermission(req.user.id, permission);
    
    if (!hasPermission) {
      await logUnauthorizedAccess(req.user.id, permission, req.path);
      
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Permission required: ${permission}`,
        requiredPermission: permission
      });
    }
    
    next();
  };
};

// Check multiple permissions (all required)
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }
    
    const hasAll = await checkUserPermissions(req.user.id, permissions, 'all');
    
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Multiple permissions required',
        requiredPermissions: permissions
      });
    }
    
    next();
  };
};

// Check multiple permissions (any one required)
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }
    
    const hasAny = await checkUserPermissions(req.user.id, permissions, 'any');
    
    if (!hasAny) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'At least one permission required',
        requiredPermissions: permissions
      });
    }
    
    next();
  };
};
```

### 5. Frontend Permission Hook

```javascript
// usePermissions.js
export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadUserPermissions();
    }
  }, [user]);
  
  const loadUserPermissions = async () => {
    try {
      const response = await api.get('/api/auth/permissions');
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const hasPermission = (permission) => {
    if (!user) return false;
    if (permissions.includes('*')) return true; // Super admin
    return permissions.includes(permission);
  };
  
  const hasAllPermissions = (requiredPermissions) => {
    return requiredPermissions.every(p => hasPermission(p));
  };
  
  const hasAnyPermission = (requiredPermissions) => {
    return requiredPermissions.some(p => hasPermission(p));
  };
  
  return {
    permissions,
    loading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission
  };
};
```

### 6. Audit Log Model

```javascript
{
  action: String,            // 'role_created', 'role_updated', 'role_deleted', 'role_assigned', etc.
  performedBy: ObjectId,     // Admin who performed the action
  targetUser: ObjectId,      // User affected (for role assignments)
  targetRole: ObjectId,      // Role affected
  changes: {
    before: Mixed,           // State before change
    after: Mixed             // State after change
  },
  metadata: {
    ip: String,
    userAgent: String,
    reason: String           // Optional reason for change
  },
  timestamp: Date
}
```

## Data Models

### User Model Updates

```javascript
// Add to existing User schema
{
  role: {
    type: String,
    enum: [
      'user',
      'customer_support',
      'content_moderator',
      'inventory_manager',
      'marketing_manager',
      'sales_manager',
      'admin',
      'super_admin'
    ],
    default: 'user'
  },
  permissions: [String],     // Cached permissions for performance
  roleHistory: [{
    role: String,
    assignedBy: ObjectId,
    assignedAt: Date,
    reason: String
  }]
}
```

## CI/CD Pipeline Design

### GitHub Actions Workflow Structure

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Lint and Format Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run ESLint
      - Run Prettier check
  
  # Job 2: Unit Tests
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run unit tests
      - Generate coverage report
      - Upload coverage to Codecov
  
  # Job 3: Integration Tests
  test-integration:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
      redis:
        image: redis:latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run integration tests
      - Generate test report
  
  # Job 4: Build Client
  build-client:
    needs: [lint, test-unit]
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Build client for production
      - Upload build artifacts
  
  # Job 5: Build Server
  build-server:
    needs: [lint, test-unit]
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Build server for production
      - Upload build artifacts
  
  # Job 6: Deploy to Development
  deploy-dev:
    needs: [build-client, build-server, test-integration]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - Download artifacts
      - Deploy to development server
      - Run smoke tests
      - Notify team
  
  # Job 7: Deploy to Staging
  deploy-staging:
    needs: [build-client, build-server, test-integration]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - Download artifacts
      - Deploy to staging server
      - Run smoke tests
      - Notify team
  
  # Job 8: Deploy to Production
  deploy-production:
    needs: [build-client, build-server, test-integration]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - Download artifacts
      - Deploy to production server
      - Run smoke tests
      - Notify stakeholders
```

### Environment Configuration

```javascript
// Development
{
  NODE_ENV: 'development',
  API_URL: 'https://dev-api.techverse.com',
  CLIENT_URL: 'https://dev.techverse.com',
  MONGODB_URI: process.env.DEV_MONGODB_URI,
  REDIS_URL: process.env.DEV_REDIS_URL
}

// Staging
{
  NODE_ENV: 'staging',
  API_URL: 'https://staging-api.techverse.com',
  CLIENT_URL: 'https://staging.techverse.com',
  MONGODB_URI: process.env.STAGING_MONGODB_URI,
  REDIS_URL: process.env.STAGING_REDIS_URL
}

// Production
{
  NODE_ENV: 'production',
  API_URL: 'https://api.techverse.com',
  CLIENT_URL: 'https://techverse.com',
  MONGODB_URI: process.env.PROD_MONGODB_URI,
  REDIS_URL: process.env.PROD_REDIS_URL
}
```

## Error Handling

### Permission Errors

```javascript
class PermissionError extends Error {
  constructor(message, requiredPermission) {
    super(message);
    this.name = 'PermissionError';
    this.code = 'INSUFFICIENT_PERMISSIONS';
    this.statusCode = 403;
    this.requiredPermission = requiredPermission;
  }
}

class RoleNotFoundError extends Error {
  constructor(roleName) {
    super(`Role not found: ${roleName}`);
    this.name = 'RoleNotFoundError';
    this.code = 'ROLE_NOT_FOUND';
    this.statusCode = 404;
  }
}
```

## Testing Strategy

### Unit Tests

1. **Role Service Tests**
   - Create role with valid permissions
   - Update role permissions
   - Delete role (with/without users)
   - Validate permission existence

2. **Permission Service Tests**
   - Check user permission
   - Check multiple permissions (all/any)
   - Cache permission lookups
   - Handle wildcard permissions

3. **Middleware Tests**
   - Require single permission
   - Require multiple permissions
   - Handle missing authentication
   - Log unauthorized access

### Integration Tests

1. **Role Management API Tests**
   - Create role via API
   - Assign role to user
   - Update user permissions
   - Audit log creation

2. **Permission Enforcement Tests**
   - Protected endpoint access
   - Permission denial
   - Role hierarchy
   - Session invalidation on role change

### CI/CD Pipeline Tests

1. **Pipeline Execution Tests**
   - Trigger on push
   - Run all test suites
   - Build artifacts
   - Deploy to environments

2. **Deployment Tests**
   - Environment variable loading
   - Database migration
   - Smoke tests
   - Rollback capability

## Performance Considerations

1. **Permission Caching**
   - Cache user permissions in Redis (TTL: 5 minutes)
   - Invalidate cache on role change
   - Use in-memory cache for permission registry

2. **Database Indexing**
   - Index on `User.role`
   - Index on `Role.name`
   - Index on `AuditLog.timestamp`

3. **Build Optimization**
   - Use build caching in CI
   - Parallel test execution
   - Incremental builds
   - Asset optimization

## Security Considerations

1. **Role Assignment**
   - Only super_admin can assign admin/super_admin roles
   - Log all role changes
   - Require reason for sensitive role changes

2. **Permission Checks**
   - Always check permissions server-side
   - Never trust client-side permission checks
   - Rate limit permission-checking endpoints

3. **Audit Logging**
   - Log all permission denials
   - Log all role changes
   - Retain logs for compliance

4. **CI/CD Security**
   - Use GitHub Secrets for sensitive data
   - Scan dependencies for vulnerabilities
   - Sign deployment artifacts
   - Require approval for production deployments

## Deployment Strategy

### Development Environment
- Auto-deploy on push to `develop` branch
- No approval required
- Use development database

### Staging Environment
- Auto-deploy on push to `staging` branch
- Manual approval from team lead
- Use staging database (copy of production)

### Production Environment
- Manual deployment from `main` branch
- Approval from 2 authorized personnel
- Blue-green deployment strategy
- Automatic rollback on failure

## Monitoring and Alerting

1. **Application Monitoring**
   - Track permission check latency
   - Monitor role assignment frequency
   - Alert on repeated permission denials

2. **Pipeline Monitoring**
   - Track build duration
   - Monitor test success rate
   - Alert on deployment failures

3. **Audit Monitoring**
   - Alert on suspicious role changes
   - Monitor admin activity
   - Track permission usage patterns
