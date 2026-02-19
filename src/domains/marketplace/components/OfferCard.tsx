import { type ReactNode } from 'react';
import type { MarketplaceOffer } from '../types/marketplace';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';

/**
 * OfferCard — renders a marketplace financing offer.
 *
 * Personalized via AI relevance score. Cards with higher scores
 * get visual emphasis. Expiring offers show countdown badges.
 */

interface OfferCardProps {
  offer: MarketplaceOffer;
  onApply: (offerId: string) => void;
  onLearnMore: (offerId: string) => void;
}

const financingTypeLabels: Record<string, string> = {
  deferred_interest: 'Deferred Interest',
  reduced_apr: 'Reduced APR',
  equal_pay: 'Equal Pay',
  no_interest: 'No Interest',
};

export function OfferCard({ offer, onApply, onLearnMore }: OfferCardProps): ReactNode {
  const daysUntilExpiry = offer.expiresAt
    ? Math.max(0, Math.ceil((offer.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Card
      variant="interactive"
      padding="none"
      style={{
        overflow: 'hidden',
        border: offer.featured ? '2px solid var(--color-primary)' : undefined,
      }}
    >
      {/* Featured badge */}
      {offer.featured && (
        <div
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.25rem 0.75rem',
            textAlign: 'center',
          }}
        >
          Featured offer
        </div>
      )}

      <div style={{ padding: '1.25rem' }}>
        {/* Partner header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            🏪
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {offer.partnerName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              {offer.category.replace('_', ' ')}
            </div>
          </div>

          {/* Expiry badge */}
          {daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: daysUntilExpiry <= 3 ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                color: daysUntilExpiry <= 3 ? 'var(--color-error-text)' : 'var(--color-warning-text)',
              }}
            >
              {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry}d left`}
            </span>
          )}
        </div>

        {/* Offer details */}
        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600 }}>
          {offer.title}
        </h4>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {offer.description}
        </p>

        {/* Financing badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-info-bg)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-info-text)',
            marginBottom: '1rem',
          }}
        >
          {financingTypeLabels[offer.financingDetails.type] ?? offer.financingDetails.type}
          &middot; {offer.financingDetails.promotionalPeriodMonths} months
          {offer.financingDetails.minimumPurchase && (
            <> &middot; Min. ${offer.financingDetails.minimumPurchase}</>
          )}
        </div>

        {/* AI relevance indicator */}
        {offer.personalizedScore != null && offer.personalizedScore >= 80 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            🧠 Highly relevant to you
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="primary" size="sm" onClick={() => onApply(offer.id)} style={{ flex: 1 }}>
            Apply now
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onLearnMore(offer.id)} style={{ flex: 1 }}>
            Learn more
          </Button>
        </div>
      </div>
    </Card>
  );
}
