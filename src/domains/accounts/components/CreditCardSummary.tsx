import { type ReactNode, useMemo } from 'react';
import type { CreditProduct } from '../../../core/types/product';

/**
 * Credit card summary card — rendered on the dashboard.
 *
 * This is a sample plugin component showing how product-specific UI
 * works within the capability system. The plugin registers this as
 * its SummaryCard component.
 *
 * UX principles applied:
 * - Progressive disclosure: shows critical info first, details on expand
 * - Risk-adaptive: color-codes utilization (green/amber/red)
 * - Intent-driven: primary CTA is the most likely next action
 * - Accessible: ARIA labels, keyboard navigation, WCAG 2.1 AA color contrast
 */

interface CreditCardSummaryProps {
  product: CreditProduct;
  onMakePayment: () => void;
  onViewDetails: () => void;
}

export function CreditCardSummary({
  product,
  onMakePayment,
  onViewDetails,
}: CreditCardSummaryProps): ReactNode {
  const utilization = useMemo(() => {
    if (product.creditLimit === 0) return 0;
    return Math.round((product.currentBalance / product.creditLimit) * 100);
  }, [product.currentBalance, product.creditLimit]);

  const utilizationTier = getUtilizationTier(utilization);
  const daysUntilDue = getDaysUntilDue(product.paymentDueDate);

  return (
    <article
      className="product-card"
      role="region"
      aria-label={`${product.displayName} summary`}
      style={{
        borderRadius: '16px',
        padding: '1.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            {product.displayName}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            {product.partner.name} &middot; ****{product.lastFourDigits}
          </span>
        </div>
        <img
          src={product.partner.logoUrl}
          alt={`${product.partner.name} logo`}
          style={{ width: '40px', height: '40px', borderRadius: '8px' }}
        />
      </div>

      {/* Balance & Utilization */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          ${product.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <div
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--color-border)',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={utilization}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Credit utilization: ${utilization}%`}
          >
            <div
              style={{
                width: `${Math.min(utilization, 100)}%`,
                height: '100%',
                borderRadius: '2px',
                backgroundColor: utilizationTier.color,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: utilizationTier.color, fontWeight: 600 }}>
            {utilization}%
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          ${product.availableCredit.toLocaleString()} available of ${product.creditLimit.toLocaleString()} limit
        </div>
      </div>

      {/* Payment due */}
      {product.minimumPaymentDue > 0 && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: daysUntilDue <= 3 ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: daysUntilDue <= 3 ? 'var(--color-warning-text)' : 'var(--color-info-text)' }}>
            ${product.minimumPaymentDue.toFixed(2)} minimum due
            {daysUntilDue > 0
              ? ` in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
              : ' today'}
          </div>
        </div>
      )}

      {/* Promotional APR warning */}
      {product.apr.promotional && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-accent-bg)',
            marginBottom: '1rem',
            fontSize: '0.75rem',
          }}
        >
          {product.apr.promotional.rate}% promo APR expires{' '}
          {product.apr.promotional.expiresAt.toLocaleDateString()} on $
          {product.apr.promotional.remainingBalance.toLocaleString()}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onMakePayment}
          style={{
            flex: 1,
            padding: '0.625rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Make payment
        </button>
        <button
          onClick={onViewDetails}
          style={{
            flex: 1,
            padding: '0.625rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          View details
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUtilizationTier(utilization: number): { color: string; label: string } {
  if (utilization <= 30) return { color: '#16a34a', label: 'healthy' };
  if (utilization <= 50) return { color: '#ca8a04', label: 'moderate' };
  if (utilization <= 75) return { color: '#ea580c', label: 'elevated' };
  return { color: '#dc2626', label: 'high' };
}

function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
