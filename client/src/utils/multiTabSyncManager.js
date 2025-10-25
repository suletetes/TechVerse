/**
 * Multi-Tab Session Synchronization Manager
 * 
 * Handles session state synchronization across browser tabs,
 * logout propagation, and session conflict resolution.
 */

import { tokenManager } from './tokenManager.js';
import { tokenRefreshManager } from './tokenRefreshManager.js';

// Synchronization configuration
const SYNC_CONFIG = {
  HEARTBEAT_INTERVAL: 5000, // 5 seconds
  TAB_TIMEOUT: 30000, // 30 seconds before considering tab inactive
  SYNC_EVENTS: {
    LOGIN: 'techverse_login',
    LOGOUT: 'techverse_logout',
    TOKEN_REFRESH: 'techverse_token_refresh',
    SESSION_UPDATE: 'techverse_session_update',
    HEARTBEAT: 'techverse_heartbeat',
    TAB_REGISTER: 'techverse_tab_register',
    TAB_UNREGISTER: 'techverse_tab_unregister',
    SECURITY_BREACH: 'techverse_security_breach'
  },
  STORAGE_KEYS: {
    ACTIVE_TABS: 'techverse_active_tabs',
    MASTER_TAB: 'techverse_master_tab',
    LAST_ACTIVITY: 'techverse_last_activity',
    SESSION_STATE: 'techverse_session_state'
  }
};

class MultiTabSyncManager {
  constructor() {
    this.tabId = this.generateTabId();
    this.isMasterTab = false;
    this.heartbeatInterval = null;
    this.syncListeners = [];
    this.isInitialized = false;
    
    // Initialize synchronization
    this.initialize();
  }

  /**
   * Initialize multi-tab synchronization
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Register this tab
    this.registerTab();
    
    // Set up storage event listeners
    this.setupStorageListeners();
    
    // Set up heartbeat
    this.startHeartbeat();
    
    // Set up cleanup on page unload
    this.setupCleanup();
    
    // Check if we should become master tab
    this.checkMasterTabStatus();
    
    this.isInitialized = true;
    
    // Multi-tab sync initialized silently
  }

  /**
   * Generate unique tab ID
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register this tab as active
   */
  registerTab() {
    const activeTabs = this.getActiveTabs();
    activeTabs[this.tabId] = {
      id: this.tabId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    this.setActiveTabs(activeTabs);
    this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.TAB_REGISTER, {
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }

  /**
   * Unregister this tab
   */
  unregisterTab() {
    const activeTabs = this.getActiveTabs();
    delete activeTabs[this.tabId];
    this.setActiveTabs(activeTabs);
    
    this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.TAB_UNREGISTER, {
      tabId: this.tabId,
      timestamp: Date.now()
    });
    
    // If we were master tab, trigger master tab election
    if (this.isMasterTab) {
      localStorage.removeItem(SYNC_CONFIG.STORAGE_KEYS.MASTER_TAB);
    }
  }

  /**
   * Get active tabs from storage
   */
  getActiveTabs() {
    try {
      const tabs = localStorage.getItem(SYNC_CONFIG.STORAGE_KEYS.ACTIVE_TABS);
      return tabs ? JSON.parse(tabs) : {};
    } catch (error) {
      console.warn('Failed to parse active tabs:', error);
      return {};
    }
  }

  /**
   * Set active tabs in storage
   */
  setActiveTabs(tabs) {
    try {
      localStorage.setItem(SYNC_CONFIG.STORAGE_KEYS.ACTIVE_TABS, JSON.stringify(tabs));
    } catch (error) {
      console.error('Failed to store active tabs:', error);
    }
  }

  /**
   * Clean up inactive tabs
   */
  cleanupInactiveTabs() {
    const activeTabs = this.getActiveTabs();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(activeTabs).forEach(tabId => {
      const tab = activeTabs[tabId];
      if (now - tab.timestamp > SYNC_CONFIG.TAB_TIMEOUT) {
        delete activeTabs[tabId];
        hasChanges = true;
        // Cleaned up inactive tab silently
      }
    });
    
    if (hasChanges) {
      this.setActiveTabs(activeTabs);
    }
    
    return Object.keys(activeTabs).length;
  }

  /**
   * Check and update master tab status
   */
  checkMasterTabStatus() {
    const masterTabId = localStorage.getItem(SYNC_CONFIG.STORAGE_KEYS.MASTER_TAB);
    const activeTabs = this.getActiveTabs();
    
    // If no master tab or master tab is inactive, elect new master
    if (!masterTabId || !activeTabs[masterTabId]) {
      this.electMasterTab();
    } else if (masterTabId === this.tabId) {
      this.isMasterTab = true;
    }
  }

  /**
   * Elect new master tab
   */
  electMasterTab() {
    const activeTabs = this.getActiveTabs();
    const tabIds = Object.keys(activeTabs);
    
    if (tabIds.length === 0) return;
    
    // Sort by timestamp to get the oldest tab
    const sortedTabs = tabIds.sort((a, b) => 
      activeTabs[a].timestamp - activeTabs[b].timestamp
    );
    
    const newMasterTabId = sortedTabs[0];
    
    if (newMasterTabId === this.tabId) {
      this.isMasterTab = true;
      localStorage.setItem(SYNC_CONFIG.STORAGE_KEYS.MASTER_TAB, this.tabId);
      // Elected as master tab silently
      
      // Master tab responsibilities
      this.handleMasterTabDuties();
    }
  }

  /**
   * Handle master tab responsibilities
   */
  handleMasterTabDuties() {
    // Master tab handles token refresh coordination
    if (tokenRefreshManager) {
      tokenRefreshManager.addRefreshListener((event) => {
        if (event.type === 'success') {
          this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.TOKEN_REFRESH, {
            tokens: event.data.tokens,
            user: event.data.user,
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Master tab handles session state updates
    this.syncSessionState();
  }

  /**
   * Set up storage event listeners for cross-tab communication
   */
  setupStorageListeners() {
    window.addEventListener('storage', (event) => {
      this.handleStorageEvent(event);
    });
    
    // Listen for custom events
    Object.values(SYNC_CONFIG.SYNC_EVENTS).forEach(eventType => {
      window.addEventListener(eventType, (event) => {
        this.handleSyncEvent(eventType, event.detail);
      });
    });
  }

  /**
   * Handle storage events from other tabs
   */
  handleStorageEvent(event) {
    const { key, newValue, oldValue } = event;
    
    // Handle token changes
    if (key?.includes('techverse_token') && newValue !== oldValue) {
      if (newValue === null) {
        // Token was cleared - logout
        this.handleCrossTabLogout();
      } else {
        // Token was updated - sync
        this.handleCrossTabTokenUpdate();
      }
    }
    
    // Handle session state changes
    if (key === SYNC_CONFIG.STORAGE_KEYS.SESSION_STATE) {
      this.handleSessionStateChange(newValue);
    }
    
    // Handle master tab changes
    if (key === SYNC_CONFIG.STORAGE_KEYS.MASTER_TAB) {
      this.checkMasterTabStatus();
    }
    
    // Handle active tabs changes
    if (key === SYNC_CONFIG.STORAGE_KEYS.ACTIVE_TABS) {
      this.handleActiveTabsChange();
    }
  }

  /**
   * Handle sync events from other tabs
   */
  handleSyncEvent(eventType, data) {
    switch (eventType) {
      case SYNC_CONFIG.SYNC_EVENTS.LOGIN:
        this.handleCrossTabLogin(data);
        break;
      case SYNC_CONFIG.SYNC_EVENTS.LOGOUT:
        this.handleCrossTabLogout(data);
        break;
      case SYNC_CONFIG.SYNC_EVENTS.TOKEN_REFRESH:
        this.handleCrossTabTokenRefresh(data);
        break;
      case SYNC_CONFIG.SYNC_EVENTS.SECURITY_BREACH:
        this.handleCrossTabSecurityBreach(data);
        break;
      case SYNC_CONFIG.SYNC_EVENTS.HEARTBEAT:
        this.handleHeartbeat(data);
        break;
    }
  }

  /**
   * Handle cross-tab login
   */
  handleCrossTabLogin(data) {
    // Cross-tab login detected silently
    
    // Notify sync listeners
    this.notifySyncListeners('login', data);
    
    // Update session state
    this.updateSessionState({
      isAuthenticated: true,
      user: data.user,
      timestamp: data.timestamp
    });
  }

  /**
   * Handle cross-tab logout
   */
  handleCrossTabLogout(data = {}) {
    // Cross-tab logout detected silently
    
    // Clear local auth state without API call (already done by originating tab)
    tokenManager.clearTokens();
    
    // Notify sync listeners
    this.notifySyncListeners('logout', data);
    
    // Update session state
    this.updateSessionState({
      isAuthenticated: false,
      user: null,
      timestamp: Date.now()
    });
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.href = '/login?reason=cross_tab_logout';
      }, 500);
    }
  }

  /**
   * Handle cross-tab token refresh
   */
  handleCrossTabTokenRefresh(data) {
    // Cross-tab token refresh detected silently
    
    // Update local tokens (they should already be updated via storage events)
    if (data.tokens) {
      // Verify tokens are actually updated
      const currentToken = tokenManager.getToken();
      if (currentToken !== data.tokens.accessToken) {
        // Syncing refreshed tokens from other tab silently
        tokenManager.setToken(
          data.tokens.accessToken,
          data.tokens.expiresIn,
          data.tokens.sessionId
        );
      }
    }
    
    // Notify sync listeners
    this.notifySyncListeners('tokenRefresh', data);
  }

  /**
   * Handle cross-tab security breach
   */
  handleCrossTabSecurityBreach(data) {
    // Cross-tab security breach detected
    
    // Clear tokens immediately
    tokenManager.clearTokens();
    
    // Notify sync listeners
    this.notifySyncListeners('securityBreach', data);
    
    // Redirect to login with security warning
    setTimeout(() => {
      window.location.href = '/login?reason=security_breach';
    }, 1000);
  }

  /**
   * Handle heartbeat from other tabs
   */
  handleHeartbeat(data) {
    // Update tab activity
    const activeTabs = this.getActiveTabs();
    if (activeTabs[data.tabId]) {
      activeTabs[data.tabId].timestamp = data.timestamp;
      this.setActiveTabs(activeTabs);
    }
  }

  /**
   * Handle active tabs change
   */
  handleActiveTabsChange() {
    // Check if we need to become master tab
    this.checkMasterTabStatus();
    
    // Clean up inactive tabs
    this.cleanupInactiveTabs();
  }

  /**
   * Handle session state change
   */
  handleSessionStateChange(newStateJson) {
    try {
      const newState = newStateJson ? JSON.parse(newStateJson) : null;
      this.notifySyncListeners('sessionStateChange', newState);
    } catch (error) {
      console.error('Failed to parse session state:', error);
    }
  }

  /**
   * Broadcast event to other tabs
   */
  broadcastEvent(eventType, data) {
    // Use localStorage to trigger storage events in other tabs
    const eventData = {
      type: eventType,
      data,
      tabId: this.tabId,
      timestamp: Date.now()
    };
    
    const eventKey = `${eventType}_${Date.now()}_${Math.random()}`;
    localStorage.setItem(eventKey, JSON.stringify(eventData));
    
    // Clean up event key after a short delay
    setTimeout(() => {
      localStorage.removeItem(eventKey);
    }, 1000);
  }

  /**
   * Sync login across tabs
   */
  syncLogin(user, tokens) {
    this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.LOGIN, {
      user,
      tokens,
      timestamp: Date.now()
    });
    
    this.updateSessionState({
      isAuthenticated: true,
      user,
      timestamp: Date.now()
    });
  }

  /**
   * Sync logout across tabs
   */
  syncLogout(reason = 'user_initiated') {
    this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.LOGOUT, {
      reason,
      timestamp: Date.now()
    });
    
    this.updateSessionState({
      isAuthenticated: false,
      user: null,
      timestamp: Date.now()
    });
  }

  /**
   * Sync security breach across tabs
   */
  syncSecurityBreach(breachType, details = {}) {
    this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.SECURITY_BREACH, {
      breachType,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Update session state
   */
  updateSessionState(state) {
    try {
      localStorage.setItem(SYNC_CONFIG.STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
      localStorage.setItem(SYNC_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update session state:', error);
    }
  }

  /**
   * Get current session state
   */
  getSessionState() {
    try {
      const state = localStorage.getItem(SYNC_CONFIG.STORAGE_KEYS.SESSION_STATE);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Failed to get session state:', error);
      return null;
    }
  }

  /**
   * Sync session state (master tab responsibility)
   */
  syncSessionState() {
    if (!this.isMasterTab) return;
    
    const hasToken = !!tokenManager.getToken();
    const storedUser = localStorage.getItem('techverse_user');
    let user = null;
    
    try {
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.warn('Failed to parse stored user:', error);
    }
    
    this.updateSessionState({
      isAuthenticated: hasToken && !!user,
      user,
      timestamp: Date.now()
    });
  }

  /**
   * Start heartbeat to keep tab active
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // Update our tab timestamp
      const activeTabs = this.getActiveTabs();
      if (activeTabs[this.tabId]) {
        activeTabs[this.tabId].timestamp = Date.now();
        this.setActiveTabs(activeTabs);
      }
      
      // Broadcast heartbeat
      this.broadcastEvent(SYNC_CONFIG.SYNC_EVENTS.HEARTBEAT, {
        tabId: this.tabId,
        timestamp: Date.now()
      });
      
      // Clean up inactive tabs (master tab responsibility)
      if (this.isMasterTab) {
        this.cleanupInactiveTabs();
      }
    }, SYNC_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Set up cleanup on page unload
   */
  setupCleanup() {
    const cleanup = () => {
      this.unregisterTab();
      this.stopHeartbeat();
    };
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Also clean up on page hide (mobile browsers)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, but don't unregister yet
        // Just update timestamp to indicate reduced activity
      } else {
        // Page is visible again, refresh heartbeat
        this.registerTab();
      }
    });
  }

  /**
   * Add sync event listener
   */
  addSyncListener(listener) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify sync listeners
   */
  notifySyncListeners(type, data) {
    this.syncListeners.forEach(listener => {
      try {
        listener({ type, data, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    const activeTabs = this.getActiveTabs();
    const sessionState = this.getSessionState();
    
    return {
      tabId: this.tabId,
      isMasterTab: this.isMasterTab,
      activeTabCount: Object.keys(activeTabs).length,
      activeTabs,
      sessionState,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Force sync with other tabs
   */
  forceSync() {
    this.syncSessionState();
    this.checkMasterTabStatus();
    this.cleanupInactiveTabs();
  }
}

// Create and export singleton instance
export const multiTabSyncManager = new MultiTabSyncManager();

export default multiTabSyncManager;