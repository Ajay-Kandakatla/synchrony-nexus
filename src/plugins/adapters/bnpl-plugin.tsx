import type { ProductPlugin } from '../registry/plugin-registry';

/**
 * BNPL / Installment Plugin — Synchrony Pay Later & SetPay.
 *
 * Demonstrates how a second product type plugs in with zero
 * changes to the shell app. Different capabilities, different
 * components, same registration pattern.
 */

function BNPLSummaryCard({ productId }: { productId: string }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>📦</span>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Pay Later Plan</h3>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        Installment plan for product {productId}
      </div>
    </div>
  );
}

function BNPLDetailView({ productId }: { productId: string }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 700 }}>
        Installment Plan Details
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Payment schedule, remaining balance, and plan management for {productId}
      </p>
    </div>
  );
}

export const bnplPlugin: ProductPlugin = {
  id: 'synchrony-bnpl',
  categories: ['bnpl', 'installment_loan'],

  display: {
    name: 'Pay Later',
    description: 'Synchrony Pay Later & SetPay installment plans',
    icon: '📦',
    color: '#8b5cf6',
  },

  capabilities: [
    'make_payment',
    'view_statements',
    'manage_alerts',
    'export_data',
    'chat_support',
    'schedule_payment',
  ],

  components: {
    SummaryCard: BNPLSummaryCard,
    DetailView: BNPLDetailView,
  },

  routes: [
    {
      path: '/accounts/bnpl/:id',
      component: BNPLDetailView as any,
      label: 'Pay Later',
      icon: '📦',
    },
  ],

  aiHints: {
    relevantInsightCategories: [
      'payment_optimization',
      'spending_pattern',
    ],
    conversationPrompts: [
      'When is my next installment due?',
      'Can I pay off my plan early?',
      'How many payments do I have left?',
    ],
  },
};
