/**
 * Debug helpers for testing the fixes
 */

// Test user profile updates
export const testProfileUpdate = async (userProfileService) => {
  try {
    console.log('🧪 Testing profile update...');
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      phone: '07700900123'
    };
    
    const result = await userProfileService.updateProfile(testData);
    console.log('✅ Profile update successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Profile update failed:', error);
    return false;
  }
};

// Test address operations
export const testAddressOperations = async (userProfileService) => {
  try {
    console.log('🧪 Testing address operations...');
    
    // Test get addresses
    const addresses = await userProfileService.getAddresses();
    console.log('✅ Get addresses successful:', addresses);
    
    // Test add address
    const newAddress = {
      firstName: 'Test',
      lastName: 'User',
      address: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
      type: 'home'
    };
    
    const addResult = await userProfileService.addAddress(newAddress);
    console.log('✅ Add address successful:', addResult);
    
    return true;
  } catch (error) {
    console.error('❌ Address operations failed:', error);
    return false;
  }
};

// Test admin dashboard data loading
export const testAdminDashboard = async (adminService) => {
  try {
    console.log('🧪 Testing admin dashboard...');
    
    const dashboardStats = await adminService.getDashboardStats();
    console.log('✅ Dashboard stats loaded:', dashboardStats);
    
    const categories = await adminService.getCategories();
    console.log('✅ Categories loaded:', categories);
    
    return true;
  } catch (error) {
    console.error('❌ Admin dashboard test failed:', error);
    return false;
  }
};

// Check if functions are being recreated (infinite refresh detection)
export const checkFunctionStability = (func, name) => {
  if (!window.debugFunctions) {
    window.debugFunctions = new Map();
  }
  
  const lastFunc = window.debugFunctions.get(name);
  if (lastFunc && lastFunc !== func) {
    console.warn(`⚠️ Function ${name} was recreated - potential infinite refresh!`);
  }
  
  window.debugFunctions.set(name, func);
};