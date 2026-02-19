import { type ReactNode, useState, useMemo } from 'react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';

// ---------------------------------------------------------------------------
// Demo data: 15 partner credit cards (matching Dashboard dataset)
// ---------------------------------------------------------------------------

interface DemoCard {
  id: string;
  partner: string;
  lastFour: string;
  balance: number;
  limit: number;
  minPayment: number;
  dueDate: string;
  daysUntilDue: number;
  apr: number;
  promoApr?: { rate: number; expires: string; balance: number };
  color: string;
  autopay: boolean;
  autopayAmount: 'min' | 'statement' | 'full';
}

const demoCards: DemoCard[] = [
  { id: '1', partner: "Lowe's", lastFour: '4521', balance: 4560, limit: 12000, minPayment: 85, dueDate: 'Feb 23', daysUntilDue: 5, apr: 29.99, promoApr: { rate: 0, expires: 'Mar 4', balance: 2340 }, color: '#004890', autopay: true, autopayAmount: 'min' },
  { id: '2', partner: 'Amazon Store Card', lastFour: '9102', balance: 2180, limit: 10000, minPayment: 47, dueDate: 'Mar 1', daysUntilDue: 11, apr: 29.49, color: '#FF9900', autopay: false, autopayAmount: 'min' },
  { id: '3', partner: 'CareCredit', lastFour: '7833', balance: 3872, limit: 8000, minPayment: 92, dueDate: 'Feb 28', daysUntilDue: 10, apr: 26.99, promoApr: { rate: 0, expires: 'Aug 15', balance: 3200 }, color: '#00857C', autopay: true, autopayAmount: 'statement' },
  { id: '4', partner: 'PayPal Credit', lastFour: '3341', balance: 890, limit: 5000, minPayment: 25, dueDate: 'Mar 5', daysUntilDue: 15, apr: 29.99, color: '#003087', autopay: false, autopayAmount: 'min' },
  { id: '5', partner: 'Rooms To Go', lastFour: '5567', balance: 6200, limit: 8000, minPayment: 145, dueDate: 'Feb 22', daysUntilDue: 4, apr: 29.99, promoApr: { rate: 0, expires: 'Jun 1', balance: 6200 }, color: '#B8232F', autopay: true, autopayAmount: 'full' },
  { id: '6', partner: 'Mattress Firm', lastFour: '2298', balance: 1400, limit: 4000, minPayment: 35, dueDate: 'Mar 3', daysUntilDue: 13, apr: 29.99, color: '#1B365D', autopay: false, autopayAmount: 'min' },
  { id: '7', partner: "Sam's Club", lastFour: '8812', balance: 340, limit: 7500, minPayment: 0, dueDate: 'Mar 10', daysUntilDue: 20, apr: 23.15, color: '#0060A9', autopay: true, autopayAmount: 'full' },
  { id: '8', partner: 'Verizon Visa', lastFour: '1190', balance: 1523, limit: 6000, minPayment: 35, dueDate: 'Feb 25', daysUntilDue: 7, apr: 24.49, color: '#CD040B', autopay: false, autopayAmount: 'min' },
  { id: '9', partner: 'Guitar Center', lastFour: '6654', balance: 2100, limit: 3500, minPayment: 55, dueDate: 'Mar 8', daysUntilDue: 18, apr: 29.99, promoApr: { rate: 0, expires: 'Apr 20', balance: 1800 }, color: '#000000', autopay: false, autopayAmount: 'min' },
  { id: '10', partner: "Dick's Sporting Goods", lastFour: '4478', balance: 0, limit: 3000, minPayment: 0, dueDate: '\u2014', daysUntilDue: 99, apr: 29.99, color: '#00583E', autopay: false, autopayAmount: 'min' },
  { id: '11', partner: 'JCPenney', lastFour: '9933', balance: 267, limit: 2500, minPayment: 27, dueDate: 'Mar 12', daysUntilDue: 22, apr: 28.99, color: '#B11116', autopay: true, autopayAmount: 'min' },
  { id: '12', partner: 'Ashley Furniture', lastFour: '7710', balance: 4890, limit: 10000, minPayment: 110, dueDate: 'Feb 26', daysUntilDue: 8, apr: 29.99, promoApr: { rate: 0, expires: 'Sep 30', balance: 4890 }, color: '#7B2D26', autopay: false, autopayAmount: 'min' },
  { id: '13', partner: 'Discount Tire', lastFour: '3321', balance: 780, limit: 3000, minPayment: 25, dueDate: 'Mar 2', daysUntilDue: 12, apr: 29.99, color: '#E31837', autopay: false, autopayAmount: 'min' },
  { id: '14', partner: 'TJX Rewards', lastFour: '5544', balance: 412, limit: 2000, minPayment: 27, dueDate: 'Mar 7', daysUntilDue: 17, apr: 30.74, color: '#CC0000', autopay: true, autopayAmount: 'min' },
  { id: '15', partner: 'Nexus HOME', lastFour: '1287', balance: 1950, limit: 15000, minPayment: 42, dueDate: 'Mar 15', daysUntilDue: 25, apr: 26.99, color: '#1A1A2E', autopay: false, autopayAmount: 'min' },
];

// ---------------------------------------------------------------------------
// Strategy engine — computes payoff metrics for avalanche/snowball/promo
// ---------------------------------------------------------------------------

type Strategy = 'avalanche' | 'snowball' | 'promo';

interface StrategyResult {
  cardId: string;
  order: number;
  monthsToPayoff: number;
  interestPaid: number;
}

function computeStrategy(cards: DemoCard[], strategy: Strategy): { results: StrategyResult[]; totalInterest: number; totalMonths: number } {
  const withBalance = cards.filter(c => c.balance > 0);
  let sorted: DemoCard[];
  switch (strategy) {
    case 'avalanche':
      sorted = [...withBalance].sort((a, b) => b.apr - a.apr);
      break;
    case 'snowball':
      sorted = [...withBalance].sort((a, b) => a.balance - b.balance);
      break;
    case 'promo':
      sorted = [...withBalance].sort((a, b) => {
        const aDays = a.promoApr ? daysUntilExpiry(a.promoApr.expires) : 9999;
        const bDays = b.promoApr ? daysUntilExpiry(b.promoApr.expires) : 9999;
        return aDays - bDays;
      });
      break;
  }
  let totalInterest = 0;
  const results: StrategyResult[] = sorted.map((card, idx) => {
    const rate = card.promoApr ? card.promoApr.rate : card.apr;
    const monthlyRate = rate / 100 / 12;
    const months = monthlyRate > 0
      ? Math.ceil(Math.log(card.balance * monthlyRate / card.minPayment + 1) / Math.log(1 + monthlyRate))
      : Math.ceil(card.balance / Math.max(card.minPayment, 25));
    const interest = Math.round(card.balance * monthlyRate * Math.min(months, 120));
    totalInterest += interest;
    return { cardId: card.id, order: idx + 1, monthsToPayoff: Math.min(months || 1, 120), interestPaid: interest };
  });
  return { results, totalInterest, totalMonths: Math.max(...results.map(r => r.monthsToPayoff), 0) };
}

function daysUntilExpiry(dateStr: string): number {
  const map: Record<string, number> = { 'Mar 4': 14, 'Aug 15': 178, 'Jun 1': 103, 'Apr 20': 61, 'Sep 30': 224 };
  return map[dateStr] ?? 365;
}

function urgencyColor(days: number): string {
  if (days <= 3) return 'var(--color-error-text)';
  if (days <= 7) return 'var(--color-warning-text)';
  return 'var(--color-success-text)';
}

function urgencyBg(days: number): string {
  if (days <= 3) return 'var(--color-error-bg)';
  if (days <= 7) return 'var(--color-warning-bg)';
  return 'var(--color-success-bg)';
}

// ---------------------------------------------------------------------------
// Payment history demo data
// ---------------------------------------------------------------------------

interface PaymentRecord {
  id: string;
  date: string;
  cardId: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'failed';
  confirmation: string;
}

const paymentHistory: PaymentRecord[] = [
  { id: 'p1', date: 'Feb 15', cardId: '1', amount: 85, status: 'confirmed', confirmation: 'SYN-8842910' },
  { id: 'p2', date: 'Feb 14', cardId: '5', amount: 300, status: 'confirmed', confirmation: 'SYN-8841022' },
  { id: 'p3', date: 'Feb 13', cardId: '3', amount: 92, status: 'confirmed', confirmation: 'SYN-8839741' },
  { id: 'p4', date: 'Feb 12', cardId: '8', amount: 50, status: 'pending', confirmation: 'SYN-8838103' },
  { id: 'p5', date: 'Feb 10', cardId: '12', amount: 200, status: 'confirmed', confirmation: 'SYN-8835290' },
  { id: 'p6', date: 'Feb 8', cardId: '2', amount: 47, status: 'failed', confirmation: 'SYN-8832001' },
  { id: 'p7', date: 'Feb 5', cardId: '14', amount: 27, status: 'confirmed', confirmation: 'SYN-8828490' },
  { id: 'p8', date: 'Feb 3', cardId: '9', amount: 55, status: 'confirmed', confirmation: 'SYN-8825112' },
];

// ---------------------------------------------------------------------------
// Payments page component
// ---------------------------------------------------------------------------

type PaymentSource = 'checking' | 'savings';
type PayOption = 'min' | 'statement' | 'custom';
type Section = 'strategy' | 'schedule' | 'quickpay' | 'autopay' | 'history';

export default function Payments(): ReactNode {
  const [activeStrategy, setActiveStrategy] = useState<Strategy>('avalanche');
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(['strategy', 'schedule', 'quickpay', 'autopay', 'history']));
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [payOption, setPayOption] = useState<PayOption>('min');
  const [customAmount, setCustomAmount] = useState('');
  const [paySource, setPaySource] = useState<PaymentSource>('checking');
  const [payStep, setPayStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [autopayState, setAutopayState] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    demoCards.forEach(c => { state[c.id] = c.autopay; });
    return state;
  });
  const [autopayAmounts, setAutopayAmounts] = useState<Record<string, string>>(() => {
    const state: Record<string, string> = {};
    demoCards.forEach(c => { state[c.id] = c.autopayAmount; });
    return state;
  });

  // Interest Impact Calculator state
  const [selectedImpactOption, setSelectedImpactOption] = useState<'minimum' | 'double' | 'highApr'>('minimum');

  // Interest Impact Calculator computations
  const impactCalc = useMemo(() => {
    const cardsWithBalance = demoCards.filter(c => c.balance > 0);
    const totalBalance = cardsWithBalance.reduce((s, c) => s + c.balance, 0);
    const totalMinPayment = cardsWithBalance.reduce((s, c) => s + c.minPayment, 0);

    // Three payment scenarios
    const scenarios = {
      minimum: { label: 'Pay minimum', amount: totalMinPayment, description: 'Minimum across all cards' },
      double: { label: 'Pay double', amount: totalMinPayment * 2, description: 'Double minimum payments' },
      highApr: { label: 'Pay off high-APR first', amount: 3200, description: 'Target cards over 29% APR' },
    } as const;

    function computePayoffMetrics(monthlyPayment: number) {
      let totalInterest = 0;
      let maxMonths = 0;
      let monthlyInterestCost = 0;

      cardsWithBalance.forEach(card => {
        const effectiveApr = card.promoApr ? card.promoApr.rate : card.apr;
        const monthlyRate = effectiveApr / 100 / 12;
        const cardShare = card.minPayment / totalMinPayment;
        const cardPayment = Math.max(monthlyPayment * cardShare, card.minPayment);

        if (monthlyRate > 0 && cardPayment > card.balance * monthlyRate) {
          const months = Math.ceil(
            -Math.log(1 - (card.balance * monthlyRate) / cardPayment) / Math.log(1 + monthlyRate)
          );
          const clampedMonths = Math.min(Math.max(months, 1), 360);
          const interest = Math.round((cardPayment * clampedMonths) - card.balance);
          totalInterest += Math.max(interest, 0);
          maxMonths = Math.max(maxMonths, clampedMonths);
          monthlyInterestCost += Math.round(card.balance * monthlyRate);
        } else if (monthlyRate > 0) {
          // Payment barely covers interest
          totalInterest += Math.round(card.balance * monthlyRate * 360);
          maxMonths = 360;
          monthlyInterestCost += Math.round(card.balance * monthlyRate);
        } else {
          // 0% promo
          const months = Math.ceil(card.balance / cardPayment);
          maxMonths = Math.max(maxMonths, Math.min(months, 360));
        }
      });

      const principalRatio = totalInterest > 0
        ? totalBalance / (totalBalance + totalInterest)
        : 1;
      const interestRatio = 1 - principalRatio;

      return { totalInterest, months: maxMonths, monthlyInterestCost, principalRatio, interestRatio };
    }

    const min = computePayoffMetrics(scenarios.minimum.amount);
    const dbl = computePayoffMetrics(scenarios.double.amount);
    const high = computePayoffMetrics(scenarios.highApr.amount);

    return {
      totalBalance,
      scenarios,
      metrics: { minimum: min, double: dbl, highApr: high },
      savings: {
        doubleVsMin: {
          interestSaved: min.totalInterest - dbl.totalInterest,
          monthsSaved: min.months - dbl.months,
        },
        highAprVsMin: {
          interestSaved: min.totalInterest - high.totalInterest,
          monthsSaved: min.months - high.months,
        },
      },
    };
  }, []);

  // Aggregates
  const upcomingThisWeek = demoCards.filter(c => c.daysUntilDue <= 7 && c.minPayment > 0);
  const totalDueThisWeek = upcomingThisWeek.reduce((s, c) => s + c.minPayment, 0);

  // Strategy computations
  const avalanche = useMemo(() => computeStrategy(demoCards, 'avalanche'), []);
  const snowball = useMemo(() => computeStrategy(demoCards, 'snowball'), []);
  const promo = useMemo(() => computeStrategy(demoCards, 'promo'), []);
  const strategies = { avalanche, snowball, promo };
  const currentStrategy = strategies[activeStrategy];
  const maxInterest = Math.max(avalanche.totalInterest, snowball.totalInterest, promo.totalInterest);

  // Schedule grouped by week
  const scheduleCards = demoCards.filter(c => c.minPayment > 0).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const weekGroups = useMemo(() => {
    const groups: { label: string; cards: DemoCard[] }[] = [
      { label: 'This week (0-7 days)', cards: [] },
      { label: 'Next week (8-14 days)', cards: [] },
      { label: 'In 2 weeks (15-21 days)', cards: [] },
      { label: 'In 3-4 weeks (22-30 days)', cards: [] },
    ];
    scheduleCards.forEach(c => {
      const g = c.daysUntilDue <= 7 ? groups[0]
        : c.daysUntilDue <= 14 ? groups[1]
        : c.daysUntilDue <= 21 ? groups[2]
        : groups[3];
      if (g) g.cards.push(c);
    });
    return groups.filter(g => g.cards.length > 0);
  }, []);

  function toggleSection(s: Section) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function getPaymentAmount(card: DemoCard): number {
    if (payOption === 'min') return card.minPayment;
    if (payOption === 'statement') return card.balance;
    return Number(customAmount) || 0;
  }

  function startPayment(cardId: string) {
    setPayingCardId(cardId);
    setPayStep('select');
    setPayOption('min');
    setCustomAmount('');
  }

  function confirmPayment() { setPayStep('confirm'); }
  function executePayment() { setPayStep('done'); }
  function closePayment() { setPayingCardId(null); setPayStep('select'); }

  const sectionHeader = (title: string, section: Section, badge?: string) => (
    <button
      onClick={() => toggleSection(section)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
        borderBottom: '1px solid var(--color-border)', marginBottom: expandedSections.has(section) ? '1rem' : '0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h2>
        {badge && (
          <span style={{
            fontSize: '0.5625rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
            backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{badge}</span>
        )}
      </div>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', transition: 'transform 150ms ease', transform: expandedSections.has(section) ? 'rotate(180deg)' : 'none' }}>
        &#x25BE;
      </span>
    </button>
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>Payments</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Manage payments across all 15 accounts
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Payment Hub Header */}
      {/* ----------------------------------------------------------------- */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--color-primary), #1a3a5c)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Due this week
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
              ${totalDueThisWeek.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.125rem' }}>
              {upcomingThisWeek.length} card{upcomingThisWeek.length !== 1 ? 's' : ''} with payments due within 7 days
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Button variant="secondary" size="lg" style={{ backgroundColor: 'white', color: 'var(--color-primary)', border: 'none', fontWeight: 700 }}>
              Pay all minimums &mdash; ${totalDueThisWeek}
            </Button>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)' }}>
              from Checking ****4823
            </span>
          </div>
        </div>
        {/* Mini card pills showing which cards are due */}
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {upcomingThisWeek.map(c => (
            <span key={c.id} style={{
              padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)',
            }}>
              {c.partner} &middot; ${c.minPayment} &middot; {c.dueDate}
            </span>
          ))}
        </div>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Smart Pay-Down Engine */}
      {/* ----------------------------------------------------------------- */}
      {sectionHeader('Smart Pay-Down Engine', 'strategy', 'AI Powered')}
      {expandedSections.has('strategy') && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Strategy tabs */}
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
            {([
              { key: 'avalanche' as Strategy, label: 'Avalanche', sub: 'Highest APR first' },
              { key: 'snowball' as Strategy, label: 'Snowball', sub: 'Lowest balance first' },
              { key: 'promo' as Strategy, label: 'Promo Deadline', sub: 'Expiring promos first' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveStrategy(tab.key)}
                style={{
                  flex: 1, padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: activeStrategy === tab.key ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: activeStrategy === tab.key ? 'var(--color-info-bg)' : 'var(--color-surface)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: activeStrategy === tab.key ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{tab.label}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.0625rem' }}>{tab.sub}</div>
              </button>
            ))}
          </div>

          {/* Comparison bar chart */}
          <Card variant="outlined" padding="md" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Total projected interest comparison
            </div>
            {(['avalanche', 'snowball', 'promo'] as Strategy[]).map(s => {
              const data = strategies[s];
              const pct = maxInterest > 0 ? (data.totalInterest / maxInterest) * 100 : 0;
              const isActive = s === activeStrategy;
              const labels = { avalanche: 'Avalanche', snowball: 'Snowball', promo: 'Promo Deadline' };
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '90px', fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                    {labels[s]}
                  </div>
                  <div style={{ flex: 1, height: '20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                      transition: 'width 300ms ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem',
                    }}>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)' }}>
                        ${data.totalInterest.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '65px', textAlign: 'right', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                    {data.totalMonths}mo
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-success-text)', fontWeight: 600 }}>
              {activeStrategy === 'avalanche' ? 'Best strategy for minimizing total interest paid' : activeStrategy === 'snowball' ? 'Best strategy for quick wins and motivation' : 'Best strategy for avoiding deferred interest penalties'}
            </div>
          </Card>

          {/* Ordered payoff list for current strategy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {currentStrategy.results.map(r => {
              const card = demoCards.find(c => c.id === r.cardId)!;
              return (
                <Card key={r.cardId} variant="default" padding="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', backgroundColor: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.625rem', fontWeight: 800, color: 'white', flexShrink: 0,
                  }}>{r.order}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{card.partner} <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>****{card.lastFour}</span></div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                      ${card.balance.toLocaleString()} balance &middot; {card.apr}% APR
                      {card.promoApr && <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}> &middot; 0% until {card.promoApr.expires}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.monthsToPayoff}mo</div>
                    <div style={{ fontSize: '0.625rem', color: r.interestPaid > 0 ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                      {r.interestPaid > 0 ? `$${r.interestPaid.toLocaleString()} interest` : '$0 interest'}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Button variant="primary" size="md">Apply this strategy &mdash; set up payment schedule</Button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Payment Schedule (calendar-like) */}
      {/* ----------------------------------------------------------------- */}
      {sectionHeader('Payment Schedule', 'schedule')}
      {expandedSections.has('schedule') && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {weekGroups.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem',
              }}>{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {group.cards.map(card => (
                  <Card key={card.id} variant="default" padding="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '6px', height: '32px', borderRadius: '3px', flexShrink: 0,
                      backgroundColor: urgencyColor(card.daysUntilDue),
                    }} />
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', backgroundColor: card.color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{card.partner}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>****{card.lastFour}</div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                      backgroundColor: urgencyBg(card.daysUntilDue), fontSize: '0.6875rem', fontWeight: 600,
                      color: urgencyColor(card.daysUntilDue),
                    }}>
                      {card.dueDate} ({card.daysUntilDue}d)
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                      ${card.minPayment}
                    </div>
                    <Button variant="primary" size="sm" onClick={() => startPayment(card.id)} style={{ flexShrink: 0 }}>Pay</Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Quick Pay Cards */}
      {/* ----------------------------------------------------------------- */}
      {sectionHeader('Quick Pay', 'quickpay')}
      {expandedSections.has('quickpay') && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {demoCards.filter(c => c.balance > 0).map(card => {
              const isActive = payingCardId === card.id;
              const amount = getPaymentAmount(card);

              return (
                <Card key={card.id} variant={isActive ? 'elevated' : 'default'} padding="none" style={{ overflow: 'hidden' }}>
                  <div style={{ height: '3px', backgroundColor: card.color }} />
                  <div style={{ padding: '1rem' }}>
                    {/* Card info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{card.partner}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>****{card.lastFour} &middot; {card.apr}% APR</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>${card.balance.toLocaleString()}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>balance</div>
                      </div>
                    </div>

                    {/* Payment due info */}
                    {card.minPayment > 0 && (
                      <div style={{
                        fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.75rem',
                        color: urgencyColor(card.daysUntilDue),
                      }}>
                        ${card.minPayment} min due {card.dueDate} ({card.daysUntilDue}d)
                      </div>
                    )}

                    {/* Multi-step inline payment */}
                    {!isActive ? (
                      <Button variant="primary" size="sm" fullWidth onClick={() => startPayment(card.id)}>
                        Make payment
                      </Button>
                    ) : payStep === 'select' ? (
                      <div>
                        {/* Pay amount options */}
                        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                          {([
                            { key: 'min' as PayOption, label: 'Minimum', value: `$${card.minPayment}` },
                            { key: 'statement' as PayOption, label: 'Full balance', value: `$${card.balance.toLocaleString()}` },
                            { key: 'custom' as PayOption, label: 'Custom', value: '' },
                          ]).map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setPayOption(opt.key)}
                              style={{
                                flex: 1, padding: '0.375rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                border: payOption === opt.key ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                backgroundColor: payOption === opt.key ? 'var(--color-info-bg)' : 'transparent',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{opt.label}</div>
                              {opt.value && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{opt.value}</div>}
                            </button>
                          ))}
                        </div>

                        {/* Custom amount input */}
                        {payOption === 'custom' && (
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={e => setCustomAmount(e.target.value)}
                            style={{
                              width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)', fontSize: '0.875rem', fontWeight: 600,
                              marginBottom: '0.625rem', boxSizing: 'border-box',
                              backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)',
                            }}
                          />
                        )}

                        {/* Payment source */}
                        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                          <button
                            onClick={() => setPaySource('checking')}
                            style={{
                              flex: 1, padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                              border: paySource === 'checking' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: paySource === 'checking' ? 'var(--color-info-bg)' : 'transparent',
                              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'left',
                            }}
                          >
                            Checking ****4823
                          </button>
                          <button
                            onClick={() => setPaySource('savings')}
                            style={{
                              flex: 1, padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                              border: paySource === 'savings' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: paySource === 'savings' ? 'var(--color-info-bg)' : 'transparent',
                              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'left',
                            }}
                          >
                            Savings ****7712
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={closePayment}>Cancel</Button>
                          <Button variant="primary" size="sm" style={{ flex: 2 }} onClick={confirmPayment} disabled={payOption === 'custom' && !customAmount}>
                            Review &mdash; ${amount.toLocaleString()}
                          </Button>
                        </div>
                      </div>
                    ) : payStep === 'confirm' ? (
                      <div>
                        <Card variant="outlined" padding="sm" style={{ marginBottom: '0.625rem' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginBottom: '0.375rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Confirm payment
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Amount</span>
                            <span style={{ fontWeight: 700 }}>${amount.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>To</span>
                            <span style={{ fontWeight: 600 }}>{card.partner} ****{card.lastFour}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>From</span>
                            <span style={{ fontWeight: 600 }}>{paySource === 'checking' ? 'Checking ****4823' : 'Savings ****7712'}</span>
                          </div>
                        </Card>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <Button variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => setPayStep('select')}>Back</Button>
                          <Button variant="primary" size="sm" style={{ flex: 2 }} onClick={executePayment}>Confirm payment</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-success-bg)',
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>&#10003;</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success-text)', marginBottom: '0.125rem' }}>
                          Payment submitted
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                          ${amount.toLocaleString()} to {card.partner} from {paySource === 'checking' ? 'Checking ****4823' : 'Savings ****7712'}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                          Confirmation: SYN-{Math.random().toString(36).slice(2, 9).toUpperCase()}
                        </div>
                        <Button variant="ghost" size="sm" onClick={closePayment}>Done</Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Autopay Manager */}
      {/* ----------------------------------------------------------------- */}
      {sectionHeader('Autopay Manager', 'autopay')}
      {expandedSections.has('autopay') && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Card variant="default" padding="sm" style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autopay on</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-text)' }}>
                {Object.values(autopayState).filter(Boolean).length}
              </div>
            </Card>
            <Card variant="default" padding="sm" style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autopay off</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error-text)' }}>
                {Object.values(autopayState).filter(v => !v).length}
              </div>
            </Card>
            <Card variant="default" padding="sm" style={{ flex: 2, minWidth: '200px' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommendation</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.125rem' }}>
                Enable autopay on all cards to avoid late fees. {Object.values(autopayState).filter(v => !v).length} cards at risk.
              </div>
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {demoCards.filter(c => c.balance > 0).map(card => (
              <Card key={card.id} variant="default" padding="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: card.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{card.partner} <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', fontSize: '0.6875rem' }}>****{card.lastFour}</span></div>
                </div>
                {/* Autopay amount selector */}
                <select
                  value={autopayAmounts[card.id]}
                  onChange={e => setAutopayAmounts(prev => ({ ...prev, [card.id]: e.target.value }))}
                  style={{
                    padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                    fontSize: '0.6875rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', cursor: 'pointer',
                  }}
                >
                  <option value="min">Minimum</option>
                  <option value="statement">Statement</option>
                  <option value="full">Full balance</option>
                </select>
                {/* Toggle */}
                <button
                  onClick={() => setAutopayState(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    backgroundColor: autopayState[card.id] ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', transition: 'background-color 150ms ease', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                    position: 'absolute', top: '3px',
                    left: autopayState[card.id] ? '23px' : '3px',
                    transition: 'left 150ms ease', boxShadow: 'var(--shadow-sm)',
                  }} />
                </button>
                <span style={{
                  fontSize: '0.625rem', fontWeight: 700, width: '28px', textAlign: 'center',
                  color: autopayState[card.id] ? 'var(--color-success-text)' : 'var(--color-text-tertiary)',
                }}>
                  {autopayState[card.id] ? 'ON' : 'OFF'}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Payment History */}
      {/* ----------------------------------------------------------------- */}
      {sectionHeader('Payment History', 'history')}
      {expandedSections.has('history') && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 2fr 1fr 90px 120px',
            gap: '0.75rem', padding: '0.5rem 0.75rem',
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Date</span>
            <span>Card</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'right' }}>Confirmation</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {paymentHistory.map(record => {
              const card = demoCards.find(c => c.id === record.cardId)!;
              const statusStyles = {
                confirmed: { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)', label: 'Confirmed' },
                pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', label: 'Pending' },
                failed: { bg: 'var(--color-error-bg)', color: 'var(--color-error-text)', label: 'Failed' },
              }[record.status];

              return (
                <div
                  key={record.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 2fr 1fr 90px 120px',
                    gap: '0.75rem', padding: '0.625rem 0.75rem', alignItems: 'center',
                    borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)', fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)' }}>{record.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: card.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{card.partner}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>****{card.lastFour}</span>
                  </div>
                  <span style={{ textAlign: 'right', fontWeight: 700 }}>${record.amount.toLocaleString()}</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px',
                      fontSize: '0.625rem', fontWeight: 700,
                      backgroundColor: statusStyles.bg, color: statusStyles.color,
                    }}>
                      {statusStyles.label}
                    </span>
                  </div>
                  <span style={{ textAlign: 'right', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                    {record.confirmation}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
