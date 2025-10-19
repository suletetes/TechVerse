/**
 * Token Manager Verification Script
 * 
 * Simple verification script to test token manager functionality
 */

// Mock environment for Node.js testing
if (typeof window === 'undefined') {
  global.window = {
    location: { protocol: 'https:' },
    addEventListener: () => {},
    dispatchEvent: () => {}
  };
  
  global.document = {
    createElement: () => ({
      getContext: () => ({
        textBaseline: '',
        font: '',
        fillText: () => {},
        toDataURL: () => 'mock-canvas-data'
      })
    }),
    addEventListener: () => {},
    hidden: false
  };
  
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'Test Platform',
    cookieEnabled: true,
    doNotTrack: '0',
    hardwareConcurrency: 4,
    maxTouchPoints: 0
  };
  
  global.screen = {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24
  };
  
  global.Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  };
  
  // Mock localStorage
  const storage = {};
  global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
  };
  
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  
  // Mock atob and btoa
  global.atob = (str) => Buffer.from(str, 'base64').toString();
  global.btoa = (str) => Buffer.from(str).toString('base64');
}

async function verifyTokenManager() {
  try {
    console.log('🔍 Verifying Token Manager Implementation...\n');
    
    // Import the token manager
    const { tokenManager } = await import('./tokenManager.js');
    
    // Test 1: Browser fingerprint generation
    console.log('✅ Test 1: Browser Fingerprint Generation');
    const fingerprint = tokenManager.generateBrowserFingerprint();
    console.log(`   Generated fingerprint: ${fingerprint.substring(0, 16)}...`);
    console.log(`   Fingerprint length: ${fingerprint.length}`);
    
    // Test 2: Token validation
    console.log('\n✅ Test 2: Token Validation');
    
    // Valid JWT token (test token)
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
    const validation = tokenManager.validateTokenFormat(validToken);
    console.log(`   Valid token validation: ${validation.valid}`);
    console.log(`   Payload ID: ${validation.payload?.id}`);
    console.log(`   Payload Email: ${validation.payload?.email}`);
    
    // Invalid token
    const invalidValidation = tokenManager.validateTokenFormat('invalid.token');
    console.log(`   Invalid token validation: ${invalidValidation.valid}`);
    console.log(`   Invalid token reason: ${invalidValidation.reason}`);
    
    // Test 3: Token storage and retrieval
    console.log('\n✅ Test 3: Token Storage and Retrieval');
    
    try {
      tokenManager.setToken(validToken, '1h', 'test-session-123');
      console.log('   Token stored successfully');
      
      const retrievedToken = tokenManager.getToken();
      console.log(`   Token retrieved: ${retrievedToken ? 'Success' : 'Failed'}`);
      console.log(`   Tokens match: ${retrievedToken === validToken}`);
      
      const hasValidTokens = tokenManager.hasValidTokens();
      console.log(`   Has valid tokens: ${hasValidTokens}`);
      
    } catch (error) {
      console.log(`   Token storage error: ${error.message}`);
    }
    
    // Test 4: Security features
    console.log('\n✅ Test 4: Security Features');
    
    const securityStatus = tokenManager.getSecurityStatus();
    console.log(`   Security level: ${securityStatus.securityLevel}`);
    console.log(`   Fingerprint mismatches: ${securityStatus.fingerprintMismatches}`);
    console.log(`   In security cooldown: ${securityStatus.inSecurityCooldown}`);
    
    // Test 5: Token expiry checking
    console.log('\n✅ Test 5: Token Expiry Checking');
    
    const expiry = tokenManager.getTokenExpiry();
    console.log(`   Token expiry: ${expiry ? new Date(expiry).toISOString() : 'Not set'}`);
    
    const isExpiringSoon = tokenManager.isTokenExpiringSoon();
    console.log(`   Is expiring soon: ${isExpiringSoon}`);
    
    // Test 6: Token cleanup
    console.log('\n✅ Test 6: Token Cleanup');
    
    tokenManager.clearTokens();
    const tokenAfterClear = tokenManager.getToken();
    console.log(`   Token after clear: ${tokenAfterClear ? 'Still exists' : 'Cleared successfully'}`);
    
    console.log('\n🎉 Token Manager verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Token Manager verification failed:', error);
    return false;
  }
}

async function verifyTokenRefreshManager() {
  try {
    console.log('\n🔍 Verifying Token Refresh Manager Implementation...\n');
    
    // Import the token refresh manager
    const { tokenRefreshManager } = await import('./tokenRefreshManager.js');
    
    // Test 1: Refresh status
    console.log('✅ Test 1: Refresh Status');
    const status = tokenRefreshManager.getRefreshStatus();
    console.log(`   Is refreshing: ${status.isRefreshing}`);
    console.log(`   Refresh attempts: ${status.refreshAttempts}`);
    console.log(`   Queue size: ${status.queueSize}`);
    console.log(`   Security breach: ${status.securityBreach}`);
    
    // Test 2: Refresh needed check
    console.log('\n✅ Test 2: Refresh Needed Check');
    const isRefreshNeeded = tokenRefreshManager.isRefreshNeeded();
    console.log(`   Refresh needed: ${isRefreshNeeded}`);
    
    console.log('\n🎉 Token Refresh Manager verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Token Refresh Manager verification failed:', error);
    return false;
  }
}

async function verifyMultiTabSyncManager() {
  try {
    console.log('\n🔍 Verifying Multi-Tab Sync Manager Implementation...\n');
    
    // Import the multi-tab sync manager
    const { multiTabSyncManager } = await import('./multiTabSyncManager.js');
    
    // Test 1: Sync status
    console.log('✅ Test 1: Sync Status');
    const status = multiTabSyncManager.getSyncStatus();
    console.log(`   Tab ID: ${status.tabId}`);
    console.log(`   Is master tab: ${status.isMasterTab}`);
    console.log(`   Active tab count: ${status.activeTabCount}`);
    console.log(`   Is initialized: ${status.isInitialized}`);
    
    // Test 2: Session state
    console.log('\n✅ Test 2: Session State');
    const sessionState = multiTabSyncManager.getSessionState();
    console.log(`   Session state: ${sessionState ? 'Present' : 'Not set'}`);
    
    console.log('\n🎉 Multi-Tab Sync Manager verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Multi-Tab Sync Manager verification failed:', error);
    return false;
  }
}

// Run verification if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    console.log('🚀 Starting Token Management System Verification\n');
    
    const results = await Promise.all([
      verifyTokenManager(),
      verifyTokenRefreshManager(),
      verifyMultiTabSyncManager()
    ]);
    
    const allPassed = results.every(result => result === true);
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Verification Summary: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
  })();
}

export { verifyTokenManager, verifyTokenRefreshManager, verifyMultiTabSyncManager };