/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles and their permissions for the TechVerse platform
 */

// Available roles in the system
export const ROLES = {
  USER: 'user',
  CUSTOMER_SUPPORT: 'customer_support',
  CONTENT_MODERATOR: 'content_moderator',
  INVENTORY_MANAGER: 'inventory_manager',
  MARKETING_MANAGER: 'marketing_manager',
  SALES_MANAGER: 'sales_manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Permission categories
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  
  // Product Management
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_MANAGE_INVENTORY: 'products:manage_inventory',
  
  // Category Management
  CATEGORIES_VIEW: 'categories:view',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_EDIT: 'categories:edit',
  CATEGORIES_DELETE: 'categories:delete',
  
  // Order Management
  ORDERS_VIEW: 'orders:view',
  ORDERS_VIEW_ALL: 'orders:view_all',
  ORDERS_EDIT: 'orders:edit',
  ORDERS_CANCEL: 'orders:cancel',
  ORDERS_REFUND: 'orders:refund',
  ORDERS_MANAGE_STATUS: 'orders:manage_status',
  
  // Review Management
  REVIEWS_VIEW: 'reviews:view',
  REVIEWS_MODERATE: 'reviews:moderate',
  REVIEWS_APPROVE: 'reviews:approve',
  REVIEWS_REJECT: 'reviews:reject',
  REVIEWS_DELETE: 'reviews:delete',
  
  // Homepage Management
  HOMEPAGE_MANAGE: 'homepage:manage',
  HOMEPAGE_SECTIONS: 'homepage:sections',
  
  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  REPORTS_VIEW: 'reports:view',
  REPORTS_GENERATE: 'reports:generate',
  
  // Settings & Configuration
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_SYSTEM: 'settings:system',
  
  // Security & Monitoring
  SECURITY_VIEW: 'security:view',
  SECURITY_MANAGE: 'security:manage',
  LOGS_VIEW: 'logs:view',
  
  // Notifications
  NOTIFICATIONS_SEND: 'notifications:send',
  NOTIFICATIONS_MANAGE: 'notifications:manage'
};

// Role-Permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    // Regular users have no admin permissions
  ],
  
  [ROLES.CUSTOMER_SUPPORT]: [
    // Can view and manage orders and users
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_MANAGE_STATUS,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND
  ],
  
  [ROLES.CONTENT_MODERATOR]: [
    // Can manage reviews and content
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.REVIEWS_APPROVE,
    PERMISSIONS.REVIEWS_REJECT,
    PERMISSIONS.REVIEWS_DELETE,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT, // Can edit product descriptions
    PERMISSIONS.CATEGORIES_VIEW
  ],
  
  [ROLES.INVENTORY_MANAGER]: [
    // Can manage products and inventory
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_MANAGE_INVENTORY,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  [ROLES.MARKETING_MANAGER]: [
    // Can manage homepage, products, and marketing content
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.HOMEPAGE_MANAGE,
    PERMISSIONS.HOMEPAGE_SECTIONS,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.NOTIFICATIONS_MANAGE
  ],
  
  [ROLES.SALES_MANAGER]: [
    // Can view analytics, orders, and manage sales
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_MANAGE_STATUS,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.USERS_VIEW
  ],
  
  [ROLES.ADMIN]: [
    // Full access except system settings and role management
    ...Object.values(PERMISSIONS).filter(p => 
      !p.startsWith('settings:system') && 
      !p.includes('manage_roles')
    )
  ],
  
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ]
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role, permissions) => {
  if (!role || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role, permissions) => {
  if (!role || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role display information
 */
export const ROLE_INFO = {
  [ROLES.USER]: {
    label: 'Customer',
    description: 'Regular customer with shopping access',
    color: 'secondary',
    level: 0
  },
  [ROLES.CUSTOMER_SUPPORT]: {
    label: 'Customer Support',
    description: 'Can manage orders and assist customers',
    color: 'info',
    level: 1
  },
  [ROLES.CONTENT_MODERATOR]: {
    label: 'Content Moderator',
    description: 'Can moderate reviews and manage content',
    color: 'warning',
    level: 1
  },
  [ROLES.INVENTORY_MANAGER]: {
    label: 'Inventory Manager',
    description: 'Can manage products and inventory',
    color: 'primary',
    level: 2
  },
  [ROLES.MARKETING_MANAGER]: {
    label: 'Marketing Manager',
    description: 'Can manage homepage and marketing content',
    color: 'success',
    level: 2
  },
  [ROLES.SALES_MANAGER]: {
    label: 'Sales Manager',
    description: 'Can view analytics and manage sales',
    color: 'primary',
    level: 2
  },
  [ROLES.ADMIN]: {
    label: 'Administrator',
    description: 'Full administrative access',
    color: 'danger',
    level: 3
  },
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Administrator',
    description: 'Complete system access',
    color: 'dark',
    level: 4
  }
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_INFO,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions
};
