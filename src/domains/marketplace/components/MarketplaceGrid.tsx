import { type ReactNode, useState } from 'react';
import type { MarketplaceOffer, OfferCategory } from '../types/marketplace';
import { OfferCard } from './OfferCard';
import { Button } from '../../../shared/components/ui/Button';

/**
 * MarketplaceGrid — the offer discovery surface.
 *
 * Features:
 * - Category filter chips
 * - Search bar
 * - AI-sorted results (most relevant first)
 * - Responsive grid layout
 */

interface MarketplaceGridProps {
  offers: readonly MarketplaceOffer[];
  isLoading: boolean;
  onApply: (offerId: string) => void;
  onLearnMore: (offerId: string) => void;
}

const categories: { key: OfferCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'home_improvement', label: 'Home' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'automotive', label: 'Auto' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'retail', label: 'Retail' },
  { key: 'travel', label: 'Travel' },
];

export function MarketplaceGrid({ offers, isLoading, onApply, onLearnMore }: MarketplaceGridProps): ReactNode {
  const [selectedCategory, setSelectedCategory] = useState<OfferCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOffers = offers.filter((offer) => {
    if (selectedCategory !== 'all' && offer.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        offer.title.toLowerCase().includes(query) ||
        offer.partnerName.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search offers, brands, categories..."
          aria-label="Search marketplace"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Category filters */}
      <div
        style={{
          display: 'flex',
          gap: '0.375rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              border: '1px solid var(--color-border)',
              backgroundColor: selectedCategory === cat.key ? 'var(--color-primary)' : 'transparent',
              color: selectedCategory === cat.key ? 'white' : 'var(--color-text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        </div>
      )}

      {/* Offer grid */}
      {!isLoading && (
        <>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
            {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} available
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onApply={onApply}
                onLearnMore={onLearnMore}
              />
            ))}
          </div>

          {filteredOffers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', fontWeight: 500 }}>
                No offers found
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
