import { createContext, useContext, useEffect } from 'react';
import type { AppEvent, EventBus, EventHandler } from '../../core/types/events';

/**
 * React integration for the event bus.
 *
 * Provides the event bus via context and a hook for subscribing
 * to typed events with automatic cleanup on unmount.
 */

export const EventBusContext = createContext<EventBus | null>(null);

export function useEventBus(): EventBus {
  const bus = useContext(EventBusContext);
  if (!bus) {
    throw new Error('useEventBus must be used within an EventBusProvider');
  }
  return bus;
}

/**
 * Subscribe to a specific event type. Automatically unsubscribes on unmount.
 */
export function useEventSubscription<T extends AppEvent>(
  eventType: T['type'],
  handler: EventHandler<T>,
): void {
  const bus = useEventBus();

  useEffect(() => {
    const unsubscribe = bus.subscribe(eventType, handler);
    return unsubscribe;
  }, [bus, eventType, handler]);
}

/**
 * Subscribe to all events. Useful for cross-cutting concerns like logging.
 */
export function useEventSubscriptionAll(handler: EventHandler<AppEvent>): void {
  const bus = useEventBus();

  useEffect(() => {
    const unsubscribe = bus.subscribeAll(handler);
    return unsubscribe;
  }, [bus, handler]);
}
