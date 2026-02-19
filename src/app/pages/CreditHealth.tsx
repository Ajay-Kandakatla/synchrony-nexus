import { type ReactNode } from 'react';
import { FinancialHealthDashboard } from '../../domains/credit-health/components/FinancialHealthDashboard';
import type { FinancialHealthScore } from '../../core/types/user';
import type { CreditProduct } from '../../core/types/product';

/**
 * Credit Health page — wraps the FinancialHealthDashboard with demo data.
 * In production, data comes from React Query hooks.
 */

const demoScore: FinancialHealthScore = {
  overall: 74,
  dimensions: {
    utilization: 62,
    paymentHistory: 95,
    accountAge: 78,
    productMix: 55,
    savingsRate: 40,
  },
  trend: 'improving',
  lastUpdatedAt: new Date(),
};

const demoProducts: CreditProduct[] = [
  {
    id: '1',
    externalId: 'ext-1',
    category: 'credit_card',
    status: 'active',
    displayName: "Lowe's Advantage Card",
    issuer: 'Synchrony',
    partner: { id: 'lowes', name: "Lowe's", logoUrl: '', category: 'home_improvement' },
    capabilities: new Set(['make_payment', 'view_statements']),
    openedAt: new Date('2020-03-15'),
    metadata: {},
    creditLimit: 12000,
    currentBalance: 4560,
    availableCredit: 7440,
    apr: { purchase: 29.99, cashAdvance: 29.99, promotional: { rate: 0, expiresAt: new Date('2026-03-04'), remainingBalance: 2340 } },
    minimumPaymentDue: 85,
    paymentDueDate: new Date('2026-02-23'),
    lastFourDigits: '4521',
  },
  {
    id: '2',
    externalId: 'ext-2',
    category: 'credit_card',
    status: 'active',
    displayName: 'CareCredit',
    issuer: 'Synchrony',
    partner: { id: 'carecredit', name: 'CareCredit', logoUrl: '', category: 'healthcare' },
    capabilities: new Set(['make_payment', 'view_statements']),
    openedAt: new Date('2022-06-10'),
    metadata: {},
    creditLimit: 8000,
    currentBalance: 1872,
    availableCredit: 6128,
    apr: { purchase: 26.99, cashAdvance: 26.99 },
    minimumPaymentDue: 42,
    paymentDueDate: new Date('2026-02-28'),
    lastFourDigits: '7833',
  },
  {
    id: '3',
    externalId: 'ext-3',
    category: 'credit_card',
    status: 'active',
    displayName: 'Amazon Store Card',
    issuer: 'Synchrony',
    partner: { id: 'amazon', name: 'Amazon', logoUrl: '', category: 'retail' },
    capabilities: new Set(['make_payment', 'view_statements']),
    openedAt: new Date('2019-11-24'),
    metadata: {},
    creditLimit: 10000,
    currentBalance: 2000,
    availableCredit: 8000,
    apr: { purchase: 29.49, cashAdvance: 29.49 },
    minimumPaymentDue: 0,
    paymentDueDate: new Date('2026-03-15'),
    lastFourDigits: '9102',
  },
];

export default function CreditHealth(): ReactNode {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>
          Credit Health
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Track your financial health and find ways to improve
        </p>
      </div>

      <FinancialHealthDashboard
        score={demoScore}
        creditProducts={demoProducts}
        onOptimize={(dimension) => {
          console.log(`Optimize: ${dimension}`);
        }}
      />
    </div>
  );
}
