/**
 * Domain event system — the backbone of reactive state.
 *
 * Every meaningful state change emits a typed event. The UI subscribes to
 * event streams rather than polling. This enables real-time updates,
 * audit trails, and decoupled feature modules.
 */

// ---------------------------------------------------------------------------
// Event envelope
// ---------------------------------------------------------------------------

export interface DomainEvent<TType extends string = string, TPayload = unknown> {
  readonly id: string;
  readonly type: TType;
  readonly payload: TPayload;
  readonly timestamp: Date;
  readonly source: EventSource;
  readonly correlationId?: string;
  readonly userId?: string;
}

export interface EventSource {
  readonly system: 'client' | 'server' | 'realtime' | 'ai_engine';
  readonly module: string;
}

// ---------------------------------------------------------------------------
// Account events
// ---------------------------------------------------------------------------

export type AccountEvent =
  | DomainEvent<'account.payment.submitted', { productId: string; amount: number }>
  | DomainEvent<'account.payment.confirmed', { productId: string; amount: number; confirmationId: string }>
  | DomainEvent<'account.payment.failed', { productId: string; reason: string }>
  | DomainEvent<'account.balance.updated', { productId: string; newBalance: number; previousBalance: number }>
  | DomainEvent<'account.credit_limit.changed', { productId: string; newLimit: number }>
  | DomainEvent<'account.status.changed', { productId: string; newStatus: string; previousStatus: string }>
  | DomainEvent<'account.autopay.configured', { productId: string; amount: number; dayOfMonth: number }>
  | DomainEvent<'account.card.locked', { productId: string }>
  | DomainEvent<'account.card.unlocked', { productId: string }>;

// ---------------------------------------------------------------------------
// AI / insight events
// ---------------------------------------------------------------------------

export type AIEvent =
  | DomainEvent<'ai.insight.generated', { insightId: string; category: string; priority: string }>
  | DomainEvent<'ai.insight.acted_on', { insightId: string; actionId: string }>
  | DomainEvent<'ai.insight.dismissed', { insightId: string; reason?: string }>
  | DomainEvent<'ai.nudge.displayed', { nudgeId: string }>
  | DomainEvent<'ai.nudge.interacted', { nudgeId: string; action: string }>
  | DomainEvent<'ai.risk.detected', { productId: string; riskScore: number }>
  | DomainEvent<'ai.conversation.started', { sessionId: string }>
  | DomainEvent<'ai.conversation.message', { sessionId: string; role: string }>;

// ---------------------------------------------------------------------------
// Dispute events
// ---------------------------------------------------------------------------

export type DisputeEvent =
  | DomainEvent<'dispute.created', { disputeId: string; transactionId: string; amount: number }>
  | DomainEvent<'dispute.status.updated', { disputeId: string; newStatus: string }>
  | DomainEvent<'dispute.resolved', { disputeId: string; outcome: string; creditAmount?: number }>
  | DomainEvent<'dispute.document.uploaded', { disputeId: string; documentId: string }>;

// ---------------------------------------------------------------------------
// Navigation / UX events (for analytics & observability)
// ---------------------------------------------------------------------------

export type UXEvent =
  | DomainEvent<'ux.screen.viewed', { screen: string; referrer?: string }>
  | DomainEvent<'ux.action.initiated', { action: string; context: Record<string, unknown> }>
  | DomainEvent<'ux.error.displayed', { code: string; message: string }>
  | DomainEvent<'ux.feature_flag.evaluated', { flag: string; value: boolean }>;

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export type AppEvent = AccountEvent | AIEvent | DisputeEvent | UXEvent;

// ---------------------------------------------------------------------------
// Event bus interface
// ---------------------------------------------------------------------------

export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

export interface EventBus {
  publish<T extends AppEvent>(event: T): void;
  subscribe<T extends AppEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
  ): () => void;
  subscribeAll(handler: EventHandler<AppEvent>): () => void;
}
