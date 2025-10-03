// Test configuration and constants
export const TEST_ROUTES = {
  USER_PROFILE: '/user',
  USER_PROFILE_ORDERS: '/user?tab=orders',
  USER_PROFILE_ADDRESSES: '/user?tab=addresses',
  USER_PROFILE_PAYMENTS: '/user?tab=payments',
  USER_PROFILE_ACTIVITY: '/user?tab=activity',
  USER_PROFILE_PREFERENCES: '/user?tab=preferences',
};

export const VALID_TABS = [
  'profile',
  'orders', 
  'addresses',
  'payments',
  'activity',
  'preferences'
];

export const TEST_SCENARIOS = {
  URL_PARAMS: [
    { url: '/user', expectedTab: null, description: 'No tab parameter' },
    { url: '/user?tab=orders', expectedTab: 'orders', description: 'Orders tab' },
    { url: '/user?tab=addresses', expectedTab: 'addresses', description: 'Addresses tab' },
    { url: '/user?tab=payments', expectedTab: 'payments', description: 'Payments tab' },
    { url: '/user?tab=activity', expectedTab: 'activity', description: 'Activity tab' },
    { url: '/user?tab=preferences', expectedTab: 'preferences', description: 'Preferences tab' },
    { url: '/user?tab=', expectedTab: '', description: 'Empty tab parameter' },
    { url: '/user?tab=invalid', expectedTab: 'invalid', description: 'Invalid tab parameter' },
    { url: '/user?other=value&tab=orders', expectedTab: 'orders', description: 'Tab with other parameters' },
    { url: '/user?tab=orders&sort=date', expectedTab: 'orders', description: 'Tab with additional parameters' },
  ]
};

export const MOCK_COMPONENTS = {
  USER_PROFILE_LAYOUT: 'user-profile-layout',
  INITIAL_TAB: 'initial-tab',
  TAB_TYPE: 'tab-type',
  PROFILE_LAYOUT: 'profile-layout',
  ACTIVE_TAB: 'active-tab',
  TAB_CONTENT: 'tab-content',
};

export default {
  TEST_ROUTES,
  VALID_TABS,
  TEST_SCENARIOS,
  MOCK_COMPONENTS,
};