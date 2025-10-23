import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start the worker
export const startMocking = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
    
    console.log('🔧 MSW: Mocking enabled');
  } catch (error) {
    console.error('Failed to start MSW:', error);
  }
};

// Stop the worker
export const stopMocking = () => {
  worker.stop();
  console.log('🔧 MSW: Mocking disabled');
};

// Reset handlers to initial state
export const resetHandlers = () => {
  worker.resetHandlers();
  console.log('🔧 MSW: Handlers reset');
};

// Use specific handlers for testing scenarios
export const useHandlers = (...newHandlers) => {
  worker.use(...newHandlers);
};

export default worker;