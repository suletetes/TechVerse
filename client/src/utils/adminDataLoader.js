/**
 * Admin Data Loader Utility
 * Helps debug and manually load admin data
 */

import { adminService } from '../api/services/index.js';

export const loadAdminData = async (type = 'all') => {
  try {
    const results = {};
    
    if (type === 'all' || type === 'products') {
      const products = await adminService.getAdminProducts({ limit: 20, page: 1 });
      results.products = products;
    }
    
    if (type === 'all' || type === 'orders') {
      const orders = await adminService.getAdminOrders({ limit: 20, page: 1 });
      results.orders = orders;
    }
    
    if (type === 'all' || type === 'users') {
      const users = await adminService.getAdminUsers({ limit: 20, page: 1 });
      results.users = users;
    }
    
    if (type === 'all' || type === 'dashboard') {
      const dashboard = await adminService.getDashboardStats();
      results.dashboard = dashboard;
    }
    
    return results;
    
  } catch (error) {
    throw error;
  }
};

// Make it available globally in development
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.loadAdminData = loadAdminData;
}

export default loadAdminData;