import { type ReactNode, useState, useEffect, type CSSProperties } from 'react';

/**
 * DemoBanner -- a fixed banner that indicates the app is running with
 * simulated data.  It sits above every page at the top of the viewport
 * (z-index 9999) and can be dismissed by the user.  Dismissal persists
 * across sessions via localStorage.
 *
 * Usage:
 *   Render <DemoBanner /> as a sibling above <ErrorBoundary> in App.tsx
 *   so that it is always visible regardless of error state.
 *
 * To remove this banner in production, delete or conditionally render it
 * behind a feature flag / environment check.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nexus:demo-banner-dismissed';
const BANNER_HEIGHT = 40;

// ---------------------------------------------------------------------------
// Keyframe style element (injected once)
// ---------------------------------------------------------------------------

let keyframesInjected = false;

function injectKeyframes(): void {
  if (keyframesInjected) return;
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes nexus-demo-pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }
    @keyframes nexus-demo-fade-in {
      from { opacity: 0; transform: translateY(-100%); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  keyframesInjected = true;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const bannerStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: `${BANNER_HEIGHT}px`,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  background: 'linear-gradient(135deg, var(--color-primary, #2563eb) 0%, #4f46e5 100%)',
  color: '#ffffff',
  fontFamily: "var(--font-family-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
  fontSize: '0.8125rem',
  fontWeight: 500,
  letterSpacing: '0.01em',
  lineHeight: 1,
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  animation: 'nexus-demo-fade-in 0.3s ease',
};

const pulseDotStyle: CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#34d399',
  animation: 'nexus-demo-pulse 2s ease-in-out infinite',
  flexShrink: 0,
};

const messageStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const linkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.2rem 0.625rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  fontSize: '0.75rem',
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 150ms ease',
  flexShrink: 0,
};

const dismissStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  color: 'rgba(255, 255, 255, 0.7)',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  lineHeight: 1,
  padding: 0,
  flexShrink: 0,
  transition: 'color 150ms ease, background-color 150ms ease',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Configuration options for the DemoBanner. */
export interface DemoBannerProps {
  /**
   * URL or route to navigate to when the user clicks "Developer Guide".
   * Defaults to "/docs".
   */
  docsHref?: string;

  /**
   * Optional callback invoked when the user clicks "Developer Guide".
   * If provided, the default link navigation is suppressed.
   */
  onDocsClick?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Prominent but professional demo-mode indicator.
 *
 * Renders a slim, fixed banner at the very top of the viewport with:
 *  - A pulsing status dot
 *  - A clear "Demo Mode" message
 *  - A "Developer Guide" action
 *  - A dismiss button (persisted in localStorage)
 */
export function DemoBanner({
  docsHref = '/docs/',
  onDocsClick,
}: DemoBannerProps = {}): ReactNode {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Inject keyframe animations once on mount
  useEffect(() => {
    injectKeyframes();
  }, []);

  if (dismissed) {
    return null;
  }

  function handleDismiss(): void {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage may be unavailable (private browsing, full storage, etc.)
    }
  }

  function handleDocsClick(e: React.MouseEvent): void {
    if (onDocsClick) {
      e.preventDefault();
      onDocsClick();
    }
  }

  return (
    <div
      role="status"
      aria-label="Demo mode indicator"
      style={bannerStyle}
    >
      {/* Pulsing status dot */}
      <span style={pulseDotStyle} aria-hidden="true" />

      {/* Message */}
      <span style={messageStyle}>
        <strong style={{ fontWeight: 700 }}>Demo Mode</strong>
        <span
          style={{
            margin: '0 0.375rem',
            opacity: 0.5,
          }}
          aria-hidden="true"
        >
          ---
        </span>
        <span style={{ opacity: 0.9 }}>
          This app uses simulated data. Connect your own APIs to power real accounts.
        </span>
      </span>

      {/* Developer Guide link */}
      <a
        href={docsHref}
        onClick={handleDocsClick}
        style={linkStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        Developer Guide
        <span aria-hidden="true" style={{ fontSize: '0.625rem' }}>
          {'\u2192'}
        </span>
      </a>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss demo banner"
        style={dismissStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = '#ffffff';
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.7)';
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        {'\u00d7'}
      </button>
    </div>
  );
}
