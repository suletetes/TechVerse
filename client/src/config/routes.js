/**
 * Route Configuration System
 * 
 * Centralized route definitions with role-based access control
 * and layout management for admin and user interfaces
 */

import { UserRoles } from '../services/authService.js';

// Route metadata and configuration
export const RouteMetadata = {
  // Public routes
  HOME: {
    path: '/',
    name: 'Home',
    title: 'TechVerse - Home',
    description: 'Welcome to TechVerse',
    public: true
  },
  LOGIN: {
    path: '/login',
    name: 'Login',
    title: 'Login - TechVerse',
    description: 'Sign in to your account',
    public: true
  },
  REGISTER: {
    path: '/register',
    name: 'Register',
    title: 'Register - TechVerse',
    description: 'Create a new account',
    public: true
  },
  FORGOT_PASSWORD: {
    path: '/forgot-password',
    name: 'Forgot Password',
    title: 'Reset Password - TechVerse',
    description: 'Reset your password',
    public: true
  },
  RESET_PASSWORD: {
    path: '/reset-password/:token',
    name: 'Reset Password',
    title: 'Reset Password - TechVerse',
    description: 'Set new password',
    public: true
  },
  VERIFY_EMAIL: {
    path: '/verify-email/:token?',
    name: 'Verify Email',
    title: 'Verify Email - TechVerse',
    description: 'Verify your email address',
    public: true
  },

  // User routes
  USER_DASHBOARD: {
    path: '/dashboard',
    name: 'Dashboard',
    title: 'Dashboard - TechVerse',
    description: 'User dashboard',
    roles: [UserRoles.USER],
    layout: 'user'
  },
  USER_PROFILE: {
    path: '/profile',
    name: 'Profile',
    title: 'Profile - TechVerse',
    description: 'Manage your profile',
    roles: [UserRoles.USER],
    layout: 'user'
  },
  USER_ORDERS: {
    path: '/orders',
    name: 'Orders',
    title: 'My Orders - TechVerse',
    description: 'View your orders',
    roles: [UserRoles.USER],
    layout: 'user'
  },
  USER_SETTINGS: {
    path: '/settings',
    name: 'Settings',
    title: 'Settings - TechVerse',
    description: 'Account settings',
    roles: [UserRoles.USER],
    layout: 'user'
  },

  // Admin routes
  ADMIN_DASHBOARD: {
    path: '/admin',
    name: 'Admin Dashboard',
    title: 'Admin Dashboard - TechVerse',
    description: 'Administrative dashboard',
    roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
    layout: 'admin'
  },
  ADMIN_USERS: {
    path: '/admin/users',
    name: 'User Management',
    title: 'User Management - TechVerse',
    description: 'Manage users',
    roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
    layout: 'admin',
    permissions: ['users.read', 'users.write']
  },
  ADMIN_PRODUCTS: {
    path: '/admin/products',
    name: 'Product Management',
    title: 'Product Management - TechVerse',
    description: 'Manage products',
    roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
    layout: 'admin',
    permissions: ['products.read', 'products.write']
  },
  ADMIN_ORDERS: {
    path: '/admin/orders',
    name: 'Order Management',
    title: 'Order Management - TechVerse',
    description: 'Manage orders',
    roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
    layout: 'admin',
    permissions: ['orders.read', 'orders.write']
  },
  ADMIN_ANALYTICS: {
    path: '/admin/analytics',
    name: 'Analytics',
    title: 'Analytics - TechVerse',
    description: 'View analytics and reports',
    roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
    layout: 'admin',
    permissions: ['analytics.read']
  },
  ADMIN_SETTINGS: {
    path: '/admin/settings',
    name: 'System Settings',
    title: 'System Settings - TechVerse',
    description: 'System configuration',
    roles: [UserRoles.SUPER_ADMIN],
    layout: 'admin',
    permissions: ['system.write']
  },

  // Shared authenticated routes
  CHANGE_PASSWORD: {
    path: '/change-password',
    name: 'Change Password',
    title: 'Change Password - TechVerse',
    description: 'Change your password',
    requireAuth: true
  },
  MFA_SETUP: {
    path: '/mfa-setup',
    name: 'MFA Setup',
    title: 'MFA Setup - TechVerse',
    description: 'Set up multi-factor authentication',
    requireAuth: true
  },

  // Error routes
  NOT_FOUND: {
    path: '/404',
    name: 'Not Found',
    title: '404 - Page Not Found',
    description: 'Page not found',
    public: true
  },
  UNAUTHORIZED: {
    path: '/unauthorized',
    name: 'Unauthorized',
    title: '403 - Unauthorized',
    description: 'Access denied',
    public: true
  },
  SERVER_ERROR: {
    path: '/error',
    name: 'Server Error',
    title: '500 - Server Error',
    description: 'Internal server error',
    public: true
  }
};

/**
 * Generate route guard configuration from metadata
 */
export const generateRouteGuard = (metadata) => {
  const guard = {};

  if (metadata.requireAuth || metadata.roles || metadata.permissions) {
    guard.requireAuth = true;
  }

  if (metadata.roles && metadata.roles.length > 0) {
    guard.requireRole = metadata.roles;
  }

  if (metadata.permissions && metadata.permissions.length > 0) {
    guard.requirePermission = metadata.permissions;
  }

  if (metadata.requireEmailVerified) {
    guard.requireEmailVerified = true;
  }

  return Object.keys(guard).length > 0 ? guard : null;
};

/**
 * Route groups for navigation and organization
 */
export const RouteGroups = {
  PUBLIC: {
    name: 'Public',
    routes: [
      RouteMetadata.HOME,
      RouteMetadata.LOGIN,
      RouteMetadata.REGISTER,
      RouteMetadata.FORGOT_PASSWORD,
      RouteMetadata.RESET_PASSWORD,
      RouteMetadata.VERIFY_EMAIL
    ]
  },
  USER: {
    name: 'User',
    routes: [
      RouteMetadata.USER_DASHBOARD,
      RouteMetadata.USER_PROFILE,
      RouteMetadata.USER_ORDERS,
      RouteMetadata.USER_SETTINGS
    ]
  },
  ADMIN: {
    name: 'Admin',
    routes: [
      RouteMetadata.ADMIN_DASHBOARD,
      RouteMetadata.ADMIN_USERS,
      RouteMetadata.ADMIN_PRODUCTS,
      RouteMetadata.ADMIN_ORDERS,
      RouteMetadata.ADMIN_ANALYTICS,
      RouteMetadata.ADMIN_SETTINGS
    ]
  },
  SHARED: {
    name: 'Shared',
    routes: [
      RouteMetadata.CHANGE_PASSWORD,
      RouteMetadata.MFA_SETUP
    ]
  },
  ERROR: {
    name: 'Error',
    routes: [
      RouteMetadata.NOT_FOUND,
      RouteMetadata.UNAUTHORIZED,
      RouteMetadata.SERVER_ERROR
    ]
  }
};

/**
 * Navigation configuration for different user roles
 */
export const NavigationConfig = {
  [UserRoles.USER]: [
    {
      label: 'Dashboard',
      path: RouteMetadata.USER_DASHBOARD.path,
      icon: 'dashboard'
    },
    {
      label: 'Profile',
      path: RouteMetadata.USER_PROFILE.path,
      icon: 'user'
    },
    {
      label: 'Orders',
      path: RouteMetadata.USER_ORDERS.path,
      icon: 'shopping-bag'
    },
    {
      label: 'Settings',
      path: RouteMetadata.USER_SETTINGS.path,
      icon: 'settings'
    }
  ],
  [UserRoles.ADMIN]: [
    {
      label: 'Dashboard',
      path: RouteMetadata.ADMIN_DASHBOARD.path,
      icon: 'dashboard'
    },
    {
      label: 'Users',
      path: RouteMetadata.ADMIN_USERS.path,
      icon: 'users'
    },
    {
      label: 'Products',
      path: RouteMetadata.ADMIN_PRODUCTS.path,
      icon: 'package'
    },
    {
      label: 'Orders',
      path: RouteMetadata.ADMIN_ORDERS.path,
      icon: 'shopping-cart'
    },
    {
      label: 'Analytics',
      path: RouteMetadata.ADMIN_ANALYTICS.path,
      icon: 'bar-chart'
    }
  ],
  [UserRoles.SUPER_ADMIN]: [
    {
      label: 'Dashboard',
      path: RouteMetadata.ADMIN_DASHBOARD.path,
      icon: 'dashboard'
    },
    {
      label: 'Users',
      path: RouteMetadata.ADMIN_USERS.path,
      icon: 'users'
    },
    {
      label: 'Products',
      path: RouteMetadata.ADMIN_PRODUCTS.path,
      icon: 'package'
    },
    {
      label: 'Orders',
      path: RouteMetadata.ADMIN_ORDERS.path,
      icon: 'shopping-cart'
    },
    {
      label: 'Analytics',
      path: RouteMetadata.ADMIN_ANALYTICS.path,
      icon: 'bar-chart'
    },
    {
      label: 'System Settings',
      path: RouteMetadata.ADMIN_SETTINGS.path,
      icon: 'settings'
    }
  ]
};

/**
 * Breadcrumb configuration
 */
export const BreadcrumbConfig = {
  [RouteMetadata.USER_DASHBOARD.path]: [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: RouteMetadata.USER_DASHBOARD.path }
  ],
  [RouteMetadata.USER_PROFILE.path]: [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: RouteMetadata.USER_DASHBOARD.path },
    { label: 'Profile', path: RouteMetadata.USER_PROFILE.path }
  ],
  [RouteMetadata.ADMIN_DASHBOARD.path]: [
    { label: 'Admin', path: RouteMetadata.ADMIN_DASHBOARD.path }
  ],
  [RouteMetadata.ADMIN_USERS.path]: [
    { label: 'Admin', path: RouteMetadata.ADMIN_DASHBOARD.path },
    { label: 'Users', path: RouteMetadata.ADMIN_USERS.path }
  ]
};

/**
 * Route utilities
 */
export const RouteUtils = {
  /**
   * Get route metadata by path
   */
  getRouteByPath: (path) => {
    return Object.values(RouteMetadata).find(route => route.path === path);
  },

  /**
   * Get routes by role
   */
  getRoutesByRole: (role) => {
    return Object.values(RouteMetadata).filter(route => 
      route.roles && route.roles.includes(role)
    );
  },

  /**
   * Get public routes
   */
  getPublicRoutes: () => {
    return Object.values(RouteMetadata).filter(route => route.public);
  },

  /**
   * Get protected routes
   */
  getProtectedRoutes: () => {
    return Object.values(RouteMetadata).filter(route => 
      route.requireAuth || route.roles || route.permissions
    );
  },

  /**
   * Check if route requires authentication
   */
  requiresAuth: (path) => {
    const route = RouteUtils.getRouteByPath(path);
    return route && (route.requireAuth || route.roles || route.permissions);
  },

  /**
   * Get navigation items for role
   */
  getNavigationForRole: (role) => {
    return NavigationConfig[role] || [];
  },

  /**
   * Get breadcrumbs for path
   */
  getBreadcrumbs: (path) => {
    return BreadcrumbConfig[path] || [];
  },

  /**
   * Generate route title
   */
  getRouteTitle: (path) => {
    const route = RouteUtils.getRouteByPath(path);
    return route ? route.title : 'TechVerse';
  },

  /**
   * Generate route description
   */
  getRouteDescription: (path) => {
    const route = RouteUtils.getRouteByPath(path);
    return route ? route.description : '';
  },

  /**
   * Check if path matches route pattern
   */
  matchesRoute: (currentPath, routePath) => {
    // Simple pattern matching for dynamic routes
    const routePattern = routePath.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(currentPath);
  },

  /**
   * Get active route from current path
   */
  getActiveRoute: (currentPath) => {
    return Object.values(RouteMetadata).find(route => 
      RouteUtils.matchesRoute(currentPath, route.path)
    );
  }
};

export default {
  RouteMetadata,
  RouteGroups,
  NavigationConfig,
  BreadcrumbConfig,
  RouteUtils,
  generateRouteGuard
};