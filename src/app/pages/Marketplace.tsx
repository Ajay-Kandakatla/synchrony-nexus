import { type ReactNode, useState, useMemo } from 'react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';

/**
 * Marketplace — the discovery and offers hub.
 *
 * Surfaces personalized credit offers, partner deals, credit limit
 * increase opportunities, and rewards summaries. Designed for a power
 * user with 15 Synchrony products who wants to maximize value from
 * the Synchrony ecosystem.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreApprovedOffer {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  creditLimit: number;
  apr: string;
  promoApr?: string;
  benefits: string[];
  matchScore: number;
  category: string;
  annualFee: string;
}

interface PartnerDeal {
  id: string;
  partner: string;
  color: string;
  headline: string;
  details: string;
  savings: string;
  expiresIn: number | null;
  category: string;
  tag: 'exclusive' | 'limited' | 'new' | 'popular';
  activated: boolean;
}

interface EligibleCLI {
  id: string;
  partner: string;
  color: string;
  currentLimit: number;
  potentialLimit: number;
  utilizationPct: number;
  onTimePayments: number;
}

interface RewardEntry {
  partner: string;
  color: string;
  earned: number;
  type: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const categories = [
  'All', 'Home', 'Healthcare', 'Electronics', 'Auto',
  'Furniture', 'Retail', 'Travel', 'Dining',
];

const sortOptions = ['Expiring soon', 'Highest savings', 'New offers'] as const;
type SortOption = (typeof sortOptions)[number];

const preApprovedOffers: PreApprovedOffer[] = [
  {
    id: 'pa-1',
    name: 'Synchrony Premier Visa',
    color: '#1a1a2e',
    accentColor: '#c9a84c',
    creditLimit: 15000,
    apr: '21.99% - 29.99%',
    promoApr: '0% for 15 months on purchases',
    benefits: [
      '2% unlimited cashback on all purchases',
      'No annual fee ever',
      'Cell phone protection up to $600',
      'Free FICO score monthly',
    ],
    matchScore: 97,
    category: 'Retail',
    annualFee: '$0',
  },
  {
    id: 'pa-2',
    name: 'Walgreens Credit Card',
    color: '#e31837',
    accentColor: '#ffffff',
    creditLimit: 3000,
    apr: '24.99%',
    benefits: [
      '10% back in Walgreens Cash rewards',
      '5% back on Walgreens.com',
      'Exclusive BOGOs for cardholders',
      '3x points on health & wellness',
    ],
    matchScore: 94,
    category: 'Healthcare',
    annualFee: '$0',
  },
  {
    id: 'pa-3',
    name: 'AT&T Financing Card',
    color: '#009fdb',
    accentColor: '#ffffff',
    creditLimit: 5000,
    apr: '0% for 36 months',
    promoApr: '0% for 36 months on devices',
    benefits: [
      'Finance any AT&T device at 0%',
      'No down payment required',
      'Upgrade-ready after 50% paid',
      'Free expedited shipping on orders',
    ],
    matchScore: 91,
    category: 'Electronics',
    annualFee: '$0',
  },
  {
    id: 'pa-4',
    name: 'Verizon Visa Card',
    color: '#cd040b',
    accentColor: '#ffffff',
    creditLimit: 8000,
    apr: '22.99% - 28.99%',
    benefits: [
      '4% on groceries and gas',
      '3% on dining',
      'Auto pay Verizon bill earns 2%',
      'Up to $100 annual Verizon credit',
    ],
    matchScore: 88,
    category: 'Electronics',
    annualFee: '$0',
  },
];

const partnerDeals: PartnerDeal[] = [
  {
    id: 'pd-1', partner: "Lowe's", color: '#004890',
    headline: '10% off purchase $500+',
    details: 'Exclusive cardholder offer. Stack with existing promo financing.',
    savings: 'Up to $200 off', expiresIn: 5, category: 'Home', tag: 'exclusive', activated: false,
  },
  {
    id: 'pd-2', partner: 'Amazon', color: '#FF9900',
    headline: '$50 off orders $200+',
    details: 'Store Card exclusive. Combinable with Prime free shipping.',
    savings: '$50', expiresIn: 12, category: 'Retail', tag: 'limited', activated: false,
  },
  {
    id: 'pd-3', partner: 'CareCredit', color: '#00857C',
    headline: '0% for 24 months on Invisalign',
    details: 'New promo with participating orthodontists. $5,500 value financed interest-free.',
    savings: '$1,320 in interest', expiresIn: null, category: 'Healthcare', tag: 'new', activated: false,
  },
  {
    id: 'pd-4', partner: 'Ashley Furniture', color: '#7B2D26',
    headline: 'Free delivery + extra 5% off clearance',
    details: 'Cardholder exclusive. Free white-glove delivery on orders $999+.',
    savings: 'Up to $350', expiresIn: 18, category: 'Furniture', tag: 'exclusive', activated: false,
  },
  {
    id: 'pd-5', partner: "Dick's Sporting Goods", color: '#006241',
    headline: 'Double points weekend (10x)',
    details: 'This Saturday-Sunday only. 10x points instead of standard 5x.',
    savings: '2x rewards', expiresIn: 3, category: 'Retail', tag: 'limited', activated: false,
  },
  {
    id: 'pd-6', partner: 'Guitar Center', color: '#231F20',
    headline: '0% for 48 months on guitars $999+',
    details: 'Extended promo financing on select guitars and amps.',
    savings: 'Up to $600 saved', expiresIn: 30, category: 'Retail', tag: 'popular', activated: false,
  },
  {
    id: 'pd-7', partner: 'Rooms To Go', color: '#003366',
    headline: '$500 off living room sets $3,000+',
    details: 'Includes sofas, sectionals, and full living room packages.',
    savings: '$500', expiresIn: 14, category: 'Furniture', tag: 'exclusive', activated: false,
  },
  {
    id: 'pd-8', partner: "Sam's Club", color: '#0060A9',
    headline: '$45 membership free with referral',
    details: 'Refer a friend and both get a free Club membership year.',
    savings: '$45', expiresIn: null, category: 'Retail', tag: 'new', activated: false,
  },
  {
    id: 'pd-9', partner: 'TJ Maxx', color: '#E1251B',
    headline: 'Early access to Spring clearance',
    details: '48-hour early access for cardholders before public sale.',
    savings: 'Up to 70% off', expiresIn: 8, category: 'Retail', tag: 'exclusive', activated: false,
  },
  {
    id: 'pd-10', partner: 'Mattress Firm', color: '#5C2D91',
    headline: 'Free adjustable base ($599 value)',
    details: 'With any mattress purchase $999+. King and queen sizes.',
    savings: '$599', expiresIn: 21, category: 'Furniture', tag: 'popular', activated: false,
  },
  {
    id: 'pd-11', partner: 'Discount Tire', color: '#D62027',
    headline: 'Buy 3 get 1 free on select brands',
    details: 'Michelin, Bridgestone, and Continental tires included.',
    savings: 'Up to $250', expiresIn: 10, category: 'Auto', tag: 'limited', activated: false,
  },
  {
    id: 'pd-12', partner: 'JCPenney', color: '#CC0000',
    headline: 'Extra 20% off + free same-day pickup',
    details: 'In-store and online. Exclusions apply to select luxury brands.',
    savings: 'Up to $120 off', expiresIn: 6, category: 'Retail', tag: 'exclusive', activated: false,
  },
];

const eligibleCLIs: EligibleCLI[] = [
  { id: 'cli-1', partner: "Lowe's", color: '#004890', currentLimit: 12000, potentialLimit: 18000, utilizationPct: 38, onTimePayments: 24 },
  { id: 'cli-2', partner: 'Amazon Store Card', color: '#FF9900', currentLimit: 10000, potentialLimit: 15000, utilizationPct: 22, onTimePayments: 36 },
  { id: 'cli-3', partner: 'PayPal Credit', color: '#003087', currentLimit: 5000, potentialLimit: 8000, utilizationPct: 18, onTimePayments: 18 },
  { id: 'cli-4', partner: 'TJX Rewards', color: '#E1251B', currentLimit: 4000, potentialLimit: 7000, utilizationPct: 15, onTimePayments: 30 },
];

const rewardsData: RewardEntry[] = [
  { partner: 'Amazon Store Card', color: '#FF9900', earned: 47.82, type: 'cashback' },
  { partner: "Lowe's", color: '#004890', earned: 34.50, type: 'discount' },
  { partner: 'Venmo Visa', color: '#3D95CE', earned: 22.10, type: 'cashback' },
  { partner: "Dick's Sporting Goods", color: '#006241', earned: 18.75, type: 'points' },
  { partner: 'Walgreens', color: '#e31837', earned: 12.40, type: 'cashback' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

function formatCurrencyDecimal(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
}

function tagStyle(tag: PartnerDeal['tag']): { bg: string; text: string } {
  const map: Record<PartnerDeal['tag'], { bg: string; text: string }> = {
    exclusive: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)' },
    limited: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
    new: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)' },
    popular: { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)' },
  };
  return map[tag];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Badge({ children, bg, color: textColor }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)',
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase',
      backgroundColor: bg, color: textColor, lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

function MatchBadge({ score }: { score: number }) {
  const bg = score >= 95 ? 'var(--color-success-bg)' : score >= 90 ? 'var(--color-info-bg)' : 'var(--color-warning-bg)';
  const text = score >= 95 ? 'var(--color-success-text)' : score >= 90 ? 'var(--color-info-text)' : 'var(--color-warning-text)';
  return <Badge bg={bg} color={text}>{score}% match</Badge>;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{
      width: '100%', height: '6px', borderRadius: '3px',
      backgroundColor: 'var(--color-border)', overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: '3px',
        backgroundColor: color, transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

function SectionHeader({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>{subtitle}</p>}
      </div>
      {trailing && <div>{trailing}</div>}
    </div>
  );
}

function MiniCardVisual({ color, accentColor, name }: { color: string; accentColor?: string; name: string }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '1.586', borderRadius: 'var(--radius-md)',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 60%, ${accentColor ?? '#ffffff22'} 100%)`,
      padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '60%', height: '80%', borderRadius: '50%',
        background: `${accentColor ?? '#ffffff'}11`,
      }} />
      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#ffffffcc', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Synchrony
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>{name}</div>
        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
          {[0, 1, 2, 3].map(i => (
            <span key={i} style={{ fontSize: '0.55rem', color: '#ffffff99', letterSpacing: '0.15em' }}>
              {i < 3 ? '****' : '0000'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Marketplace(): ReactNode {
  const [activeCategory, setActiveCategory] = useState('All');
  const [dealSort, setDealSort] = useState<SortOption>('Expiring soon');
  const [activatedDeals, setActivatedDeals] = useState<Set<string>>(new Set());
  const [expandedCLI, setExpandedCLI] = useState<string | null>(null);

  // Filtered + sorted deals
  const filteredDeals = useMemo(() => {
    let deals = partnerDeals;
    if (activeCategory !== 'All') {
      deals = deals.filter(d => d.category === activeCategory);
    }
    const sorted = [...deals];
    if (dealSort === 'Expiring soon') {
      sorted.sort((a, b) => (a.expiresIn ?? 999) - (b.expiresIn ?? 999));
    } else if (dealSort === 'Highest savings') {
      sorted.sort((a, b) => {
        const numA = parseInt(a.savings.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.savings.replace(/[^0-9]/g, ''), 10) || 0;
        return numB - numA;
      });
    } else {
      sorted.sort((a, b) => (a.tag === 'new' ? -1 : b.tag === 'new' ? 1 : 0));
    }
    return sorted;
  }, [activeCategory, dealSort]);

  const totalRewards = rewardsData.reduce((sum, r) => sum + r.earned, 0);
  const offersCount = filteredDeals.length;

  function handleActivate(id: string) {
    setActivatedDeals(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

      {/* ================================================================= */}
      {/* Personalized Offers Header                                        */}
      {/* ================================================================= */}
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>
              Your Marketplace
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
              Based on your <strong style={{ color: 'var(--color-text-primary)' }}>15 cards</strong> and spending patterns, we found{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{offersCount + preApprovedOffers.length} offers</strong> for you
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-success-text)', fontWeight: 600 }}>
                AI-matched to your profile
              </span>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: 'var(--color-success-text)', animation: 'pulse 2s infinite',
              }} />
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================= */}
      {/* Category Filter Tabs                                              */}
      {/* ================================================================= */}
      <div style={{
        display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '1.25rem 0 0.25rem',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {categories.map(cat => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap', cursor: 'pointer',
                border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* Pre-Approved Credit Offers                                        */}
      {/* ================================================================= */}
      <section style={{ marginTop: '1.75rem' }}>
        <SectionHeader
          title="Pre-Approved for You"
          subtitle="Applying will not affect your credit score"
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {preApprovedOffers.map(offer => (
            <Card key={offer.id} variant="interactive" padding="none">
              <div style={{ padding: '1rem 1rem 0.75rem' }}>
                {/* Card top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Badge bg="var(--color-success-bg)" color="var(--color-success-text)">Pre-approved</Badge>
                  <MatchBadge score={offer.matchScore} />
                </div>

                {/* Card visual */}
                <MiniCardVisual color={offer.color} accentColor={offer.accentColor} name={offer.name} />

                {/* Details */}
                <div style={{ marginTop: '0.85rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    {offer.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Credit Limit</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatCurrency(offer.creditLimit)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>APR</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{offer.apr}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Annual Fee</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success-text)' }}>{offer.annualFee}</div>
                    </div>
                  </div>

                  {/* Benefits list */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
                    {offer.benefits.map((b, i) => (
                      <li key={i} style={{
                        fontSize: '0.78rem', color: 'var(--color-text-secondary)',
                        padding: '0.2rem 0', display: 'flex', gap: '0.4rem', alignItems: 'flex-start', lineHeight: 1.4,
                      }}>
                        <span style={{ color: 'var(--color-success-text)', fontSize: '0.7rem', marginTop: '0.15rem', flexShrink: 0 }}>&#10003;</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {offer.promoApr && (
                    <div style={{
                      marginTop: '0.6rem', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-info-bg)', fontSize: '0.75rem', fontWeight: 600,
                      color: 'var(--color-info-text)',
                    }}>
                      {offer.promoApr}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div style={{
                padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)',
              }}>
                <Button variant="primary" size="sm" fullWidth>
                  Apply now — won't affect score
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Partner Deals & Exclusive Offers                                  */}
      {/* ================================================================= */}
      <section style={{ marginTop: '2.25rem' }}>
        <SectionHeader
          title="Partner Deals & Exclusives"
          subtitle={`${filteredDeals.length} offers available`}
          trailing={
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {sortOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setDealSort(opt)}
                  style={{
                    padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem', fontWeight: dealSort === opt ? 700 : 500,
                    cursor: 'pointer',
                    border: dealSort === opt ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: dealSort === opt ? 'var(--color-primary)' : 'transparent',
                    color: dealSort === opt ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {filteredDeals.map(deal => {
            const ts = tagStyle(deal.tag);
            const isActivated = activatedDeals.has(deal.id);

            return (
              <Card key={deal.id} variant="interactive" padding="none">
                {/* Color accent strip */}
                <div style={{ height: '4px', backgroundColor: deal.color, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />

                <div style={{ padding: '1rem' }}>
                  {/* Partner header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                      }}>
                        {deal.partner.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {deal.partner}
                      </span>
                    </div>
                    <Badge bg={ts.bg} color={ts.text}>{deal.tag}</Badge>
                  </div>

                  {/* Headline */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.35rem', lineHeight: 1.35 }}>
                    {deal.headline}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {deal.details}
                  </p>

                  {/* Savings + expiry */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '0.85rem', gap: '0.5rem', flexWrap: 'wrap',
                  }}>
                    <div style={{
                      padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-success-bg)',
                      fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success-text)',
                    }}>
                      {deal.savings}
                    </div>

                    {deal.expiresIn !== null ? (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: deal.expiresIn <= 5 ? 'var(--color-error-text)' : 'var(--color-text-tertiary)',
                      }}>
                        {deal.expiresIn <= 5 ? `Expires in ${deal.expiresIn} day${deal.expiresIn !== 1 ? 's' : ''} !` : `${deal.expiresIn} days left`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                        Ongoing
                      </span>
                    )}
                  </div>

                  {/* Urgency bar for deals expiring soon */}
                  {deal.expiresIn !== null && deal.expiresIn <= 14 && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <ProgressBar
                        value={14 - deal.expiresIn}
                        max={14}
                        color={deal.expiresIn <= 5 ? '#ef4444' : deal.expiresIn <= 10 ? '#f59e0b' : '#3b82f6'}
                      />
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ marginTop: '0.85rem' }}>
                    {isActivated ? (
                      <Button variant="secondary" size="sm" fullWidth disabled>
                        Activated
                      </Button>
                    ) : (
                      <Button
                        variant={deal.tag === 'exclusive' ? 'primary' : 'secondary'}
                        size="sm"
                        fullWidth
                        onClick={() => handleActivate(deal.id)}
                      >
                        {deal.category === 'Healthcare' ? 'Learn more' : deal.expiresIn !== null && deal.expiresIn <= 5 ? 'Activate now' : 'Shop now'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredDeals.length === 0 && (
          <Card variant="outlined" padding="lg">
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                No offers in this category right now. Check back soon!
              </p>
              <Button variant="ghost" size="sm" style={{ marginTop: '0.75rem' }} onClick={() => setActiveCategory('All')}>
                View all offers
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* ================================================================= */}
      {/* Credit Limit Increase Center + Rewards Summary (side by side)     */}
      {/* ================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: '1rem',
        marginTop: '2.25rem',
      }}>

        {/* ----- Credit Limit Increase Center ----- */}
        <section>
          <SectionHeader
            title="Credit Limit Increase Center"
            subtitle="Based on your utilization and payment history"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {eligibleCLIs.map(cli => {
              const isExpanded = expandedCLI === cli.id;
              const increaseAmt = cli.potentialLimit - cli.currentLimit;

              return (
                <Card key={cli.id} variant="interactive" padding="md" onClick={() => setExpandedCLI(isExpanded ? null : cli.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Left: partner info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 auto' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: cli.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                      }}>
                        {cli.partner.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cli.partner}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.15rem' }}>
                          {cli.onTimePayments} consecutive on-time payments
                        </div>
                      </div>
                    </div>

                    {/* Right: limits */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Current</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatCurrency(cli.currentLimit)}</div>
                      </div>
                      <span style={{ fontSize: '1.2rem', color: 'var(--color-text-tertiary)' }}>&rarr;</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-success-text)', textTransform: 'uppercase', fontWeight: 600 }}>Potential</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-success-text)' }}>{formatCurrency(cli.potentialLimit)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Utilization</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cli.utilizationPct}%</div>
                          <ProgressBar value={cli.utilizationPct} max={100} color={cli.utilizationPct < 30 ? '#22c55e' : '#f59e0b'} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Increase</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success-text)' }}>+{formatCurrency(increaseAmt)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Payment streak</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cli.onTimePayments} months</div>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" fullWidth>
                        Request increase — no hard pull
                      </Button>
                      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', margin: '0.5rem 0 0', textAlign: 'center' }}>
                        Soft inquiry only. Decision in seconds.
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* ----- Rewards Summary Sidebar ----- */}
        <section>
          <SectionHeader title="Rewards This Month" />
          <Card variant="default" padding="lg">
            {/* Total */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Total Earned
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, marginTop: '0.25rem' }}>
                {formatCurrencyDecimal(totalRewards)}
              </div>
              <div style={{
                display: 'inline-block', marginTop: '0.4rem',
                padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-success-bg)', fontSize: '0.72rem', fontWeight: 600,
                color: 'var(--color-success-text)',
              }}>
                +12% vs last month
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {rewardsData.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {r.partner.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.partner}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {formatCurrencyDecimal(r.earned)}
                      </span>
                    </div>
                    <ProgressBar value={r.earned} max={totalRewards} color={r.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* Redeem CTA */}
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="primary" size="sm" fullWidth>
                Redeem all rewards
              </Button>
              <Button variant="ghost" size="sm" fullWidth>
                View rewards history
              </Button>
            </div>

            {/* Tip */}
            <div style={{
              marginTop: '1rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-info-bg)', fontSize: '0.72rem', lineHeight: 1.45,
              color: 'var(--color-info-text)',
            }}>
              <strong>Tip:</strong> Use your Amazon Store Card this weekend to earn 10x points during the Double Points event.
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
