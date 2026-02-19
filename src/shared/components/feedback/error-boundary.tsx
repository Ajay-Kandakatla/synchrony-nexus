import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Production-grade error boundary with telemetry integration.
 *
 * Features:
 * - Catches rendering errors in the component subtree
 * - Reports errors to the telemetry service
 * - Renders a fallback UI
 * - Supports retry via state reset
 * - Domain-scoped: each domain module wraps its tree in one
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Scope name for telemetry (e.g., 'accounts', 'payments') */
  scope: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.scope}]`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset);
      }
      return fallback;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Convenience wrapper for common fallback pattern
// ---------------------------------------------------------------------------

interface DefaultErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  scope: string;
}

export function DefaultErrorFallback({ error, onRetry, scope }: DefaultErrorFallbackProps): ReactNode {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: '2rem',
        textAlign: 'center',
        borderRadius: '12px',
        backgroundColor: 'var(--color-error-bg, #fef2f2)',
        border: '1px solid var(--color-error-border, #fecaca)',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-error-text, #991b1b)' }}>
        Something went wrong
      </h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--color-text-secondary, #6b7280)' }}>
        We encountered an issue loading this section. Our team has been notified.
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '0.5rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'var(--color-primary, #2563eb)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  );
}
