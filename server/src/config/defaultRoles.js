/**
 * Default Roles Configuration
 * 
 * Defines the 8 default roles with their permissions and metadata.
 * These roles are created during system initialization.
 */

export const DEFAULT_ROLES = {
  user: {
    name: 'user',
    displayName: 'Customer',
    description: 'Regular customer with basic access to browse and purchase products',
    permissions: [
      'products.view',
      'orders.view',
      'reviews.view',
      'content.view'
    ],
    priority: 1,
    isSystemRole: true,
    isActive: true
  },
  
  customer_support: {
    name: 'customer_support',
    displayName: 'Customer Support',
    description: 'Handle customer inquiries, orders, and provide support',
    permissions: [
      'products.view',
      'orders.view',
      'orders.update',
      'users.view',
      'content.view',
      'reviews.view'
    ],
    priority: 10,
    isSystemRole: true,
    isActive: true
  },
  
  content_moderator: {
    name: 'content_moderator',
    displayName: 'Content Moderator',
    description: 'Moderate user-generated content, reviews, and maintain content quality',
    permissions: [
      'products.view',
      'content.view',
      'content.moderate',
      'content.delete',
      'reviews.view',
      'reviews.moderate',
      'reviews.delete'
    ],
    priority: 15,
    isSystemRole: true,
    isActive: true
  },
  
  inventory_manager: {
    name: 'inventory_manager',
    displayName: 'Inventory Manager',
    description: 'Manage product inventory, stock levels, and inventory adjustments',
    permissions: [
      'products.view',
      'products.update',
      'inventory.view',
      'inventory.update',
      'inventory.adjust',
      'analytics.view'
    ],
    priority: 20,
    isSystemRole: true,
    isActive: true
  },
  
  marketing_manager: {
    name: 'marketing_manager',
    displayName: 'Marketing Manager',
    description: 'Create and manage marketing campaigns, content, and analytics',
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
    priority: 25,
    isSystemRole: true,
    isActive: true
  },
  
  sales_manager: {
    name: 'sales_manager',
    displayName: 'Sales Manager',
    description: 'Manage sales, orders, customer relationships, and sales analytics',
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
    priority: 30,
    isSystemRole: true,
    isActive: true
  },
  
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access for managing products, orders, users, and content including role management',
    permissions: [
      'products.view',
      'products.create',
      'products.update',
      'products.delete',
      'products.publish',
      'orders.view',
      'orders.update',
      'orders.cancel',
      'orders.refund',
      'users.view',
      'users.create',
      'users.update',
      'users.delete',
      'users.assign_role',
      'content.view',
      'content.create',
      'content.update',
      'content.delete',
      'content.moderate',
      'reviews.view',
      'reviews.moderate',
      'reviews.delete',
      'inventory.view',
      'inventory.update',
      'inventory.adjust',
      'marketing.view',
      'marketing.create',
      'marketing.send',
      'analytics.view',
      'analytics.export',
      'settings.view',
      'settings.update',
      'audit.view',
      'audit.export',
      'roles.view',
      'roles.create',
      'roles.update',
      'roles.delete'
    ],
    priority: 90,
    isSystemRole: true,
    isActive: true
  },
  
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Complete system control including role management and all administrative functions',
    permissions: ['*'], // All permissions
    priority: 100,
    isSystemRole: true,
    isActive: true
  }
};

/**
 * Get all default role names
 */
export const getDefaultRoleNames = () => {
  return Object.keys(DEFAULT_ROLES);
};

/**
 * Get default role by name
 */
export const getDefaultRole = (roleName) => {
  return DEFAULT_ROLES[roleName] || null;
};

/**
 * Check if a role is a default system role
 */
export const isDefaultRole = (roleName) => {
  return DEFAULT_ROLES.hasOwnProperty(roleName);
};

export default DEFAULT_ROLES;
