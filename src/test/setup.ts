import '@testing-library/jest-dom/vitest';

/**
 * Test setup — global configuration for Vitest + Testing Library.
 */

// Mock crypto.randomUUID for deterministic tests
if (!globalThis.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => `test-uuid-${++counter}`,
    },
  });
}
