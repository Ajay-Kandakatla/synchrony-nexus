import { loadConfig } from '../core/config/app-config';
import { createEventBus } from '../core/events/event-bus';
import { createApiClient } from '../infrastructure/api/api-client';
import { createAuthService } from '../infrastructure/auth/auth-service';
import { createRealtimeClient } from '../infrastructure/realtime/realtime-client';
import { createTelemetryService } from '../infrastructure/observability/telemetry';
import { createConfigFeatureFlags } from '../infrastructure/feature-flags/feature-flag-service';
import { createInsightsEngine } from '../domains/ai-copilot/services/insights-engine';
import { getPluginRegistry } from '../plugins/registry/plugin-registry';
import { installStorageGuard } from '../infrastructure/security/pii-boundary';

// Plugins
import { creditCardPlugin } from '../plugins/adapters/credit-card-plugin';
import { bnplPlugin } from '../plugins/adapters/bnpl-plugin';

/**
 * Application bootstrap — wires all services together.
 *
 * Called once at startup. Returns the service container that
 * is injected into the React tree via context providers.
 *
 * Boot sequence:
 * 1. Load config
 * 2. Install security guards
 * 3. Create core services (event bus, auth, API client)
 * 4. Create infrastructure services (realtime, telemetry, feature flags)
 * 5. Create domain services (insights engine)
 * 6. Register plugins
 * 7. Connect realtime
 */

export interface ServiceContainer {
  config: ReturnType<typeof loadConfig>;
  eventBus: ReturnType<typeof createEventBus>;
  apiClient: ReturnType<typeof createApiClient>;
  authService: ReturnType<typeof createAuthService>;
  realtimeClient: ReturnType<typeof createRealtimeClient>;
  telemetry: ReturnType<typeof createTelemetryService>;
  featureFlags: ReturnType<typeof createConfigFeatureFlags>;
  insightsEngine: ReturnType<typeof createInsightsEngine>;
  pluginRegistry: ReturnType<typeof getPluginRegistry>;
}

export async function bootstrap(): Promise<ServiceContainer> {
  // 1. Config
  const config = loadConfig();

  // 2. Security
  installStorageGuard();

  // 3. Core services
  const eventBus = createEventBus();
  const authService = createAuthService(config.bff.baseUrl);

  const apiClient = createApiClient({
    baseUrl: config.api.baseUrl,
    timeout: config.api.timeout,
    retries: config.api.retries,
    getAuthToken: () => authService.getToken(),
    onError: (err) => {
      if (err.isAuthError) {
        authService.login(window.location.pathname);
      }
    },
  });

  // 4. Infrastructure services
  const realtimeClient = createRealtimeClient(
    {
      wsUrl: config.realtime.wsUrl,
      sseUrl: config.realtime.sseUrl,
      heartbeatIntervalMs: config.realtime.heartbeatIntervalMs,
      maxReconnectAttempts: config.realtime.maxReconnectAttempts,
      getAuthToken: () => authService.getToken(),
    },
    eventBus,
  );

  const telemetry = createTelemetryService(config.telemetry.endpoint, eventBus);

  const featureFlags = createConfigFeatureFlags({
    'ai-copilot': true,
    'nudge-overlay': true,
    'credit-health-dashboard': true,
    'dispute-ai-triage': true,
    'dark-mode': true,
    'payment-ai-suggestions': true,
  });

  // 5. Domain services
  const insightsEngine = createInsightsEngine(apiClient, eventBus);

  // 6. Register plugins
  const pluginRegistry = getPluginRegistry();
  pluginRegistry.register(creditCardPlugin);
  pluginRegistry.register(bnplPlugin);
  await pluginRegistry.activateAll();

  // 7. Connect realtime (non-blocking)
  realtimeClient.connect().catch((err) => {
    console.warn('[Bootstrap] Realtime connection failed, will retry:', err);
  });

  return {
    config,
    eventBus,
    apiClient,
    authService,
    realtimeClient,
    telemetry,
    featureFlags,
    insightsEngine,
    pluginRegistry,
  };
}
