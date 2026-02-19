import type { ProductPlugin } from '../registry/plugin-registry';
import { CreditCardSummary } from '../../domains/accounts/components/CreditCardSummary';
import type { CreditProduct } from '../../core/types/product';

/**
 * Credit Card Plugin — complete end-to-end example.
 *
 * This demonstrates the full plugin registration pattern:
 * 1. Define the plugin with metadata, capabilities, components, and routes
 * 2. Register it at app startup
 * 3. The shell app renders everything dynamically
 *
 * To add a new product type (e.g., BNPL), create a similar plugin file
 * and register it in the bootstrap module. No changes to the shell needed.
 */

// ---------------------------------------------------------------------------
// Stub components for the plugin
// ---------------------------------------------------------------------------

function CreditCardDetail({ productId }: { productId: string }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 700 }}>
        Credit Card Details
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Full account details, transaction history, and management for product {productId}
      </p>
    </div>
  );
}

function CreditCardActionSheet({ productId }: { productId: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      {[
        { label: 'Make a payment', icon: '💳' },
        { label: 'View statements', icon: '📄' },
        { label: 'Dispute a charge', icon: '🔍' },
        { label: 'Lock card', icon: '🔒' },
        { label: 'Request credit increase', icon: '📈' },
        { label: 'Set up autopay', icon: '🔄' },
      ].map((action) => (
        <button
          key={action.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            textAlign: 'left',
          }}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function MakePaymentCapability({ productId }: { productId: string }) {
  return <div>Payment component for {productId}</div>;
}

function ViewStatementsCapability({ productId }: { productId: string }) {
  return <div>Statements component for {productId}</div>;
}

function DisputeTransactionCapability({ productId }: { productId: string }) {
  return <div>Dispute component for {productId}</div>;
}

// ---------------------------------------------------------------------------
// Summary card wrapper — adapts the typed component to the plugin interface
// ---------------------------------------------------------------------------

function CreditCardSummaryWrapper({ productId }: { productId: string }) {
  // In production this would fetch the product via React Query hook
  // For the plugin demo, we show the component structure
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Credit Card</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Product: {productId}
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        Rendered by the credit card plugin via the capability system
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export const creditCardPlugin: ProductPlugin = {
  id: 'synchrony-credit-card',
  categories: ['credit_card'],

  display: {
    name: 'Credit Cards',
    description: 'Synchrony credit card management',
    icon: '💳',
    color: '#2563eb',
  },

  capabilities: [
    'make_payment',
    'view_statements',
    'dispute_transaction',
    'request_credit_increase',
    'set_autopay',
    'manage_alerts',
    'view_rewards',
    'transfer_balance',
    'lock_card',
    'replace_card',
    'manage_authorized_users',
    'view_offers',
    'export_data',
    'chat_support',
    'schedule_payment',
    'view_interest_breakdown',
  ],

  components: {
    SummaryCard: CreditCardSummaryWrapper,
    DetailView: CreditCardDetail,
    ActionSheet: CreditCardActionSheet,
    capabilityComponents: {
      make_payment: MakePaymentCapability,
      view_statements: ViewStatementsCapability,
      dispute_transaction: DisputeTransactionCapability,
    },
  },

  routes: [
    {
      path: '/accounts/credit-card/:id',
      component: CreditCardDetail as any,
      label: 'Credit Card',
      icon: '💳',
    },
  ],

  aiHints: {
    relevantInsightCategories: [
      'payment_optimization',
      'credit_improvement',
      'promotional_expiry',
      'spending_pattern',
      'debt_reduction',
    ],
    conversationPrompts: [
      'How can I reduce my interest charges?',
      'When does my promo rate expire?',
      'What is the best way to pay off my balance?',
      'Should I request a credit line increase?',
    ],
    riskFactors: [
      'high_utilization',
      'minimum_payment_only',
      'promotional_expiry_approaching',
      'payment_due_soon',
    ],
  },

  async onActivate() {
    console.log('[CreditCardPlugin] Activated');
  },

  async onDeactivate() {
    console.log('[CreditCardPlugin] Deactivated');
  },
};
