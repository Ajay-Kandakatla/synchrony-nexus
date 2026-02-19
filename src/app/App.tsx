import { type ReactNode, useState, Suspense, lazy } from 'react';
import { Shell, type NavigationItem } from '../shared/components/layout/Shell';
import { ErrorBoundary, DefaultErrorFallback } from '../shared/components/feedback/error-boundary';
import { DemoBanner } from '../shared/components/feedback/DemoBanner';
import { useServices } from './providers';

/**
 * App — the root component.
 *
 * Responsibilities:
 * - Renders the shell layout
 * - Manages top-level navigation
 * - Routes to domain modules (lazy loaded)
 * - Renders the AI copilot panel
 * - Renders the nudge overlay
 */

// Lazy-loaded domain modules for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreditHealth = lazy(() => import('./pages/CreditHealth'));
const Payments = lazy(() => import('./pages/Payments'));
const Disputes = lazy(() => import('./pages/Disputes'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AICoPilot = lazy(() => import('./pages/AICoPilot'));

// Navigation items — plugins can inject additional items
const coreNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'credit-health',
    label: 'Credit Health',
    href: '/credit-health',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: 'disputes',
    label: 'Disputes',
    href: '/disputes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      </svg>
    ),
  },
  {
    id: 'ai-copilot',
    label: 'AI Co-Pilot',
    href: '/ai-copilot',
    badge: 3,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

// Simple client-side route matching
function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  // Listen for popstate (back/forward)
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => setPath(window.location.pathname));
  }

  return path;
}

export function App(): ReactNode {
  const { authService } = useServices();
  const route = useRoute();

  return (
    <>
    <DemoBanner />
    <ErrorBoundary
      scope="app"
      fallback={(error, reset) => (
        <DefaultErrorFallback error={error} onRetry={reset} scope="app" />
      )}
    >
      <Shell
        navigation={coreNavigation}
        user={{ displayName: 'Ajay K.' }}
        onLogout={() => authService.logout()}
      >
        <Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            </div>
          }
        >
          {route === '/' && <Dashboard />}
          {route === '/payments' && <Payments />}
          {route === '/credit-health' && <CreditHealth />}
          {route === '/disputes' && <Disputes />}
          {route === '/marketplace' && <Marketplace />}
          {route === '/ai-copilot' && <AICoPilot />}
        </Suspense>
      </Shell>
    </ErrorBoundary>
    </>
  );
}
