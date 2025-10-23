// MSW setup for different environments
export { handlers } from './handlers';
export { worker, startMocking, stopMocking, resetHandlers, useHandlers } from './browser';
export { server, setupMSW } from './server';

// Development mode setup
export const setupMockingForDevelopment = async () => {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKING === 'true') {
    const { startMocking } = await import('./browser');
    await startMocking();
  }
};

// Test mode setup
export const setupMockingForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    const { setupMSW } = require('./server');
    setupMSW();
  }
};