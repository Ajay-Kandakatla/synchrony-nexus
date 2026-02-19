import { type ReactNode, useMemo, useState } from 'react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { useServices } from '../providers';

/**
 * Dashboard — the unified product overview.
 *
 * Simulates 15 real Synchrony partner credit cards to stress-test
 * the UI at scale. Shows how the platform handles a power user
 * with many products across different partner ecosystems.
 */

// ---------------------------------------------------------------------------
// Demo data: 15 realistic Synchrony credit cards
// ---------------------------------------------------------------------------

interface CardPerk {
  label: string;
  detail: string;
  icon: string;
}

interface DemoCard {
  id: string;
  partner: string;
  category: string;
  lastFour: string;
  balance: number;
  limit: number;
  minPayment: number;
  dueDate: string;
  daysUntilDue: number;
  apr: number;
  promoApr?: { rate: number; expires: string; balance: number };
  color: string;
  /** Partner-specific rewards and benefits */
  perks: CardPerk[];
  /** Where this card is best used */
  bestFor: string;
  /** Cashback / rewards rate at partner */
  rewardRate?: string;
  /** Whether this card earns rewards outside of partner */
  networkRewards?: string;
}

const demoCards: DemoCard[] = [
  {
    id: '1', partner: "Lowe's", category: 'Home', lastFour: '4521', balance: 4560, limit: 12000, minPayment: 85, dueDate: 'Feb 23', daysUntilDue: 5, apr: 29.99, promoApr: { rate: 0, expires: 'Mar 4', balance: 2340 }, color: '#004890',
    bestFor: 'Home improvement projects',
    rewardRate: '5% off every day',
    perks: [
      { label: '5% off purchases', detail: 'Everyday discount on all Lowe\'s purchases', icon: '🏷️' },
      { label: '0% promo financing', detail: '6-84 month financing on purchases $299+', icon: '📅' },
      { label: 'Exclusive cardholder events', detail: 'Early access to seasonal sales', icon: '🎟️' },
    ],
  },
  {
    id: '2', partner: 'Amazon Store Card', category: 'Retail', lastFour: '9102', balance: 2180, limit: 10000, minPayment: 47, dueDate: 'Mar 1', daysUntilDue: 11, apr: 29.49, color: '#FF9900',
    bestFor: 'Amazon & Whole Foods purchases',
    rewardRate: '5% back with Prime',
    perks: [
      { label: '5% back at Amazon', detail: 'On Amazon.com, Whole Foods, and Amazon Fresh with Prime', icon: '📦' },
      { label: 'Special financing', detail: '0% promo APR on purchases $150+ for 6-24 months', icon: '📅' },
      { label: 'No annual fee', detail: 'Unlimited 5% back with no yearly cost', icon: '✓' },
    ],
  },
  {
    id: '3', partner: 'CareCredit', category: 'Healthcare', lastFour: '7833', balance: 3872, limit: 8000, minPayment: 92, dueDate: 'Feb 28', daysUntilDue: 10, apr: 26.99, promoApr: { rate: 0, expires: 'Aug 15', balance: 3200 }, color: '#00857C',
    bestFor: 'Medical, dental, vision & vet expenses',
    rewardRate: '0% promo financing',
    perks: [
      { label: '0% promo on healthcare', detail: '6-60 month no-interest financing on $200+ treatments', icon: '🏥' },
      { label: '250K+ providers', detail: 'Accepted at dentists, vets, eye care, cosmetic, and more', icon: '🩺' },
      { label: 'Recurring charges', detail: 'Use for ongoing treatments and payment plans', icon: '🔄' },
    ],
  },
  {
    id: '4', partner: 'PayPal Credit', category: 'Digital', lastFour: '3341', balance: 890, limit: 5000, minPayment: 25, dueDate: 'Mar 5', daysUntilDue: 15, apr: 29.99, color: '#003087',
    bestFor: 'Online shopping anywhere PayPal is accepted',
    rewardRate: '0% for 6mo on $99+',
    perks: [
      { label: '0% for 6 months', detail: 'No interest if paid in full within 6 months on $99+', icon: '🛒' },
      { label: 'Millions of merchants', detail: 'Anywhere PayPal is accepted worldwide', icon: '🌐' },
      { label: 'PayPal Purchase Protection', detail: 'Full purchase protection on eligible items', icon: '🛡️' },
    ],
  },
  {
    id: '5', partner: 'Rooms To Go', category: 'Furniture', lastFour: '5567', balance: 6200, limit: 8000, minPayment: 145, dueDate: 'Feb 22', daysUntilDue: 4, apr: 29.99, promoApr: { rate: 0, expires: 'Jun 1', balance: 6200 }, color: '#B8232F',
    bestFor: 'Furniture & home decor purchases',
    rewardRate: 'Long-term 0% financing',
    perks: [
      { label: '0% interest up to 60 months', detail: 'No interest financing on qualifying purchases', icon: '🛋️' },
      { label: 'Free delivery offers', detail: 'Special delivery promotions for cardholders', icon: '🚚' },
      { label: 'In-store exclusives', detail: 'Cardholder-only pricing on select items', icon: '🏷️' },
    ],
  },
  {
    id: '6', partner: 'Mattress Firm', category: 'Furniture', lastFour: '2298', balance: 1400, limit: 4000, minPayment: 35, dueDate: 'Mar 3', daysUntilDue: 13, apr: 29.99, color: '#1B365D',
    bestFor: 'Mattresses & sleep products',
    rewardRate: '0% for 72 months',
    perks: [
      { label: '0% interest up to 72 months', detail: 'On qualifying mattress purchases $500+', icon: '🛏️' },
      { label: 'Stackable promos', detail: 'Use with in-store promotions for additional savings', icon: '💰' },
      { label: 'Sleep trial compatible', detail: 'Finance with confidence during sleep trial period', icon: '😴' },
    ],
  },
  {
    id: '7', partner: "Sam's Club", category: 'Wholesale', lastFour: '8812', balance: 340, limit: 7500, minPayment: 0, dueDate: 'Mar 10', daysUntilDue: 20, apr: 23.15, color: '#0060A9',
    bestFor: 'Bulk groceries, gas & wholesale shopping',
    rewardRate: '5% gas, 3% dining, 1% other',
    networkRewards: 'Mastercard — earns everywhere',
    perks: [
      { label: '5% back on gas', detail: 'At gas stations on first $6,000/yr, then 1%', icon: '⛽' },
      { label: '3% back on dining', detail: 'Restaurants, takeout, and food delivery', icon: '🍽️' },
      { label: '1% on everything else', detail: 'All other purchases earn 1% back', icon: '🛒' },
    ],
  },
  {
    id: '8', partner: 'Verizon Visa', category: 'Telecom', lastFour: '1190', balance: 1523, limit: 6000, minPayment: 35, dueDate: 'Feb 25', daysUntilDue: 7, apr: 24.49, color: '#CD040B',
    bestFor: 'Verizon bills, groceries & gas',
    rewardRate: '4% grocery & gas',
    networkRewards: 'Visa — earns Verizon Dollars everywhere',
    perks: [
      { label: '4% on groceries & gas', detail: 'Auto-applied Verizon Dollars on essentials', icon: '🛒' },
      { label: '3% on dining', detail: 'Restaurants, fast food, and delivery services', icon: '🍕' },
      { label: '2% on Verizon purchases', detail: 'Bill pay, devices, and accessories at Verizon', icon: '📱' },
      { label: '1% on everything else', detail: 'All other purchases earn Verizon Dollars', icon: '💳' },
    ],
  },
  {
    id: '9', partner: 'Guitar Center', category: 'Music', lastFour: '6654', balance: 2100, limit: 3500, minPayment: 55, dueDate: 'Mar 8', daysUntilDue: 18, apr: 29.99, promoApr: { rate: 0, expires: 'Apr 20', balance: 1800 }, color: '#000000',
    bestFor: 'Musical instruments & gear',
    rewardRate: '0% promo financing',
    perks: [
      { label: '0% interest up to 48 months', detail: 'On qualifying gear purchases', icon: '🎸' },
      { label: 'Exclusive gear offers', detail: 'Early access to sales and cardholder deals', icon: '🎵' },
      { label: 'Pro coverage stacking', detail: 'Combine with Guitar Center Pro Coverage plans', icon: '🛡️' },
    ],
  },
  {
    id: '10', partner: 'Dick\'s Sporting Goods', category: 'Sports', lastFour: '4478', balance: 0, limit: 3000, minPayment: 0, dueDate: '—', daysUntilDue: 99, apr: 29.99, color: '#00583E',
    bestFor: 'Sporting goods, fitness & outdoor gear',
    rewardRate: '5 points per $1',
    perks: [
      { label: '5X points at Dick\'s', detail: 'Earn 5 points per $1 at Dick\'s, Golf Galaxy, Public Lands', icon: '🏃' },
      { label: 'Special financing', detail: '6-12 month promotional financing on $299+', icon: '📅' },
      { label: 'ScoreRewards access', detail: 'Unlock bonus reward tiers faster', icon: '⭐' },
    ],
  },
  {
    id: '11', partner: 'JCPenney', category: 'Retail', lastFour: '9933', balance: 267, limit: 2500, minPayment: 27, dueDate: 'Mar 12', daysUntilDue: 22, apr: 28.99, color: '#B11116',
    bestFor: 'Apparel, home goods & JCPenney shopping',
    rewardRate: '5% back at JCPenney',
    perks: [
      { label: '5% back at JCPenney', detail: 'Extra rewards on all JCPenney purchases', icon: '👕' },
      { label: 'Special financing', detail: '0% interest for 12-60 months on $100+', icon: '📅' },
      { label: 'Extra coupons', detail: 'Exclusive cardholder-only discounts and first access', icon: '🎟️' },
    ],
  },
  {
    id: '12', partner: 'Ashley Furniture', category: 'Furniture', lastFour: '7710', balance: 4890, limit: 10000, minPayment: 110, dueDate: 'Feb 26', daysUntilDue: 8, apr: 29.99, promoApr: { rate: 0, expires: 'Sep 30', balance: 4890 }, color: '#7B2D26',
    bestFor: 'Furniture, home decor & Ashley purchases',
    rewardRate: '0% for up to 60 months',
    perks: [
      { label: '0% interest up to 60 months', detail: 'On qualifying Ashley Furniture purchases', icon: '🪑' },
      { label: 'Pre-approval offers', detail: 'Get pre-approved for purchases in minutes', icon: '✅' },
      { label: 'Design service access', detail: 'Free Ashley design consultations for cardholders', icon: '🎨' },
    ],
  },
  {
    id: '13', partner: 'Discount Tire', category: 'Auto', lastFour: '3321', balance: 780, limit: 3000, minPayment: 25, dueDate: 'Mar 2', daysUntilDue: 12, apr: 29.99, color: '#E31837',
    bestFor: 'Tires, wheels & auto service',
    rewardRate: '6 months promo financing',
    perks: [
      { label: '6 month financing', detail: 'No interest on purchases $199+ if paid in full', icon: '🔧' },
      { label: 'Tire price match', detail: 'Combine card financing with price match guarantee', icon: '🏷️' },
      { label: 'Road hazard eligible', detail: 'Stack with road hazard warranty coverage', icon: '🛞' },
    ],
  },
  {
    id: '14', partner: 'TJX Rewards', category: 'Retail', lastFour: '5544', balance: 412, limit: 2000, minPayment: 27, dueDate: 'Mar 7', daysUntilDue: 17, apr: 30.74, color: '#CC0000',
    bestFor: 'TJ Maxx, Marshalls, HomeGoods shopping',
    rewardRate: '5% back at TJX stores',
    perks: [
      { label: '5% back at TJX stores', detail: 'TJ Maxx, Marshalls, HomeGoods, Sierra, Homesense', icon: '🛍️' },
      { label: '1% everywhere else', detail: 'Earn rewards on all other Mastercard purchases', icon: '💳' },
      { label: '$10 reward certificates', detail: 'Every 1,000 points = $10 reward certificate', icon: '🎁' },
    ],
    networkRewards: 'Mastercard — earns 1% everywhere',
  },
  {
    id: '15', partner: 'Synchrony HOME', category: 'Home', lastFour: '1287', balance: 1950, limit: 15000, minPayment: 42, dueDate: 'Mar 15', daysUntilDue: 25, apr: 26.99, color: '#1A1A2E',
    bestFor: 'Flooring, HVAC, kitchen, bath & home projects',
    rewardRate: '2% back + promo financing',
    perks: [
      { label: '2% cashback', detail: 'On all purchases across 450K+ HOME merchants', icon: '🏠' },
      { label: 'Promo financing', detail: '0% for 12-60 months on qualifying home purchases', icon: '📅' },
      { label: 'Huge network', detail: 'Floor & Decor, Blinds.com, Sleep Number, Lumber Liquidators & more', icon: '🔗' },
      { label: 'Project flexibility', detail: 'Pay across multiple contractors with one card', icon: '🏗️' },
    ],
    networkRewards: 'Visa — earns 2% everywhere',
  },
];

// ---------------------------------------------------------------------------
// Purchase scenarios: "Best card for..." AI recommendations
// ---------------------------------------------------------------------------

interface PurchaseScenario {
  scenario: string;
  icon: string;
  recommendedCardId: string;
  reason: string;
  savings: string;
  alternativeCardId?: string;
  alternativeReason?: string;
}

const purchaseScenarios: PurchaseScenario[] = [
  {
    scenario: 'Grocery run at Whole Foods',
    icon: '🥑',
    recommendedCardId: '2',
    reason: '5% back with Amazon Store Card (Whole Foods is Amazon-owned)',
    savings: 'Save ~$15/month on $300 grocery bills',
    alternativeCardId: '8',
    alternativeReason: 'Verizon Visa earns 4% on groceries if shopping elsewhere',
  },
  {
    scenario: 'New HVAC system ($8,000)',
    icon: '❄️',
    recommendedCardId: '15',
    reason: 'Synchrony HOME offers 0% for 60 months at HVAC contractors + 2% back',
    savings: '$2,880 saved vs. 29.99% APR over 60 months',
    alternativeCardId: '1',
    alternativeReason: "Lowe's card gets 5% off if buying the unit at Lowe's",
  },
  {
    scenario: 'Dental implants ($3,200)',
    icon: '🦷',
    recommendedCardId: '3',
    reason: 'CareCredit offers 0% for 24 months on dental procedures — accepted by most dentists',
    savings: '$864 saved vs. paying on a regular card at 29.99%',
  },
  {
    scenario: 'Gas fill-up ($65)',
    icon: '⛽',
    recommendedCardId: '7',
    reason: "Sam's Club Mastercard earns 5% on gas (up to $6K/yr)",
    savings: '$3.25 per fill-up, ~$169/year',
    alternativeCardId: '8',
    alternativeReason: 'Verizon Visa earns 4% on gas as well',
  },
  {
    scenario: 'New tires ($800)',
    icon: '🛞',
    recommendedCardId: '13',
    reason: 'Discount Tire card: 6 month 0% financing + price match + road hazard',
    savings: '$0 interest if paid in 6 months vs. $120 at 29.99%',
  },
  {
    scenario: 'Weekend dining out ($120)',
    icon: '🍽️',
    recommendedCardId: '7',
    reason: "Sam's Club Mastercard earns 3% on all dining",
    savings: '$3.60 per meal, ~$187/year',
    alternativeCardId: '8',
    alternativeReason: 'Verizon Visa also earns 3% on dining',
  },
  {
    scenario: 'Living room set ($4,500)',
    icon: '🛋️',
    recommendedCardId: '5',
    reason: 'Rooms To Go: 0% for 60 months + exclusive cardholder pricing',
    savings: '$1,349 saved in interest over 5 years',
    alternativeCardId: '12',
    alternativeReason: 'Ashley Furniture card for 0% up to 60 months at Ashley stores',
  },
  {
    scenario: 'Online shopping ($200)',
    icon: '🛒',
    recommendedCardId: '2',
    reason: 'Amazon Store Card: 5% back ($10 savings) or 0% for 12 months on $150+',
    savings: '$10 cashback or $0 interest for 12 months',
    alternativeCardId: '4',
    alternativeReason: 'PayPal Credit: 0% for 6 months at any PayPal merchant',
  },
];

function getUtilColor(pct: number): string {
  if (pct <= 30) return '#16a34a';
  if (pct <= 50) return '#ca8a04';
  if (pct <= 75) return '#ea580c';
  return '#dc2626';
}

type SortKey = 'due_date' | 'balance_high' | 'utilization' | 'partner';
type FilterKey = 'all' | 'has_balance' | 'payment_due' | 'has_promo';

export default function Dashboard(): ReactNode {
  const { featureFlags } = useServices();
  const [sortBy, setSortBy] = useState<SortKey>('due_date');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [expandedPerks, setExpandedPerks] = useState<string | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  // Aggregate stats
  const totalBalance = demoCards.reduce((s, c) => s + c.balance, 0);
  const totalLimit = demoCards.reduce((s, c) => s + c.limit, 0);
  const totalAvailable = totalLimit - totalBalance;
  const overallUtil = Math.round((totalBalance / totalLimit) * 100);
  const upcomingPayments = demoCards.filter((c) => c.daysUntilDue <= 7 && c.minPayment > 0);
  const promoCards = demoCards.filter((c) => c.promoApr);

  // Filter
  const filtered = useMemo(() => {
    switch (filter) {
      case 'has_balance': return demoCards.filter((c) => c.balance > 0);
      case 'payment_due': return demoCards.filter((c) => c.daysUntilDue <= 7 && c.minPayment > 0);
      case 'has_promo': return demoCards.filter((c) => c.promoApr);
      default: return demoCards;
    }
  }, [filter]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sortBy) {
      case 'due_date': return copy.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
      case 'balance_high': return copy.sort((a, b) => b.balance - a.balance);
      case 'utilization': return copy.sort((a, b) => (b.balance / b.limit) - (a.balance / a.limit));
      case 'partner': return copy.sort((a, b) => a.partner.localeCompare(b.partner));
      default: return copy;
    }
  }, [filtered, sortBy]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>
          Good morning, Ajay
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Managing 15 Synchrony accounts across {new Set(demoCards.map(c => c.category)).size} categories
        </p>
      </div>

      {/* AI Insights — multiple alerts for power user */}
      {featureFlags.isEnabled('ai-copilot') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Card variant="default" padding="md" style={{ borderLeft: '3px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.125rem' }}>🚨</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.125rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  {upcomingPayments.length} payments due within 7 days — totaling ${upcomingPayments.reduce((s, c) => s + c.minPayment, 0).toLocaleString()}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {upcomingPayments.map(c => c.partner).join(', ')}
                </p>
              </div>
              <Button variant="primary" size="sm">Pay all</Button>
            </div>
          </Card>

          <Card variant="default" padding="md" style={{ borderLeft: '3px solid #ea580c' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.125rem' }}>⏰</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.125rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  {promoCards.length} promotional rates active — ${promoCards.reduce((s, c) => s + (c.promoApr?.balance ?? 0), 0).toLocaleString()} at 0% APR
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Lowe&apos;s promo expires in 14 days. Guitar Center expires in 61 days.
                </p>
              </div>
              <Button variant="secondary" size="sm">View promos</Button>
            </div>
          </Card>

          <Card variant="default" padding="md" style={{ borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.125rem' }}>🧠</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.125rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  AI found a debt reduction strategy saving $2,140/year in interest
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Avalanche method across your 15 cards — prioritize Rooms To Go and Lowe&apos;s promo payoffs
                </p>
              </div>
              <Button variant="ghost" size="sm" style={{ color: 'var(--color-primary)' }}>See plan →</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Aggregate stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Total balance', value: `$${totalBalance.toLocaleString()}`, sub: `across 15 cards` },
          { label: 'Available credit', value: `$${totalAvailable.toLocaleString()}`, sub: `of $${totalLimit.toLocaleString()} total` },
          { label: 'Overall utilization', value: `${overallUtil}%`, sub: overallUtil > 30 ? 'Above recommended 30%' : 'Healthy', color: getUtilColor(overallUtil) },
          { label: 'Upcoming payments', value: `$${upcomingPayments.reduce((s, c) => s + c.minPayment, 0).toLocaleString()}`, sub: `${upcomingPayments.length} cards due this week` },
          { label: 'Health score', value: '68', sub: 'Fair — room to improve', color: '#ca8a04' },
        ].map((stat) => (
          <Card key={stat.label} variant="default" padding="md">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '0.25rem', color: stat.color ?? 'var(--color-text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>
              {stat.sub}
            </div>
          </Card>
        ))}
      </div>

      {/* Account list header with filters + sort */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            Your accounts
            <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              {sorted.length} of {demoCards.length}
            </span>
          </h2>

          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {/* View toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                padding: '0.375rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {collapsed ? '▦ Cards' : '☰ Compact'}
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {([
            { key: 'all' as FilterKey, label: 'All (15)' },
            { key: 'has_balance' as FilterKey, label: `Has balance (${demoCards.filter(c => c.balance > 0).length})` },
            { key: 'payment_due' as FilterKey, label: `Due soon (${upcomingPayments.length})` },
            { key: 'has_promo' as FilterKey, label: `Promo active (${promoCards.length})` },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid var(--color-border)',
                backgroundColor: filter === f.key ? 'var(--color-primary)' : 'transparent',
                color: filter === f.key ? 'white' : 'var(--color-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}

          <span style={{ margin: '0 0.25rem', color: 'var(--color-border)' }}>|</span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <option value="due_date">Sort: Due date</option>
            <option value="balance_high">Sort: Balance (high)</option>
            <option value="utilization">Sort: Utilization</option>
            <option value="partner">Sort: A-Z</option>
          </select>
        </div>

        {/* Compact list view */}
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 1fr', gap: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Account</span>
              <span style={{ textAlign: 'right' }}>Balance</span>
              <span style={{ textAlign: 'right' }}>Limit</span>
              <span style={{ textAlign: 'center' }}>Util.</span>
              <span style={{ textAlign: 'right' }}>Payment due</span>
            </div>
            {sorted.map((card) => {
              const util = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;
              return (
                <div
                  key={card.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 80px 1fr',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: card.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{card.partner}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>****{card.lastFour}</span>
                    {card.promoApr && <span style={{ fontSize: '0.5625rem', padding: '0.0625rem 0.375rem', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }}>0%</span>}
                  </div>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>${card.balance.toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-tertiary)' }}>${card.limit.toLocaleString()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
                    <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', backgroundColor: getUtilColor(util), borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: getUtilColor(util), fontWeight: 600 }}>{util}%</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {card.minPayment > 0 ? (
                      <span style={{ fontWeight: 600, color: card.daysUntilDue <= 3 ? '#dc2626' : card.daysUntilDue <= 7 ? '#ea580c' : 'var(--color-text-primary)' }}>
                        ${card.minPayment} · {card.dueDate}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.75rem' }}>No balance</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Card grid view */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {sorted.map((card) => {
              const util = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;
              return (
                <Card key={card.id} variant="default" padding="none" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                  {/* Color accent bar */}
                  <div style={{ height: '3px', backgroundColor: card.color }} />
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{card.partner}</h3>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                          {card.category} · ****{card.lastFour}
                        </span>
                      </div>
                      {card.promoApr && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                          backgroundColor: '#dcfce7', color: '#15803d',
                        }}>
                          0% APR → {card.promoApr.expires}
                        </span>
                      )}
                    </div>

                    {/* Balance */}
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      ${card.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </div>

                    {/* Utilization bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', borderRadius: '2px', backgroundColor: getUtilColor(util), transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: getUtilColor(util), fontWeight: 600 }}>{util}%</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>
                      ${(card.limit - card.balance).toLocaleString()} available of ${card.limit.toLocaleString()}
                    </div>

                    {/* Payment due */}
                    {card.minPayment > 0 && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                        backgroundColor: card.daysUntilDue <= 3 ? 'var(--color-error-bg)' : card.daysUntilDue <= 7 ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: card.daysUntilDue <= 3 ? 'var(--color-error-text)' : card.daysUntilDue <= 7 ? 'var(--color-warning-text)' : 'var(--color-info-text)',
                      }}>
                        ${card.minPayment} minimum due {card.dueDate} ({card.daysUntilDue}d)
                      </div>
                    )}

                    {/* Zero balance state */}
                    {card.balance === 0 && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-bg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success-text)' }}>
                        ✓ No balance — no payment due
                      </div>
                    )}

                    {/* Promo alert */}
                    {card.promoApr && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                        ${card.promoApr.balance.toLocaleString()} at {card.promoApr.rate}% through {card.promoApr.expires} · Then {card.apr}%
                      </div>
                    )}

                    {/* Best-for tag */}
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-tertiary)',
                    }}>
                      <span style={{ color: card.color, fontWeight: 700 }}>Best for:</span>
                      <span>{card.bestFor}</span>
                    </div>

                    {/* Reward rate pill */}
                    {card.rewardRate && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.375rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--color-info-bg)',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: 'var(--color-info-text)',
                      }}>
                        {card.rewardRate}
                        {card.networkRewards && (
                          <span style={{ fontWeight: 400, opacity: 0.8 }}> · {card.networkRewards}</span>
                        )}
                      </div>
                    )}

                    {/* Expandable perks */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPerks(expandedPerks === card.id ? null : card.id);
                      }}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.6875rem',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {expandedPerks === card.id ? '▾' : '▸'} {card.perks.length} cardholder perks
                    </button>

                    {expandedPerks === card.id && (
                      <div style={{
                        marginTop: '0.375rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}>
                        {card.perks.map((perk) => (
                          <div key={perk.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', lineHeight: '1.2' }}>{perk.icon}</span>
                            <div>
                              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {perk.label}
                              </div>
                              <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>
                                {perk.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem' }}>
                      <Button variant="primary" size="sm" style={{ flex: 1, fontSize: '0.75rem' }} disabled={card.balance === 0}>
                        Pay
                      </Button>
                      <Button variant="secondary" size="sm" style={{ flex: 1, fontSize: '0.75rem' }}>
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Card Selector — "Best card for your next purchase" */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            Best card for your next purchase
          </h2>
          <span style={{
            fontSize: '0.5625rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            AI Powered
          </span>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          You have 15 cards — here is which one to pull out for common purchases to maximize your value.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '0.5rem',
        }}>
          {purchaseScenarios.map((scenario) => {
            const recommended = demoCards.find(c => c.id === scenario.recommendedCardId);
            const alternative = scenario.alternativeCardId ? demoCards.find(c => c.id === scenario.alternativeCardId) : undefined;
            const isExpanded = expandedScenario === scenario.scenario;

            return (
              <Card key={scenario.scenario} variant="interactive" padding="none" style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedScenario(isExpanded ? null : scenario.scenario)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{scenario.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {scenario.scenario}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.0625rem' }}>
                      Use <span style={{ fontWeight: 700, color: recommended?.color }}>{recommended?.partner}</span> · {scenario.savings}
                    </div>
                  </div>
                  {recommended && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: recommended.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.5rem',
                      fontWeight: 800,
                      color: 'white',
                      flexShrink: 0,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      textAlign: 'center',
                    }}>
                      {recommended.partner.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', transition: 'transform 150ms ease', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                </button>

                {isExpanded && (
                  <div style={{
                    padding: '0 1rem 0.75rem',
                    borderTop: '1px solid var(--color-border)',
                  }}>
                    {/* Primary recommendation */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      padding: '0.75rem 0 0.5rem',
                    }}>
                      <div style={{
                        width: '6px',
                        borderRadius: '3px',
                        backgroundColor: recommended?.color,
                        alignSelf: 'stretch',
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>
                          Top pick
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                          {recommended?.partner} ****{recommended?.lastFour}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {scenario.reason}
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginTop: '0.375rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: '#dcfce7',
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: '#15803d',
                        }}>
                          {scenario.savings}
                        </div>
                      </div>
                    </div>

                    {/* Alternative */}
                    {alternative && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        padding: '0.5rem 0 0',
                        borderTop: '1px dashed var(--color-border)',
                      }}>
                        <div style={{
                          width: '6px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--color-border)',
                          alignSelf: 'stretch',
                          flexShrink: 0,
                        }} />
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>
                            Alternative
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>
                            {alternative.partner} ****{alternative.lastFour}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>
                            {scenario.alternativeReason}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* AI suggested actions */}
      {featureFlags.isEnabled('ai-copilot') && (
        <div>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600 }}>
            AI recommendations for your portfolio
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '🎯', title: 'Debt avalanche strategy', description: 'Pay minimums on 14 cards, throw extra at TJX Rewards (30.74% APR). Saves $2,140/year.', cta: 'See full plan' },
              { icon: '⏰', title: 'Promo payoff priority', description: "Pay off Lowe's $2,340 promo before Mar 4 to avoid $701/yr in interest at 29.99%", cta: 'Schedule payment' },
              { icon: '📊', title: 'Utilization optimization', description: 'Rooms To Go is at 78%. Paying $2,200 brings total utilization under 30% — potential +20pt score boost', cta: 'Simulate' },
              { icon: '💳', title: 'Consider consolidation', description: 'With 15 cards, a balance transfer to Synchrony HOME (26.99%) could simplify payments and reduce interest', cta: 'Compare options' },
            ].map((s) => (
              <Card key={s.title} variant="interactive" padding="md">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.125rem', fontSize: '0.875rem', fontWeight: 600 }}>{s.title}</h4>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{s.description}</p>
                    <Button variant="ghost" size="sm" style={{ padding: 0, color: 'var(--color-primary)' }}>{s.cta} →</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
