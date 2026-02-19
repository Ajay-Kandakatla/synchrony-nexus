import type { EventBus, AppEvent } from '../../core/types/events';

/**
 * Observability layer — structured telemetry for the entire app.
 *
 * Integrates with the event bus to automatically capture:
 * - User interactions (clicks, navigation, feature usage)
 * - Performance metrics (API latency, render timing)
 * - Errors (with context for debugging)
 * - AI insight engagement (for model feedback)
 *
 * Data is batched and flushed to the analytics backend.
 * Supports structured logging with correlation IDs for
 * end-to-end tracing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TelemetryService {
  /** Track a custom event */
  track(name: string, properties?: Record<string, unknown>): void;

  /** Track a performance metric */
  metric(name: string, value: number, unit: string, tags?: Record<string, string>): void;

  /** Track an error with context */
  error(err: Error, context?: Record<string, unknown>): void;

  /** Set user context for all subsequent events */
  setUser(userId: string, traits?: Record<string, unknown>): void;

  /** Start a span (for timing operations) */
  startSpan(name: string): TelemetrySpan;

  /** Flush all queued events */
  flush(): Promise<void>;
}

export interface TelemetrySpan {
  /** Add attributes to the span */
  setAttribute(key: string, value: string | number | boolean): void;

  /** End the span and record its duration */
  end(): void;
}

interface QueuedEvent {
  type: 'track' | 'metric' | 'error';
  timestamp: number;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createTelemetryService(
  endpoint: string,
  eventBus: EventBus,
): TelemetryService {
  const queue: QueuedEvent[] = [];
  let userId: string | null = null;
  let userTraits: Record<string, unknown> = {};
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  // Auto-flush every 10 seconds
  flushTimer = setInterval(() => {
    if (queue.length > 0) {
      flushQueue();
    }
  }, 10_000);

  // Subscribe to all events for automatic telemetry
  eventBus.subscribeAll((event: AppEvent) => {
    queue.push({
      type: 'track',
      timestamp: Date.now(),
      data: {
        eventType: event.type,
        source: event.source,
        correlationId: event.correlationId,
        userId,
      },
    });
  });

  async function flushQueue(): Promise<void> {
    if (queue.length === 0) return;

    const batch = queue.splice(0, queue.length);
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch, userId, userTraits }),
        keepalive: true, // survives page unload
      });
    } catch {
      // Re-queue on failure (with limit to prevent memory leak)
      if (queue.length < 1000) {
        queue.unshift(...batch);
      }
    }
  }

  return {
    track(name, properties) {
      queue.push({
        type: 'track',
        timestamp: Date.now(),
        data: { name, ...properties, userId },
      });
    },

    metric(name, value, unit, tags) {
      queue.push({
        type: 'metric',
        timestamp: Date.now(),
        data: { name, value, unit, ...tags, userId },
      });
    },

    error(err, context) {
      queue.push({
        type: 'error',
        timestamp: Date.now(),
        data: {
          message: err.message,
          stack: err.stack,
          name: err.name,
          ...context,
          userId,
        },
      });
    },

    setUser(id, traits) {
      userId = id;
      userTraits = traits ?? {};
    },

    startSpan(name) {
      const start = performance.now();
      const attributes: Record<string, string | number | boolean> = {};

      return {
        setAttribute(key, value) {
          attributes[key] = value;
        },
        end() {
          const duration = performance.now() - start;
          queue.push({
            type: 'metric',
            timestamp: Date.now(),
            data: { name: `span.${name}`, duration, ...attributes, userId },
          });
        },
      };
    },

    async flush() {
      await flushQueue();
    },
  };
}
