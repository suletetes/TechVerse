/**
 * Permission Registry
 * 
 * Defines all available permissions in the system organized by resource type.
 * Each permission includes metadata about the resource, action, and risk level.
 */

export const PERMISSIONS = {
  // Product Management
  'products.view': {
    resource: 'products',
    action: 'view',
    risk: 'low',
    description: 'View product listings and details'
  },
  'products.create': {
    resource: 'products',
    action: 'create',
    risk: 'medium',
    description: 'Create new products'
  },
  'products.update': {
    resource: 'products',
    action: 'update',
    risk: 'medium',
    description: 'Update existing products'
  },
  'products.delete': {
    resource: 'products',
    action: 'delete',
    risk: 'high',
    description: 'Delete products'
  },
  'products.publish': {
    resource: 'products',
    action: 'publish',
    risk: 'medium',
    description: 'Publish or unpublish products'
  },
  
  // Order Management
  'orders.view': {
    resource: 'orders',
    action: 'view',
    risk: 'low',
    description: 'View order details'
  },
  'orders.update': {
    resource: 'orders',
    action: 'update',
    risk: 'medium',
    description: 'Update order status and details'
  },
  'orders.cancel': {
    resource: 'orders',
    action: 'cancel',
    risk: 'high',
    description: 'Cancel orders'
  },
  'orders.refund': {
    resource: 'orders',
    action: 'refund',
    risk: 'high',
    description: 'Process order refunds'
  },
  
  // User Management
  'users.view': {
    resource: 'users',
    action: 'view',
    risk: 'medium',
    description: 'View user profiles and information'
  },
  'users.create': {
    resource: 'users',
    action: 'create',
    risk: 'high',
    description: 'Create new user accounts'
  },
  'users.update': {
    resource: 'users',
    action: 'update',
    risk: 'high',
    description: 'Update user information'
  },
  'users.delete': {
    resource: 'users',
    action: 'delete',
    risk: 'critical',
    description: 'Delete user accounts'
  },
  'users.assign_role': {
    resource: 'users',
    action: 'assign_role',
    risk: 'critical',
    description: 'Assign roles to users'
  },
  
  // Content Management
  'content.view': {
    resource: 'content',
    action: 'view',
    risk: 'low',
    description: 'View content and pages'
  },
  'content.create': {
    resource: 'content',
    action: 'create',
    risk: 'low',
    description: 'Create new content'
  },
  'content.update': {
    resource: 'content',
    action: 'update',
    risk: 'low',
    description: 'Update existing content'
  },
  'content.delete': {
    resource: 'content',
    action: 'delete',
    risk: 'medium',
    description: 'Delete content'
  },
  'content.moderate': {
    resource: 'content',
    action: 'moderate',
    risk: 'medium',
    description: 'Moderate user-generated content'
  },
  
  // Review Management
  'reviews.view': {
    resource: 'reviews',
    action: 'view',
    risk: 'low',
    description: 'View product reviews'
  },
  'reviews.moderate': {
    resource: 'reviews',
    action: 'moderate',
    risk: 'medium',
    description: 'Approve or reject reviews'
  },
  'reviews.delete': {
    resource: 'reviews',
    action: 'delete',
    risk: 'medium',
    description: 'Delete reviews'
  },
  
  // Inventory Management
  'inventory.view': {
    resource: 'inventory',
    action: 'view',
    risk: 'low',
    description: 'View inventory levels'
  },
  'inventory.update': {
    resource: 'inventory',
    action: 'update',
    risk: 'medium',
    description: 'Update inventory quantities'
  },
  'inventory.adjust': {
    resource: 'inventory',
    action: 'adjust',
    risk: 'high',
    description: 'Make inventory adjustments'
  },
  
  // Marketing
  'marketing.view': {
    resource: 'marketing',
    action: 'view',
    risk: 'low',
    description: 'View marketing campaigns'
  },
  'marketing.create': {
    resource: 'marketing',
    action: 'create',
    risk: 'medium',
    description: 'Create marketing campaigns'
  },
  'marketing.send': {
    resource: 'marketing',
    action: 'send',
    risk: 'high',
    description: 'Send marketing emails'
  },
  
  // Analytics
  'analytics.view': {
    resource: 'analytics',
    action: 'view',
    risk: 'low',
    description: 'View analytics and reports'
  },
  'analytics.export': {
    resource: 'analytics',
    action: 'export',
    risk: 'medium',
    description: 'Export analytics data'
  },
  
  // Settings
  'settings.view': {
    resource: 'settings',
    action: 'view',
    risk: 'medium',
    description: 'View system settings'
  },
  'settings.update': {
    resource: 'settings',
    action: 'update',
    risk: 'critical',
    description: 'Update system settings'
  },
  
  // Roles & Permissions
  'roles.view': {
    resource: 'roles',
    action: 'view',
    risk: 'medium',
    description: 'View roles and permissions'
  },
  'roles.create': {
    resource: 'roles',
    action: 'create',
    risk: 'critical',
    description: 'Create new roles'
  },
  'roles.update': {
    resource: 'roles',
    action: 'update',
    risk: 'critical',
    description: 'Update role permissions'
  },
  'roles.delete': {
    resource: 'roles',
    action: 'delete',
    risk: 'critical',
    description: 'Delete roles'
  },
  
  // Audit Logs
  'audit.view': {
    resource: 'audit',
    action: 'view',
    risk: 'medium',
    description: 'View audit logs'
  },
  'audit.export': {
    resource: 'audit',
    action: 'export',
    risk: 'high',
    description: 'Export audit logs'
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = () => {
  return Object.keys(PERMISSIONS);
};

/**
 * Get permissions by resource
 */
export const getPermissionsByResource = (resource) => {
  return Object.entries(PERMISSIONS)
    .filter(([_, permission]) => permission.resource === resource)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

/**
 * Get permissions grouped by resource
 */
export const getPermissionsGroupedByResource = () => {
  const grouped = {};
  
  Object.entries(PERMISSIONS).forEach(([key, permission]) => {
    if (!grouped[permission.resource]) {
      grouped[permission.resource] = {};
    }
    grouped[permission.resource][key] = permission;
  });
  
  return grouped;
};

/**
 * Get permissions by risk level
 */
export const getPermissionsByRisk = (riskLevel) => {
  return Object.entries(PERMISSIONS)
    .filter(([_, permission]) => permission.risk === riskLevel)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

/**
 * Validate if a permission exists
 */
export const isValidPermission = (permission) => {
  return permission === '*' || PERMISSIONS.hasOwnProperty(permission);
};

/**
 * Validate multiple permissions
 */
export const validatePermissions = (permissions) => {
  const invalid = [];
  
  permissions.forEach(permission => {
    if (!isValidPermission(permission)) {
      invalid.push(permission);
    }
  });
  
  return {
    valid: invalid.length === 0,
    invalidPermissions: invalid
  };
};

/**
 * Get permission metadata
 */
export const getPermissionMetadata = (permission) => {
  if (permission === '*') {
    return {
      resource: 'all',
      action: 'all',
      risk: 'critical',
      description: 'All permissions (Super Admin)'
    };
  }
  
  return PERMISSIONS[permission] || null;
};

/**
 * Get all resources
 */
export const getAllResources = () => {
  const resources = new Set();
  
  Object.values(PERMISSIONS).forEach(permission => {
    resources.add(permission.resource);
  });
  
  return Array.from(resources).sort();
};

/**
 * Get all actions for a resource
 */
export const getActionsForResource = (resource) => {
  const actions = new Set();
  
  Object.values(PERMISSIONS)
    .filter(permission => permission.resource === resource)
    .forEach(permission => {
      actions.add(permission.action);
    });
  
  return Array.from(actions).sort();
};

/**
 * Check if permission matches pattern
 * Supports wildcards like 'products.*'
 */
export const matchesPermissionPattern = (permission, pattern) => {
  if (pattern === '*') {
    return true;
  }
  
  if (pattern.endsWith('.*')) {
    const resource = pattern.slice(0, -2);
    return permission.startsWith(resource + '.');
  }
  
  return permission === pattern;
};

/**
 * Expand permission patterns to actual permissions
 * e.g., 'products.*' -> ['products.view', 'products.create', ...]
 */
export const expandPermissionPattern = (pattern) => {
  if (pattern === '*') {
    return getAllPermissions();
  }
  
  if (pattern.endsWith('.*')) {
    const resource = pattern.slice(0, -2);
    return Object.keys(getPermissionsByResource(resource));
  }
  
  return [pattern];
};

export default {
  PERMISSIONS,
  getAllPermissions,
  getPermissionsByResource,
  getPermissionsGroupedByResource,
  getPermissionsByRisk,
  isValidPermission,
  validatePermissions,
  getPermissionMetadata,
  getAllResources,
  getActionsForResource,
  matchesPermissionPattern,
  expandPermissionPattern
};
