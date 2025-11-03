/**
 * Admin Data Loader Utility
 * Helps debug and manually load admin data
 */

import { adminService } from '../api/services/index.js';

export const loadAdminData = async (type = 'all') => {
  console.log(`🔄 Loading admin data: ${type}`);
  
  try {
    const results = {};
    
    if (type === 'all' || type === 'products') {
      console.log('📦 Loading products...');
      const products = await adminService.getAdminProducts({ limit: 20, page: 1 });
      results.products = products;
      console.log('✅ Products loaded:', products.data?.products?.length || 0);
    }
    
    if (type === 'all' || type === 'orders') {
      console.log('📋 Loading orders...');
      const orders = await adminService.getAdminOrders({ limit: 20, page: 1 });
      results.orders = orders;
      console.log('✅ Orders loaded:', orders.data?.orders?.length || 0);
    }
    
    if (type === 'all' || type === 'users') {
      console.log('👥 Loading users...');
      const users = await adminService.getAdminUsers({ limit: 20, page: 1 });
      results.users = users;
      console.log('✅ Users loaded:', users.data?.users?.length || 0);
    }
    
    if (type === 'all' || type === 'dashboard') {
      console.log('📊 Loading dashboard stats...');
      const dashboard = await adminService.getDashboardStats();
      results.dashboard = dashboard;
      console.log('✅ Dashboard stats loaded');
    }
    
    console.log('🎉 Admin data loading complete:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error loading admin data:', error);
    
    if (error.message.includes('Token refresh disabled')) {
      console.log('🔧 Authentication issue detected. Try: window.resetTechVerseAuth()');
    }
    
    throw error;
  }
};

// Make it available globally in development
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.loadAdminData = loadAdminData;
  console.log('🔧 Development helper: window.loadAdminData(type)');
  console.log('   Types: "products", "orders", "users", "dashboard", "all"');
}

export default loadAdminData;