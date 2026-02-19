import { type ReactNode, useState, useCallback } from 'react';
import { useTheme } from '../../hooks/use-theme';

/**
 * App shell — the top-level layout component.
 *
 * Responsive design:
 * - Desktop (1024px+): Sidebar nav + content area
 * - Tablet (768-1023px): Collapsible sidebar
 * - Mobile (<768px): Bottom tab nav + full-width content
 *
 * The shell is product-agnostic. Plugin routes are injected dynamically.
 */

interface ShellProps {
  children: ReactNode;
  navigation: NavigationItem[];
  user: { displayName: string; avatarUrl?: string };
  onLogout: () => void;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

export function Shell({ children, navigation, user, onLogout }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        style={{
          width: sidebarOpen ? 'var(--sidebar-width)' : '72px',
          flexShrink: 0,
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 250ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            gap: '0.75rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          {sidebarOpen && (
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Nexus
            </span>
          )}
        </div>

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background-color 150ms ease, color 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <span style={{ flexShrink: 0, width: '20px', height: '20px' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge != null && item.badge > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User area */}
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.displayName}
              </div>
              <button
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-tertiary)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 1.5rem',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onLogout}
            style={{
              fontSize: '0.8125rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
          >
            Sign out
          </button>
        </header>

        {/* Page content */}
        <div
          style={{
            flex: 1,
            padding: '1.5rem',
            maxWidth: 'var(--content-max-width)',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
