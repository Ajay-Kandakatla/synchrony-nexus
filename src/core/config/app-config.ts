/**
 * Application configuration — environment-aware settings.
 *
 * All config is loaded once at startup. No config is hardcoded in
 * component or service code. This makes it trivial to swap environments
 * and enables the white-label capability.
 */

export interface AppConfig {
  readonly env: 'development' | 'staging' | 'production';
  readonly api: {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly retries: number;
  };
  readonly bff: {
    readonly baseUrl: string;
  };
  readonly realtime: {
    readonly wsUrl: string;
    readonly sseUrl: string;
    readonly heartbeatIntervalMs: number;
    readonly maxReconnectAttempts: number;
  };
  readonly telemetry: {
    readonly endpoint: string;
    readonly enabled: boolean;
  };
  readonly featureFlags: {
    readonly provider: 'config' | 'launchdarkly' | 'statsig';
    readonly sdkKey?: string;
  };
}

export function loadConfig(): AppConfig {
  const env = (import.meta.env.MODE ?? 'development') as AppConfig['env'];
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8080';

  return {
    env,
    api: {
      baseUrl: `${apiBase}/api/v1`,
      timeout: 15_000,
      retries: env === 'production' ? 3 : 1,
    },
    bff: {
      baseUrl: (import.meta.env.VITE_BFF_BASE_URL as string) ?? apiBase,
    },
    realtime: {
      wsUrl: `${apiBase.replace('http', 'ws')}/ws`,
      sseUrl: `${apiBase}/sse`,
      heartbeatIntervalMs: 30_000,
      maxReconnectAttempts: 10,
    },
    telemetry: {
      endpoint: `${apiBase}/telemetry`,
      enabled: env !== 'development',
    },
    featureFlags: {
      provider: 'config',
    },
  };
}

// Ambient type for Vite env vars
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_BFF_BASE_URL?: string;
  }
}
