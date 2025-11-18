/**
 * Comprehensive Data Persistence Debugger
 * This will help us identify exactly where data updates are failing
 */

class DataDebugger {
  constructor() {
    this.logs = [];
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('debug') === 'true';
  }

  log(category, action, data, error = null) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      error: error ? error.message : null,
      stack: error ? error.stack : null
    };

    this.logs.push(logEntry);
    
    const emoji = error ? '❌' : '✅';
    const style = error ? 'color: red; font-weight: bold;' : 'color: green;';
    
    console.group(`%c${emoji} ${category} - ${action}`, style);
    console.log('Data:', data);
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  // Test API endpoints
  async testEndpoint(url, method = 'GET', data = null) {
    this.log('API_TEST', `Testing ${method} ${url}`, { url, method, data });
    
    try {
      const token = localStorage.getItem('accessToken');
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.message || 'Unknown error'}`);
      }

      this.log('API_TEST', `${method} ${url} SUCCESS`, result);
      return result;
    } catch (error) {
      this.log('API_TEST', `${method} ${url} FAILED`, { url, method, data }, error);
      throw error;
    }
  }

  // Test user profile operations
  async testUserProfileOperations() {
    console.log('🧪 Testing User Profile Operations...');
    
    try {
      // Test get profile
      await this.testEndpoint('/api/users/profile');
      
      // Test update profile
      const updateData = {
        firstName: 'Test',
        lastName: 'User',
        phone: '07700900123'
      };
      await this.testEndpoint('/api/users/profile', 'PUT', updateData);
      
      // Test get addresses
      await this.testEndpoint('/api/users/addresses');
      
      // Test get payment methods
      await this.testEndpoint('/api/users/payment-methods');
      
      console.log('✅ All user profile operations tested successfully');
      return true;
    } catch (error) {
      console.error('❌ User profile operations failed:', error);
      return false;
    }
  }

  // Test admin operations
  async testAdminOperations() {
    console.log('🧪 Testing Admin Operations...');
    
    try {
      // Test dashboard stats
      await this.testEndpoint('/api/admin/dashboard');
      
      // Test categories
      await this.testEndpoint('/api/admin/categories');
      
      // Test products
      await this.testEndpoint('/api/admin/products');
      
      console.log('✅ All admin operations tested successfully');
      return true;
    } catch (error) {
      console.error('❌ Admin operations failed:', error);
      return false;
    }
  }

  // Get debug report
  getReport() {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter(log => log.error),
      categories: [...new Set(this.logs.map(log => log.category))],
      recentLogs: this.logs.slice(-20),
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const categories = {};
    this.logs.forEach(log => {
      if (!categories[log.category]) {
        categories[log.category] = { total: 0, errors: 0, success: 0 };
      }
      categories[log.category].total++;
      if (log.error) {
        categories[log.category].errors++;
      } else {
        categories[log.category].success++;
      }
    });
    return categories;
  }

  // Clear logs
  clear() {
    this.logs = [];
    console.clear();
    console.log('🧹 Debug logs cleared');
  }

  // Export logs for analysis
  export() {
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Global debugger instance
export const dataDebugger = new DataDebugger();

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.dataDebugger = dataDebugger;
}

export default dataDebugger;