import type { AppEvent, DomainEvent, EventBus, EventHandler } from '../types/events';

/**
 * In-memory event bus with typed subscriptions.
 *
 * This is the client-side event bus. Server-pushed events (via WebSocket/SSE)
 * are bridged into this bus by the realtime infrastructure layer.
 *
 * Design decisions:
 * - Synchronous publish for predictable UI updates
 * - Wildcard subscriptions for cross-cutting concerns (observability, audit)
 * - Unsubscribe via returned cleanup function (React effect friendly)
 */
export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler<DomainEvent<string, unknown>>>>();
  const wildcardHandlers = new Set<EventHandler<AppEvent>>();

  return {
    publish<T extends AppEvent>(event: T): void {
      // Notify type-specific handlers
      const typeHandlers = handlers.get(event.type);
      if (typeHandlers) {
        for (const handler of typeHandlers) {
          try {
            handler(event);
          } catch (err) {
            console.error(`[EventBus] Handler error for ${event.type}:`, err);
          }
        }
      }

      // Notify wildcard handlers
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Wildcard handler error:`, err);
        }
      }
    },

    subscribe<T extends AppEvent>(
      eventType: T['type'],
      handler: EventHandler<T>,
    ): () => void {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set());
      }
      const typeHandlers = handlers.get(eventType)!;
      const castHandler = handler as EventHandler<DomainEvent<string, unknown>>;
      typeHandlers.add(castHandler);

      return () => {
        typeHandlers.delete(castHandler);
        if (typeHandlers.size === 0) {
          handlers.delete(eventType);
        }
      };
    },

    subscribeAll(handler: EventHandler<AppEvent>): () => void {
      wildcardHandlers.add(handler);
      return () => {
        wildcardHandlers.delete(handler);
      };
    },
  };
}
