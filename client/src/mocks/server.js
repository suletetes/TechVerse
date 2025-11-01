import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Setup MSW server with handlers
export const server = setupServer(...handlers);