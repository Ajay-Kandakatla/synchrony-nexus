import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from './event-bus';
import type { AppEvent } from '../types/events';

describe('EventBus', () => {
  it('should publish events to typed subscribers', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe('account.payment.submitted', handler);

    const event: AppEvent = {
      id: 'test-1',
      type: 'account.payment.submitted',
      payload: { productId: 'prod-1', amount: 100 },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    };

    bus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not call handlers for different event types', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe('account.payment.submitted', handler);

    bus.publish({
      id: 'test-2',
      type: 'account.card.locked',
      payload: { productId: 'prod-1' },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support wildcard subscriptions', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribeAll(handler);

    bus.publish({
      id: 'test-3',
      type: 'account.payment.submitted',
      payload: { productId: 'prod-1', amount: 50 },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    });

    bus.publish({
      id: 'test-4',
      type: 'ai.insight.generated',
      payload: { insightId: 'ins-1', category: 'risk_alert', priority: 'high' },
      timestamp: new Date(),
      source: { system: 'server', module: 'ai' },
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should return an unsubscribe function', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe('account.payment.submitted', handler);

    bus.publish({
      id: 'test-5',
      type: 'account.payment.submitted',
      payload: { productId: 'prod-1', amount: 100 },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    bus.publish({
      id: 'test-6',
      type: 'account.payment.submitted',
      payload: { productId: 'prod-1', amount: 200 },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    });

    expect(handler).toHaveBeenCalledTimes(1); // still 1
  });

  it('should handle errors in handlers without breaking other handlers', () => {
    const bus = createEventBus();
    const errorHandler = vi.fn(() => { throw new Error('boom'); });
    const goodHandler = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.subscribe('account.payment.submitted', errorHandler);
    bus.subscribe('account.payment.submitted', goodHandler);

    bus.publish({
      id: 'test-7',
      type: 'account.payment.submitted',
      payload: { productId: 'prod-1', amount: 100 },
      timestamp: new Date(),
      source: { system: 'client', module: 'test' },
    });

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1); // still called despite error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should support multiple subscribers for the same event type', () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.subscribe('ai.insight.generated', handler1);
    bus.subscribe('ai.insight.generated', handler2);

    bus.publish({
      id: 'test-8',
      type: 'ai.insight.generated',
      payload: { insightId: 'ins-1', category: 'risk_alert', priority: 'high' },
      timestamp: new Date(),
      source: { system: 'server', module: 'ai' },
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
