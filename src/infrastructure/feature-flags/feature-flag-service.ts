/**
 * Feature flag & experimentation framework.
 *
 * Enables:
 * - Gradual rollout of new features
 * - A/B testing of UX variants
 * - Kill switches for unstable features
 * - User-segment targeting
 * - Dynamic configuration without deploys
 *
 * The flag provider is pluggable — supports LaunchDarkly, Statsig,
 * or a simple config-based provider for development.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureFlagService {
  /** Evaluate a boolean flag */
  isEnabled(flag: string, context?: FlagContext): boolean;

  /** Evaluate a multi-variant flag */
  getVariant<T = string>(flag: string, defaultValue: T, context?: FlagContext): T;

  /** Bulk evaluation for rendering optimization */
  evaluateAll(context?: FlagContext): ReadonlyMap<string, unknown>;

  /** Subscribe to flag changes (real-time updates) */
  onFlagChange(flag: string, handler: (value: unknown) => void): () => void;

  /** Report experiment exposure (for A/B analytics) */
  trackExposure(flag: string, variant: string): void;
}

export interface FlagContext {
  userId?: string;
  riskTier?: string;
  productCategories?: readonly string[];
  segment?: string;
  platform?: 'web' | 'mobile_web' | 'native';
}

// ---------------------------------------------------------------------------
// Config-based implementation (dev / fallback)
// ---------------------------------------------------------------------------

export function createConfigFeatureFlags(
  flags: Record<string, unknown>,
): FeatureFlagService {
  const changeHandlers = new Map<string, Set<(value: unknown) => void>>();

  return {
    isEnabled(flag: string): boolean {
      return flags[flag] === true;
    },

    getVariant<T = string>(flag: string, defaultValue: T): T {
      return (flags[flag] as T) ?? defaultValue;
    },

    evaluateAll(): ReadonlyMap<string, unknown> {
      return new Map(Object.entries(flags));
    },

    onFlagChange(flag: string, handler: (value: unknown) => void): () => void {
      if (!changeHandlers.has(flag)) {
        changeHandlers.set(flag, new Set());
      }
      changeHandlers.get(flag)!.add(handler);
      return () => changeHandlers.get(flag)?.delete(handler);
    },

    trackExposure(flag: string, variant: string): void {
      // In dev mode, just log
      console.debug(`[FeatureFlag] Exposure: ${flag}=${variant}`);
    },
  };
}
