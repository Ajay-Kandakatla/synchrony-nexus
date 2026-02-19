import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from './app/bootstrap';
import { AppProviders } from './app/providers';
import { App } from './app/App';
import './styles/global.css';

/**
 * Entry point — bootstraps services and mounts the React tree.
 *
 * In development, MSW intercepts all API calls with mock data
 * so the app runs fully self-contained without a backend.
 */

async function startMockWorker() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./test/mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass', // don't warn on non-API requests
    });
    console.log('[MSW] Mock API active — all API calls return mock data');
  }
}

async function main() {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');

  // Show loading state while bootstrapping
  rootEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;color:#64748b">
      <div style="text-align:center">
        <div style="width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 1rem"></div>
        <div style="font-size:0.875rem">Loading Nexus...</div>
      </div>
    </div>
  `;

  // Start mock API before bootstrapping services
  await startMockWorker();

  const services = await bootstrap();

  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <AppProviders services={services}>
        <App />
      </AppProviders>
    </StrictMode>,
  );
}

main().catch((err) => {
  console.error('[Nexus] Failed to start:', err);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif">
        <div style="text-align:center;max-width:400px;padding:2rem">
          <h1 style="font-size:1.25rem;margin:0 0 0.5rem;color:#0f172a">Failed to load</h1>
          <p style="color:#64748b;margin:0 0 1rem;font-size:0.875rem">
            Something went wrong while starting the application. Please refresh the page.
          </p>
          <button onclick="window.location.reload()" style="padding:0.5rem 1.5rem;border-radius:8px;border:none;background:#2563eb;color:white;font-size:0.875rem;cursor:pointer">
            Refresh
          </button>
        </div>
      </div>
    `;
  }
});
