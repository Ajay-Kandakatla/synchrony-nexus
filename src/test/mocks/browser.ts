import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW browser worker — intercepts API calls in development.
 * This allows the app to run fully self-contained without a backend.
 */
export const worker = setupWorker(...handlers);
