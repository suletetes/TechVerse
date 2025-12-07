/**
 * Route Configuration System
 * 
 * Provides dynamic route configuration with role-based access control,
 * layout management, and metadata support for the TechVerse application.
 */

import React from 'react';
import { UserRoles } from '../services/authService.js';
import RouteGuard from '../components/auth/RouteGuard.jsx';

// Import layouts
import HomeLayout from '../pages/HomeLayout.jsx';
import { AdminLayout } from '../components/Admin';
import { UserProfileLayout } from '../components/UserProfile';

// Import pages
import {
    Contact,
    Category,
    Product,
    OrderConfirmation,
    PaymentPage,
    Wishlist,
    Cart,
    UserProfile,
    AdminProfile,
    Home,
    NotFound,
    OrderDetails,
    OrderTracking,
    OrderReview,
    AdminOrderManagement,
    AdminProductManagement
} from "../pages";

import {
    Privacy,
    Delivery,
    ReturnsPolicy,
    ShippingPolicy,
    Warranty,
    Stores,
    Faq
} from "../pages/info";

import {
    Signup,
    Login
} from "../pages/auth";

/**
 * Route Configuration Interface
 */
export const RouteConfigTypes = {
  path: 'string',
  component: 'ReactComponent',
  guard: 'RouteGuardConfig',
  layout: 'ReactComponent',
  meta: 'RouteMeta',
  children: 'RouteConfig[]',
  index: 'boolean',
  errorElement: 'ReactComponent'
};

/**
 * Route Guard Configuration Interface
 */
export const RouteGuardConfigTypes = {
  requireAuth: 'boolean',
  roles: 'string[]',
  permissions: 'string[]',
  requireAllPermissions: 'boolean',
  requireEmailVerified: 'boolean',
  redirect: 'string',
  fallback: 'ReactComponent'
};

/**
 * Route Metadata Interface
 */
export const RouteMetaTypes = {
  title: 'string',
  description: 'string',
  keywords: 'string[]',
  breadcrumb: 'string',
  icon: 'string',
  category: 'string',
  order: 'number',
  hidden: 'boolean',
  beta: 'boolean'
};

/**
 * Layout Components Registry
 */
export const Layouts = {
  HOME: HomeLayout,
  ADMIN: AdminLayout,
  USER: HomeLayout, // Using HomeLayout for user routes
  USER_PROFILE: UserProfileLayout,
  DEFAULT: HomeLayout
};

/**
 * Route Categories
 */
export const RouteCategories = {
  PUBLIC: 'public',
  AUTH: 'auth',
  USER: 'user',
  ADMIN: 'admin',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * Permission Constants
 */
export const Permissions = {
  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_USERS: 'admin:users',
  ADMIN_PRODUCTS: 'admin:products',
  ADMIN_ORDERS: 'admin:orders',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_SETTINGS: 'admin:settings',
  
  // User permissions
  USER_PROFILE: 'user:profile',
  USER_ORDERS: 'user:orders',
  USER_WISHLIST: 'user:wishlist',
  USER_CART: 'user:cart',
  USER_REVIEWS: 'user:reviews',
  
  // Product permissions
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_EDIT: 'product:edit',
  PRODUCT_DELETE: 'product:delete',
  
  // Order permissions
  ORDER_VIEW: 'order:view',
  ORDER_CREATE: 'order:create',
  ORDER_EDIT: 'order:edit',
  ORDER_CANCEL: 'order:cancel'
};

/**
 * Route Configuration Definitions
 */
export const routeConfigs = [
  // Public Routes
  {
    path: '/',
    component: Home,
    layout: Layouts.HOME,
    meta: {
      title: 'TechVerse - Home',
      description: 'Welcome to TechVerse - Your premier destination for technology products',
      category: RouteCategories.PUBLIC,
      order: 1
    }
  },
  {
    path: 'category',
    component: Category,
    layout: Layouts.HOME,
    meta: {
      title: 'Product Categories',
      description: 'Browse our product categories',
      category: RouteCategories.PUBLIC,
      order: 2
    }
  },
  {
    path: 'product',
    component: Product,
    layout: Layouts.HOME,
    meta: {
      title: 'Product Details',
      description: 'View product details and specifications',
      category: RouteCategories.PUBLIC,
      order: 3
    }
  },
  {
    path: 'contact',
    component: Contact,
    layout: Layouts.HOME,
    meta: {
      title: 'Contact Us',
      description: 'Get in touch with our support team',
      category: RouteCategories.PUBLIC,
      order: 4
    }
  },

  // Authentication Routes
  {
    path: 'login',
    component: Login,
    layout: Layouts.HOME,
    meta: {
      title: 'Login',
      description: 'Sign in to your TechVerse account',
      category: RouteCategories.AUTH,
      order: 1
    }
  },
  {
    path: 'signup',
    component: Signup,
    layout: Layouts.HOME,
    meta: {
      title: 'Sign Up',
      description: 'Create your TechVerse account',
      category: RouteCategories.AUTH,
      order: 2
    }
  },

  // Info Pages
  {
    path: 'privacy',
    component: Privacy,
    layout: Layouts.HOME,
    meta: {
      title: 'Privacy Policy',
      description: 'Our privacy policy and data handling practices',
      category: RouteCategories.INFO,
      order: 1
    }
  },
  {
    path: 'delivery',
    component: Delivery,
    layout: Layouts.HOME,
    meta: {
      title: 'Delivery Information',
      description: 'Delivery options and shipping information',
      category: RouteCategories.INFO,
      order: 2
    }
  },
  {
    path: 'warranty',
    component: Warranty,
    layout: Layouts.HOME,
    meta: {
      title: 'Warranty Information',
      description: 'Product warranty and support information',
      category: RouteCategories.INFO,
      order: 3
    }
  },
  {
    path: 'ReturnsPolicy',
    component: ReturnsPolicy,
    layout: Layouts.HOME,
    meta: {
      title: 'Returns Policy',
      description: 'Product return and refund policy',
      category: RouteCategories.INFO,
      order: 4
    }
  },
  {
    path: 'ShippingPolicy',
    component: ShippingPolicy,
    layout: Layouts.HOME,
    meta: {
      title: 'Shipping Policy',
      description: 'Shipping terms and conditions',
      category: RouteCategories.INFO,
      order: 5
    }
  },
  {
    path: 'faq',
    component: Faq,
    layout: Layouts.HOME,
    meta: {
      title: 'Frequently Asked Questions',
      description: 'Common questions and answers',
      category: RouteCategories.INFO,
      order: 6
    }
  },
  {
    path: 'Stores',
    component: Stores,
    layout: Layouts.HOME,
    meta: {
      title: 'Store Locations',
      description: 'Find TechVerse stores near you',
      category: RouteCategories.INFO,
      order: 7
    }
  },

  // Admin Routes - use special layout handling
  {
    path: 'admin',
    component: AdminProfile,
    layout: Layouts.ADMIN,
    guard: {
      requireAuth: true,
      roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
      permissions: [Permissions.ADMIN_DASHBOARD]
    },
    meta: {
      title: 'Admin Dashboard',
      description: 'Administrative dashboard and controls',
      category: RouteCategories.ADMIN,
      order: 1,
      breadcrumb: 'Dashboard',
      icon: 'dashboard'
    }
  },
  {
    path: 'admin/orders',
    component: AdminOrderManagement,
    layout: Layouts.ADMIN,
    guard: {
      requireAuth: true,
      roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
      permissions: [Permissions.ADMIN_ORDERS]
    },
    meta: {
      title: 'Order Management',
      description: 'Manage customer orders and fulfillment',
      category: RouteCategories.ADMIN,
      order: 2,
      breadcrumb: 'Orders',
      icon: 'orders'
    }
  },
  {
    path: 'admin/products',
    component: AdminProductManagement,
    layout: Layouts.ADMIN,
    guard: {
      requireAuth: true,
      roles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
      permissions: [Permissions.ADMIN_PRODUCTS]
    },
    meta: {
      title: 'Product Management',
      description: 'Manage product catalog and inventory',
      category: RouteCategories.ADMIN,
      order: 3,
      breadcrumb: 'Products',
      icon: 'products'
    }
  },

  // User Routes - use special layout handling
  {
    path: 'user',
    component: UserProfile,
    layout: Layouts.USER_PROFILE,
    guard: {
      requireAuth: true,
      roles: [UserRoles.USER]
    },
    meta: {
      title: 'User Profile',
      description: 'Manage your profile and account settings',
      category: RouteCategories.USER,
      order: 1,
      breadcrumb: 'Profile',
      icon: 'user'
    }
  },
  {
    path: 'user/order/:orderId',
    component: OrderDetails,
    layout: Layouts.USER,
    guard: {
      requireAuth: true,
      roles: [UserRoles.USER],
      permissions: [Permissions.USER_ORDERS]
    },
    meta: {
      title: 'Order Details',
      description: 'View detailed order information',
      category: RouteCategories.USER,
      order: 2,
      breadcrumb: 'Order Details',
      icon: 'order'
    }
  },
  {
    path: 'user/order/:orderId/tracking',
    component: OrderTracking,
    layout: Layouts.USER,
    guard: {
      requireAuth: true,
      roles: [UserRoles.USER],
      permissions: [Permissions.USER_ORDERS]
    },
    meta: {
      title: 'Order Tracking',
      description: 'Track your order status and delivery',
      category: RouteCategories.USER,
      order: 3,
      breadcrumb: 'Order Tracking',
      icon: 'tracking'
    }
  },
  {
    path: 'user/order/:orderId/review',
    component: OrderReview,
    layout: Layouts.USER,
    guard: {
      requireAuth: true,
      roles: [UserRoles.USER],
      permissions: [Permissions.USER_REVIEWS]
    },
    meta: {
      title: 'Order Review',
      description: 'Review and rate your purchase',
      category: RouteCategories.USER,
      order: 4,
      breadcrumb: 'Order Review',
      icon: 'review'
    }
  },

  // Authenticated Routes (any role)
  {
    path: 'order-confirmation',
    component: OrderConfirmation,
    layout: Layouts.HOME,
    guard: {
      requireAuth: true
    },
    meta: {
      title: 'Order Confirmation',
      description: 'Your order has been confirmed',
      category: RouteCategories.USER,
      order: 5
    }
  },
  {
    path: 'payment',
    component: PaymentPage,
    layout: Layouts.HOME,
    guard: {
      requireAuth: true
    },
    meta: {
      title: 'Payment',
      description: 'Complete your payment securely',
      category: RouteCategories.USER,
      order: 6
    }
  },
  {
    path: 'wishlist',
    component: Wishlist,
    layout: Layouts.HOME,
    guard: {
      requireAuth: true,
      permissions: [Permissions.USER_WISHLIST]
    },
    meta: {
      title: 'Wishlist',
      description: 'Your saved products and favorites',
      category: RouteCategories.USER,
      order: 7,
      icon: 'heart'
    }
  },
  {
    path: 'cart',
    component: Cart,
    layout: Layouts.HOME,
    guard: {
      requireAuth: true,
      permissions: [Permissions.USER_CART]
    },
    meta: {
      title: 'Shopping Cart',
      description: 'Review items in your cart',
      category: RouteCategories.USER,
      order: 8,
      icon: 'cart'
    }
  },

  // Error Routes
  {
    path: 'unauthorized',
    component: () => (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Go Home
          </a>
        </div>
      </div>
    ),
    layout: Layouts.HOME,
    meta: {
      title: 'Access Denied',
      description: 'You do not have permission to access this page',
      category: RouteCategories.ERROR,
      hidden: true
    }
  },
  {
    path: '*',
    component: NotFound,
    layout: Layouts.HOME,
    meta: {
      title: 'Page Not Found',
      description: 'The requested page could not be found',
      category: RouteCategories.ERROR,
      hidden: true
    }
  }
];

/**
 * Generate routes from configuration
 * @param {Array} configs - Route configurations
 * @returns {Array} React Router route objects
 */
export const generateRoutes = (configs = routeConfigs) => {
  return configs.map(config => {
    const {
      path,
      component: Component,
      layout: Layout = Layouts.DEFAULT,
      guard,
      meta,
      children,
      index,
      errorElement
    } = config;

    // Create the route element
    let element;

    // Special handling for admin and user routes that need their own layouts
    const needsSpecialLayout = Layout === Layouts.ADMIN || Layout === Layouts.USER;

    if (needsSpecialLayout) {
      // For admin/user routes, use their specific layout and bypass HomeLayout
      if (guard) {
        element = (
          <RouteGuard {...guard}>
            <Layout>
              <Component />
            </Layout>
          </RouteGuard>
        );
      } else {
        element = (
          <Layout>
            <Component />
          </Layout>
        );
      }
    } else {
      // For regular routes, just apply guard if needed (HomeLayout is handled at router level)
      if (guard) {
        element = (
          <RouteGuard {...guard}>
            <Component />
          </RouteGuard>
        );
      } else {
        element = <Component />;
      }
    }

    // Build route object
    const route = {
      path,
      element,
      ...(index && { index }),
      ...(errorElement && { errorElement }),
      ...(meta && { handle: { meta } })
    };

    // Add children if present
    if (children && children.length > 0) {
      route.children = generateRoutes(children);
    }

    return route;
  });
};

/**
 * Get routes by category
 * @param {string} category - Route category
 * @returns {Array} Filtered route configurations
 */
export const getRoutesByCategory = (category) => {
  return routeConfigs.filter(config => 
    config.meta?.category === category && !config.meta?.hidden
  );
};

/**
 * Get route configuration by path
 * @param {string} path - Route path
 * @returns {Object|null} Route configuration
 */
export const getRouteConfig = (path) => {
  return routeConfigs.find(config => config.path === path) || null;
};

/**
 * Get navigation items for a category
 * @param {string} category - Route category
 * @returns {Array} Navigation items
 */
export const getNavigationItems = (category) => {
  return getRoutesByCategory(category)
    .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
    .map(config => ({
      path: config.path,
      title: config.meta?.breadcrumb || config.meta?.title,
      icon: config.meta?.icon,
      order: config.meta?.order,
      beta: config.meta?.beta
    }));
};

/**
 * Check if user can access route
 * @param {string} path - Route path
 * @param {Object} user - Current user
 * @returns {boolean} Whether user can access route
 */
export const canAccessRoute = (path, user) => {
  const config = getRouteConfig(path);
  if (!config || !config.guard) {
    return true; // Public route
  }

  const { requireAuth, roles, permissions, requireAllPermissions = true } = config.guard;

  // Check authentication
  if (requireAuth && !user) {
    return false;
  }

  // Check roles
  if (roles && roles.length > 0) {
    if (!user?.role || !roles.includes(user.role)) {
      return false;
    }
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const userPermissions = user?.permissions || [];
    
    if (requireAllPermissions) {
      return permissions.every(permission => userPermissions.includes(permission));
    } else {
      return permissions.some(permission => userPermissions.includes(permission));
    }
  }

  return true;
};

/**
 * Get breadcrumb trail for a path
 * @param {string} path - Current path
 * @returns {Array} Breadcrumb items
 */
export const getBreadcrumbs = (path) => {
  const breadcrumbs = [];
  const pathSegments = path.split('/').filter(Boolean);
  
  // Always start with home
  breadcrumbs.push({
    title: 'Home',
    path: '/',
    active: path === '/'
  });

  // Build breadcrumb trail
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = getRouteConfig(currentPath);
    
    if (config && config.meta?.breadcrumb) {
      breadcrumbs.push({
        title: config.meta.breadcrumb,
        path: currentPath,
        active: index === pathSegments.length - 1
      });
    }
  });

  return breadcrumbs;
};

/**
 * Validate route configuration
 * @param {Object} config - Route configuration
 * @returns {Array} Validation errors
 */
export const validateRouteConfig = (config) => {
  const errors = [];

  if (!config.path) {
    errors.push('Route path is required');
  }

  if (!config.component) {
    errors.push('Route component is required');
  }

  if (config.guard) {
    if (config.guard.roles && !Array.isArray(config.guard.roles)) {
      errors.push('Guard roles must be an array');
    }

    if (config.guard.permissions && !Array.isArray(config.guard.permissions)) {
      errors.push('Guard permissions must be an array');
    }
  }

  return errors;
};

export default {
  routeConfigs,
  generateRoutes,
  getRoutesByCategory,
  getRouteConfig,
  getNavigationItems,
  canAccessRoute,
  getBreadcrumbs,
  validateRouteConfig,
  Layouts,
  RouteCategories,
  Permissions
};