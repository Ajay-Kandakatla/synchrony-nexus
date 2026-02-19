/**
 * Authentication & token lifecycle management.
 *
 * Security model:
 * - Access tokens are short-lived (5 min) and stored in memory only
 * - Refresh tokens use httpOnly secure cookies (set by the BFF)
 * - Token refresh is transparent — the API client calls getToken()
 *   which handles refresh automatically
 * - PII never touches localStorage or sessionStorage
 * - Zero-trust: every API call is authenticated, no implicit sessions
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthService {
  /** Get current valid access token (refreshes if needed) */
  getToken(): Promise<string | null>;

  /** Check if user is authenticated */
  isAuthenticated(): boolean;

  /** Initiate login redirect */
  login(returnUrl?: string): void;

  /** Clear client-side auth state */
  logout(): Promise<void>;

  /** Subscribe to auth state changes */
  onAuthStateChange(handler: (authenticated: boolean) => void): () => void;
}

interface TokenState {
  accessToken: string;
  expiresAt: number; // unix timestamp ms
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createAuthService(bffBaseUrl: string): AuthService {
  let tokenState: TokenState | null = null;
  let refreshPromise: Promise<TokenState | null> | null = null;
  const handlers = new Set<(authenticated: boolean) => void>();

  function notifyHandlers(authenticated: boolean) {
    for (const handler of handlers) {
      handler(authenticated);
    }
  }

  async function refreshToken(): Promise<TokenState | null> {
    try {
      const response = await fetch(`${bffBaseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends httpOnly refresh cookie
      });

      if (!response.ok) {
        tokenState = null;
        notifyHandlers(false);
        return null;
      }

      const data = (await response.json()) as {
        accessToken: string;
        expiresIn: number;
      };

      tokenState = {
        accessToken: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      notifyHandlers(true);
      return tokenState;
    } catch {
      tokenState = null;
      notifyHandlers(false);
      return null;
    } finally {
      refreshPromise = null;
    }
  }

  return {
    async getToken(): Promise<string | null> {
      // Valid token in memory
      if (tokenState && tokenState.expiresAt > Date.now() + 30_000) {
        return tokenState.accessToken;
      }

      // Deduplicate concurrent refresh requests
      if (!refreshPromise) {
        refreshPromise = refreshToken();
      }

      const result = await refreshPromise;
      return result?.accessToken ?? null;
    },

    isAuthenticated(): boolean {
      return tokenState !== null && tokenState.expiresAt > Date.now();
    },

    login(returnUrl?: string): void {
      const url = new URL(`${bffBaseUrl}/auth/login`);
      if (returnUrl) {
        url.searchParams.set('returnUrl', returnUrl);
      }
      window.location.href = url.toString();
    },

    async logout(): Promise<void> {
      try {
        await fetch(`${bffBaseUrl}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } finally {
        tokenState = null;
        notifyHandlers(false);
      }
    },

    onAuthStateChange(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}
