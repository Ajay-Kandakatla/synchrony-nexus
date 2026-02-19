import { type ReactNode, useState } from 'react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';

/**
 * Disputes — AI-powered dispute resolution center.
 *
 * Full lifecycle management: file new disputes with AI classification,
 * track active investigations, review resolved history, and understand
 * your rights under Regulation E / Z.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DisputeTimeline {
  date: string;
  title: string;
  detail: string;
}

interface ActiveDispute {
  id: string;
  caseNumber: string;
  cardPartner: string;
  cardColor: string;
  lastFour: string;
  amount: number;
  reason: string;
  dateFiled: string;
  status: 'needs_action' | 'investigating' | 'reviewing' | 'provisional_credit';
  statusLabel: string;
  estimatedResolution: string;
  provisionalCredit: boolean;
  currentStep: number; // 0-3: Filed, Reviewing, Investigating, Resolved
  timeline: DisputeTimeline[];
}

interface ResolvedDispute {
  id: string;
  cardPartner: string;
  cardColor: string;
  lastFour: string;
  amount: number;
  reason: string;
  dateFiled: string;
  dateResolved: string;
  outcome: 'in_your_favor' | 'denied' | 'partial';
  outcomeLabel: string;
  amountRecovered: number;
  detail: string;
}

interface WizardCard {
  id: string;
  partner: string;
  lastFour: string;
  color: string;
  category: string;
}

interface WizardTransaction {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  suspicious: boolean;
}

interface RecentTransaction {
  id: string;
  cardPartner: string;
  cardColor: string;
  lastFour: string;
  merchant: string;
  date: string;
  amount: number;
  suspicious: boolean;
  suspiciousReason?: string;
}

type DisputeCategory =
  | 'unauthorized'
  | 'duplicate'
  | 'wrong_amount'
  | 'not_received'
  | 'quality'
  | 'cancelled_sub'
  | 'fraud'
  | 'billing_error';

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const activeDisputes: ActiveDispute[] = [
  {
    id: 'd1',
    caseNumber: 'DSP-2026-00847',
    cardPartner: 'Amazon Store Card',
    cardColor: '#FF9900',
    lastFour: '9102',
    amount: 127.49,
    reason: 'Unauthorized charge — item never ordered',
    dateFiled: 'Feb 10, 2026',
    status: 'investigating',
    statusLabel: 'Under investigation',
    estimatedResolution: 'Mar 12, 2026',
    provisionalCredit: true,
    currentStep: 2,
    timeline: [
      { date: 'Feb 10', title: 'Dispute filed', detail: 'You reported an unauthorized charge of $127.49 from AMZN MKTP US*Z839F2.' },
      { date: 'Feb 11', title: 'Case assigned', detail: 'Case assigned to investigator. Reference: DSP-2026-00847.' },
      { date: 'Feb 12', title: 'Provisional credit issued', detail: '$127.49 credited to your account while investigation is in progress.' },
      { date: 'Feb 14', title: 'Merchant contacted', detail: 'We have contacted Amazon to verify the transaction details.' },
    ],
  },
  {
    id: 'd2',
    caseNumber: 'DSP-2026-00912',
    cardPartner: 'Verizon Visa',
    cardColor: '#CD040B',
    lastFour: '1190',
    amount: 89.99,
    reason: 'Duplicate charge for phone bill',
    dateFiled: 'Feb 15, 2026',
    status: 'needs_action',
    statusLabel: 'Documentation requested',
    estimatedResolution: 'Mar 20, 2026',
    provisionalCredit: false,
    currentStep: 1,
    timeline: [
      { date: 'Feb 15', title: 'Dispute filed', detail: 'You reported a duplicate charge of $89.99 from VZWRLSS*BILL PAY.' },
      { date: 'Feb 16', title: 'Documentation requested', detail: 'Please upload your Verizon billing statement showing the duplicate charge.' },
    ],
  },
];

const resolvedDisputes: ResolvedDispute[] = [
  {
    id: 'r1',
    cardPartner: "Lowe's Advantage",
    cardColor: '#004890',
    lastFour: '4521',
    amount: 349.00,
    reason: 'Merchandise not received — online order',
    dateFiled: 'Dec 18, 2025',
    dateResolved: 'Jan 22, 2026',
    outcome: 'in_your_favor',
    outcomeLabel: 'Resolved in your favor',
    amountRecovered: 349.00,
    detail: 'Merchant failed to provide delivery confirmation. Full refund issued.',
  },
  {
    id: 'r2',
    cardPartner: 'PayPal Credit',
    cardColor: '#003087',
    lastFour: '3341',
    amount: 215.50,
    reason: 'Wrong amount charged — overcharged by seller',
    dateFiled: 'Nov 5, 2025',
    dateResolved: 'Dec 10, 2025',
    outcome: 'partial',
    outcomeLabel: 'Partially resolved',
    amountRecovered: 165.50,
    detail: 'Merchant provided partial proof. $50 charge confirmed valid; $165.50 refunded.',
  },
  {
    id: 'r3',
    cardPartner: 'CareCredit',
    cardColor: '#00857C',
    lastFour: '7833',
    amount: 75.00,
    reason: 'Cancelled subscription still billing',
    dateFiled: 'Oct 12, 2025',
    dateResolved: 'Nov 8, 2025',
    outcome: 'in_your_favor',
    outcomeLabel: 'Resolved in your favor',
    amountRecovered: 75.00,
    detail: 'Subscription confirmed cancelled. Merchant agreed to full refund.',
  },
  {
    id: 'r4',
    cardPartner: 'TJX Rewards',
    cardColor: '#CC0000',
    lastFour: '5544',
    amount: 42.99,
    reason: 'Billing error — returned item not credited',
    dateFiled: 'Sep 20, 2025',
    dateResolved: 'Oct 15, 2025',
    outcome: 'denied',
    outcomeLabel: 'Denied',
    amountRecovered: 0,
    detail: 'Merchant provided signed receipt confirming the item was not returned to the store.',
  },
];

const wizardCards: WizardCard[] = [
  { id: 'w1', partner: "Lowe's Advantage", lastFour: '4521', color: '#004890', category: 'Home' },
  { id: 'w2', partner: 'Amazon Store Card', lastFour: '9102', color: '#FF9900', category: 'Retail' },
  { id: 'w3', partner: 'CareCredit', lastFour: '7833', color: '#00857C', category: 'Healthcare' },
  { id: 'w4', partner: 'PayPal Credit', lastFour: '3341', color: '#003087', category: 'Digital' },
  { id: 'w5', partner: 'Rooms To Go', lastFour: '5567', color: '#B8232F', category: 'Furniture' },
  { id: 'w6', partner: 'Mattress Firm', lastFour: '2298', color: '#1B365D', category: 'Furniture' },
  { id: 'w7', partner: "Sam's Club", lastFour: '8812', color: '#0060A9', category: 'Wholesale' },
  { id: 'w8', partner: 'Verizon Visa', lastFour: '1190', color: '#CD040B', category: 'Telecom' },
  { id: 'w9', partner: 'Guitar Center', lastFour: '6654', color: '#000000', category: 'Music' },
  { id: 'w10', partner: "Dick's Sporting Goods", lastFour: '4478', color: '#00583E', category: 'Sports' },
  { id: 'w11', partner: 'JCPenney', lastFour: '9933', color: '#B11116', category: 'Retail' },
  { id: 'w12', partner: 'Ashley Furniture', lastFour: '7710', color: '#7B2D26', category: 'Furniture' },
  { id: 'w13', partner: 'Discount Tire', lastFour: '3321', color: '#E31837', category: 'Auto' },
  { id: 'w14', partner: 'TJX Rewards', lastFour: '5544', color: '#CC0000', category: 'Retail' },
  { id: 'w15', partner: 'Nexus HOME', lastFour: '1287', color: '#1A1A2E', category: 'Home' },
];

const transactionsByCard: Record<string, WizardTransaction[]> = {
  w1: [
    { id: 't1', merchant: "Lowe's #2841 - Charlotte NC", date: 'Feb 17', amount: 234.87, suspicious: false },
    { id: 't2', merchant: "Lowe's Online - lowes.com", date: 'Feb 12', amount: 89.50, suspicious: false },
    { id: 't3', merchant: "Lowe's #1102 - Raleigh NC", date: 'Feb 5', amount: 412.33, suspicious: false },
    { id: 't4', merchant: "LOWES ONLINE*8832KJ", date: 'Jan 30', amount: 67.22, suspicious: true },
    { id: 't5', merchant: "Lowe's #2841 - Charlotte NC", date: 'Jan 25', amount: 155.00, suspicious: false },
  ],
  w2: [
    { id: 't6', merchant: 'AMZN MKTP US*2F8KJ1', date: 'Feb 16', amount: 45.99, suspicious: false },
    { id: 't7', merchant: 'AMZN MKTP US*Z839F2', date: 'Feb 10', amount: 127.49, suspicious: true },
    { id: 't8', merchant: 'WHOLE FOODS MKT #10234', date: 'Feb 8', amount: 67.32, suspicious: false },
    { id: 't9', merchant: 'AMZN DIGITAL*U92KL4', date: 'Feb 3', amount: 14.99, suspicious: false },
    { id: 't10', merchant: 'AMZN MKTP US*Y12HN8', date: 'Jan 28', amount: 89.00, suspicious: false },
  ],
  w8: [
    { id: 't11', merchant: 'VZWRLSS*BILL PAY', date: 'Feb 15', amount: 89.99, suspicious: true },
    { id: 't12', merchant: 'VZWRLSS*BILL PAY', date: 'Feb 15', amount: 89.99, suspicious: true },
    { id: 't13', merchant: 'VERIZON WIRELESS STORE', date: 'Feb 2', amount: 49.99, suspicious: false },
    { id: 't14', merchant: 'VZWRLSS*BILL PAY', date: 'Jan 15', amount: 89.99, suspicious: false },
    { id: 't15', merchant: 'VZWRLSS*ACCSRY', date: 'Jan 10', amount: 29.99, suspicious: false },
  ],
};

const recentTransactions: RecentTransaction[] = [
  { id: 'rt1', cardPartner: 'Amazon Store Card', cardColor: '#FF9900', lastFour: '9102', merchant: 'AMZN MKTP US*2F8KJ1', date: 'Feb 16', amount: 45.99, suspicious: false },
  { id: 'rt2', cardPartner: 'Verizon Visa', cardColor: '#CD040B', lastFour: '1190', merchant: 'VZWRLSS*BILL PAY', date: 'Feb 15', amount: 89.99, suspicious: true, suspiciousReason: 'Duplicate charge detected' },
  { id: 'rt3', cardPartner: "Lowe's Advantage", cardColor: '#004890', lastFour: '4521', merchant: "Lowe's #2841 - Charlotte NC", date: 'Feb 17', amount: 234.87, suspicious: false },
  { id: 'rt4', cardPartner: "Sam's Club", cardColor: '#0060A9', lastFour: '8812', merchant: "SAM'S CLUB #4921", date: 'Feb 14', amount: 187.42, suspicious: false },
  { id: 'rt5', cardPartner: 'CareCredit', cardColor: '#00857C', lastFour: '7833', merchant: 'DR. SMITH DENTAL OFFICE', date: 'Feb 13', amount: 450.00, suspicious: false },
  { id: 'rt6', cardPartner: 'PayPal Credit', cardColor: '#003087', lastFour: '3341', merchant: 'PAYPAL *EBAYSTORE', date: 'Feb 12', amount: 62.50, suspicious: false },
  { id: 'rt7', cardPartner: 'Guitar Center', cardColor: '#000000', lastFour: '6654', merchant: 'GUITAR CTR #329', date: 'Feb 11', amount: 299.99, suspicious: false },
  { id: 'rt8', cardPartner: 'Amazon Store Card', cardColor: '#FF9900', lastFour: '9102', merchant: 'AMZN MKTP US*Z839F2', date: 'Feb 10', amount: 127.49, suspicious: true, suspiciousReason: 'Flagged as potentially unauthorized' },
  { id: 'rt9', cardPartner: 'TJX Rewards', cardColor: '#CC0000', lastFour: '5544', merchant: 'TJ MAXX #1092', date: 'Feb 9', amount: 78.33, suspicious: false },
  { id: 'rt10', cardPartner: 'Discount Tire', cardColor: '#E31837', lastFour: '3321', merchant: 'DISCOUNT TIRE #482', date: 'Feb 7', amount: 189.00, suspicious: false },
];

const categoryLabels: Record<DisputeCategory, string> = {
  unauthorized: 'Unauthorized charge',
  duplicate: 'Duplicate charge',
  wrong_amount: 'Wrong amount charged',
  not_received: 'Merchandise not received',
  quality: 'Quality / defective product',
  cancelled_sub: 'Cancelled subscription still billing',
  fraud: 'Fraud / identity theft',
  billing_error: 'Billing error',
};

const faqItems = [
  {
    question: 'What counts as fraud vs. an unauthorized charge?',
    answer: 'Fraud involves someone stealing your card information or identity to make purchases. An unauthorized charge is any transaction you did not approve, including charges from a known merchant that were made without your consent. Both are covered under federal consumer protection laws.',
  },
  {
    question: 'How long do dispute investigations typically take?',
    answer: 'Most disputes are resolved within 30-45 days. Under Regulation E (debit) the investigation must be completed within 45 business days. Under Regulation Z (credit), the issuer must acknowledge within 30 days and resolve within 90 days of receipt. Provisional credits are typically issued within 10 business days.',
  },
  {
    question: 'Can I dispute a charge I authorized but am unhappy with?',
    answer: 'Yes, in many cases. If you received defective merchandise, were charged the wrong amount, did not receive goods or services paid for, or were charged for a subscription after cancellation, you have the right to dispute. You should first attempt to resolve the issue with the merchant directly.',
  },
  {
    question: 'What happens to my credit score during a dispute?',
    answer: 'Filing a dispute does not directly impact your credit score. If a provisional credit is issued, it reduces your balance and may actually help your utilization ratio. The disputed amount should not be reported as delinquent while under investigation.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stepLabels = ['Filed', 'Reviewing', 'Investigating', 'Resolved'];

function getStatusBadge(status: ActiveDispute['status']): { bg: string; color: string; label: string } {
  switch (status) {
    case 'needs_action':
      return { bg: 'var(--color-error-bg)', color: 'var(--color-error-text)', label: 'Needs your action' };
    case 'investigating':
      return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', label: 'Under investigation' };
    case 'reviewing':
      return { bg: 'var(--color-info-bg)', color: 'var(--color-info-text)', label: 'Under review' };
    case 'provisional_credit':
      return { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)', label: 'Provisional credit' };
  }
}

function getOutcomeBadge(outcome: ResolvedDispute['outcome']): { bg: string; color: string } {
  switch (outcome) {
    case 'in_your_favor':
      return { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
    case 'partial':
      return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' };
    case 'denied':
      return { bg: 'var(--color-error-bg)', color: 'var(--color-error-text)' };
  }
}

function generateCaseNumber(): string {
  return `DSP-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Disputes(): ReactNode {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<DisputeCategory>('unauthorized');
  const [aiConfidence, setAiConfidence] = useState(92);
  const [submittedCaseNumber, setSubmittedCaseNumber] = useState('');
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [expandedResolved, setExpandedResolved] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Wizard helpers
  const selectedCard = wizardCards.find((c) => c.id === selectedCardId);
  const cardTransactions = selectedCardId ? (transactionsByCard[selectedCardId] ?? []) : [];
  const selectedTransaction = cardTransactions.find((t) => t.id === selectedTransactionId);

  function handleSelectCard(cardId: string) {
    setSelectedCardId(cardId);
    setSelectedTransactionId('');
    setWizardStep(1);
  }

  function handleSelectTransaction(txId: string) {
    setSelectedTransactionId(txId);
    // Simulate AI classification
    const tx = cardTransactions.find((t) => t.id === txId);
    if (tx) {
      if (tx.suspicious) {
        setDetectedCategory('unauthorized');
        setAiConfidence(92);
      } else if (tx.amount > 200) {
        setDetectedCategory('not_received');
        setAiConfidence(74);
      } else {
        setDetectedCategory('billing_error');
        setAiConfidence(81);
      }
    }
    setWizardStep(2);
  }

  function handleSubmitDispute() {
    const caseNum = generateCaseNumber();
    setSubmittedCaseNumber(caseNum);
    setWizardStep(4);
  }

  function handleCloseWizard() {
    setShowWizard(false);
    setWizardStep(0);
    setSelectedCardId('');
    setSelectedTransactionId('');
    setSubmittedCaseNumber('');
  }

  function handleQuickDispute(tx: RecentTransaction) {
    const matchingCard = wizardCards.find(
      (c) => c.lastFour === tx.lastFour && c.partner === tx.cardPartner,
    );
    if (matchingCard) {
      setSelectedCardId(matchingCard.id);
      const matchingTx = (transactionsByCard[matchingCard.id] ?? []).find(
        (t) => t.merchant === tx.merchant && t.amount === tx.amount,
      );
      if (matchingTx) {
        handleSelectTransaction(matchingTx.id);
      } else {
        setWizardStep(1);
      }
    } else {
      setWizardStep(0);
    }
    setShowWizard(true);
  }

  // Aggregates
  const totalRecovered = resolvedDisputes.reduce((s, d) => s + d.amountRecovered, 0);
  const resolvedThisMonth = resolvedDisputes.filter((d) => d.dateResolved.includes('Jan 2026') || d.dateResolved.includes('Feb 2026')).length;

  // AI classification details
  const classificationDetails: Record<DisputeCategory, { time: string; likelihood: string; docs: string[] }> = {
    unauthorized: { time: '10-15 business days', likelihood: '87%', docs: ['Photo ID (front & back)', 'Police report (if applicable)'] },
    duplicate: { time: '7-10 business days', likelihood: '94%', docs: ['Billing statement showing both charges'] },
    wrong_amount: { time: '10-14 business days', likelihood: '82%', docs: ['Receipt or order confirmation with correct amount'] },
    not_received: { time: '14-21 business days', likelihood: '79%', docs: ['Order confirmation', 'Tracking information', 'Communication with merchant'] },
    quality: { time: '21-30 business days', likelihood: '65%', docs: ['Photos of defective item', 'Communication with merchant', 'Return tracking (if applicable)'] },
    cancelled_sub: { time: '7-14 business days', likelihood: '91%', docs: ['Cancellation confirmation email', 'Screenshot of cancellation page'] },
    fraud: { time: '10-15 business days', likelihood: '89%', docs: ['Police report', 'FTC identity theft report', 'Photo ID'] },
    billing_error: { time: '10-14 business days', likelihood: '85%', docs: ['Original receipt or invoice', 'Contract or agreement (if applicable)'] },
  };

  return (
    <div>
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Dispute Center
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {activeDisputes.length} active dispute{activeDisputes.length !== 1 ? 's' : ''}, {resolvedThisMonth} resolved this month, ${totalRecovered.toLocaleString()} recovered
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setShowWizard(true); setWizardStep(0); }}>
          + File new dispute
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Dispute Wizard Overlay */}
      {/* ----------------------------------------------------------------- */}
      {showWizard && (
        <Card variant="elevated" padding="none" style={{ marginBottom: '1.5rem', overflow: 'hidden', border: '2px solid var(--color-primary)' }}>
          {/* Wizard header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                File a New Dispute
              </h2>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                AI-assisted dispute filing
              </p>
            </div>
            <button
              onClick={handleCloseWizard}
              style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: '0.25rem' }}
            >
              x
            </button>
          </div>

          {/* Step indicator */}
          <div style={{ padding: '1rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0' }}>
            {['Select card', 'Transaction', 'AI analysis', 'Review', 'Confirmed'].map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '64px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                    backgroundColor: i <= wizardStep ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: i <= wizardStep ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
                    border: i <= wizardStep ? 'none' : '2px solid var(--color-border)',
                    transition: 'all 200ms ease',
                  }}>
                    {i < wizardStep ? '\u2713' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 600, color: i <= wizardStep ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', textAlign: 'center' }}>
                    {label}
                  </span>
                </div>
                {i < 4 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 0.25rem',
                    backgroundColor: i < wizardStep ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'background-color 200ms ease',
                    marginBottom: '1.25rem',
                  }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '1.25rem' }}>
            {/* Step 0: Select card */}
            {wizardStep === 0 && (
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Which card was the charge on?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                  {wizardCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                        border: selectedCardId === card.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)',
                        cursor: 'pointer', textAlign: 'left', transition: 'border-color 150ms ease',
                      }}
                    >
                      <div style={{ width: '36px', height: '24px', borderRadius: '4px', backgroundColor: card.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{card.partner}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>****{card.lastFour} · {card.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Select transaction */}
            {wizardStep === 1 && selectedCard && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '24px', borderRadius: '4px', backgroundColor: selectedCard.color }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{selectedCard.partner} ****{selectedCard.lastFour}</h3>
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Select the transaction you want to dispute</p>
                  </div>
                </div>

                {cardTransactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {cardTransactions.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => handleSelectTransaction(tx.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem',
                          border: selectedTransactionId === tx.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)', backgroundColor: tx.suspicious ? 'var(--color-warning-bg)' : 'var(--color-surface)',
                          cursor: 'pointer', textAlign: 'left', transition: 'border-color 150ms ease', width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {tx.suspicious && (
                            <span style={{
                              fontSize: '0.5625rem', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '9999px',
                              backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', border: '1px solid var(--color-warning-text)',
                            }}>
                              AI FLAGGED
                            </span>
                          )}
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{tx.merchant}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{tx.date}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>${tx.amount.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Card variant="outlined" padding="md">
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      No recent transactions found for this card. Transactions may take 1-2 business days to appear.
                    </p>
                  </Card>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => setWizardStep(0)}>Back</Button>
                </div>
              </div>
            )}

            {/* Step 2: AI classification */}
            {wizardStep === 2 && selectedTransaction && selectedCard && (
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>AI Dispute Analysis</h3>

                {/* Transaction summary */}
                <Card variant="outlined" padding="md" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{selectedTransaction.merchant}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{selectedCard.partner} ****{selectedCard.lastFour} · {selectedTransaction.date}</div>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${selectedTransaction.amount.toFixed(2)}</span>
                  </div>
                </Card>

                {/* AI detected category */}
                <Card variant="default" padding="md" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.5625rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                      backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      AI Detected
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {categoryLabels[detectedCategory]}
                  </h4>

                  {/* Confidence bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${aiConfidence}%`, height: '100%', borderRadius: '3px', transition: 'width 300ms ease',
                        backgroundColor: aiConfidence >= 85 ? 'var(--color-success-text)' : aiConfidence >= 70 ? 'var(--color-warning-text)' : 'var(--color-error-text)',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{aiConfidence}%</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {aiConfidence}% confident this is {categoryLabels[detectedCategory].toLowerCase()}
                  </p>
                </Card>

                {/* Estimated resolution and docs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Card variant="outlined" padding="md">
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Estimated resolution
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-text-primary)' }}>
                      {classificationDetails[detectedCategory].time}
                    </div>
                  </Card>
                  <Card variant="outlined" padding="md">
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Success likelihood
                    </div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem',
                      color: Number(classificationDetails[detectedCategory].likelihood.replace('%', '')) >= 80 ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                    }}>
                      {classificationDetails[detectedCategory].likelihood}
                    </div>
                  </Card>
                </div>

                {/* Suggested documents */}
                <Card variant="outlined" padding="md" style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Suggested documents to strengthen your case:
                  </div>
                  {classificationDetails[detectedCategory].docs.map((doc) => (
                    <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>\u2022</span>
                      {doc}
                    </div>
                  ))}
                </Card>

                {/* Override category */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                    Not quite right? Select the correct category:
                  </label>
                  <select
                    value={detectedCategory}
                    onChange={(e) => setDetectedCategory(e.target.value as DisputeCategory)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      fontSize: '0.8125rem', color: 'var(--color-text-primary)', cursor: 'pointer',
                    }}
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => setWizardStep(1)}>Back</Button>
                  <Button variant="primary" size="sm" onClick={() => setWizardStep(3)}>Continue to review</Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & submit */}
            {wizardStep === 3 && selectedTransaction && selectedCard && (
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>Review your dispute</h3>

                <Card variant="outlined" padding="md" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Card', value: `${selectedCard.partner} ****${selectedCard.lastFour}` },
                      { label: 'Transaction', value: selectedTransaction.merchant },
                      { label: 'Amount', value: `$${selectedTransaction.amount.toFixed(2)}` },
                      { label: 'Transaction date', value: selectedTransaction.date },
                      { label: 'Dispute category', value: categoryLabels[detectedCategory] },
                      { label: 'Est. resolution', value: classificationDetails[detectedCategory].time },
                      { label: 'Success likelihood', value: classificationDetails[detectedCategory].likelihood },
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{row.label}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="default" padding="md" style={{ marginBottom: '1rem', backgroundColor: 'var(--color-info-bg)' }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-info-text)' }}>
                    By submitting this dispute, you confirm that the information provided is accurate. A provisional credit may be issued within 10 business days while the investigation is in progress.
                  </p>
                </Card>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => setWizardStep(2)}>Back</Button>
                  <Button variant="primary" size="md" onClick={handleSubmitDispute}>Submit dispute</Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {wizardStep === 4 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                  fontSize: '1.5rem', color: 'var(--color-success-text)',
                }}>
                  {'\u2713'}
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Dispute submitted successfully
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Your case number is <strong style={{ color: 'var(--color-primary)' }}>{submittedCaseNumber}</strong>
                </p>

                <Card variant="outlined" padding="md" style={{ textAlign: 'left', marginBottom: '1rem', maxWidth: '480px', margin: '0 auto 1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>What happens next:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      'We will review your dispute within 2 business days.',
                      'A provisional credit may be issued within 10 business days.',
                      'You may be contacted for additional documentation.',
                      'Most investigations are completed within 30-45 days.',
                      'You will be notified of the outcome via email and in-app.',
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '18px' }}>{i + 1}.</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </Card>

                <Button variant="primary" size="md" onClick={handleCloseWizard}>Done</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Active Disputes */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Active disputes
          <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
            ({activeDisputes.length})
          </span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeDisputes.map((dispute) => {
            const badge = getStatusBadge(dispute.status);
            const isExpanded = expandedDispute === dispute.id;

            return (
              <Card key={dispute.id} variant="default" padding="none" style={{ overflow: 'hidden' }}>
                {/* Color accent */}
                <div style={{ height: '3px', backgroundColor: dispute.cardColor }} />
                <div style={{ padding: '1rem 1.25rem' }}>
                  {/* Top row: card info + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '28px', borderRadius: '4px', backgroundColor: dispute.cardColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                          {dispute.cardPartner.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{dispute.cardPartner} ****{dispute.lastFour}</h3>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Case {dispute.caseNumber} · Filed {dispute.dateFiled}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {dispute.provisionalCredit && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                          backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)',
                        }}>
                          Provisional credit issued
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '9999px',
                        backgroundColor: badge.bg, color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Amount + reason */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>${dispute.amount.toFixed(2)}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>{dispute.reason}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Est. resolution</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{dispute.estimatedResolution}</div>
                    </div>
                  </div>

                  {/* Progress tracker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '0.75rem' }}>
                    {stepLabels.map((label, i) => (
                      <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.625rem', fontWeight: 700,
                            backgroundColor: i <= dispute.currentStep ? 'var(--color-primary)' : 'var(--color-bg)',
                            color: i <= dispute.currentStep ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
                            border: i <= dispute.currentStep ? 'none' : '2px solid var(--color-border)',
                          }}>
                            {i < dispute.currentStep ? '\u2713' : i + 1}
                          </div>
                          <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: i <= dispute.currentStep ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                            {label}
                          </span>
                        </div>
                        {i < 3 && (
                          <div style={{
                            flex: 1, height: '2px', margin: '0 0.25rem',
                            backgroundColor: i < dispute.currentStep ? 'var(--color-primary)' : 'var(--color-border)',
                            marginBottom: '1rem',
                          }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions row */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {dispute.status === 'needs_action' && (
                      <Button variant="primary" size="sm">Upload documents</Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedDispute(isExpanded ? null : dispute.id)}
                      style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      {isExpanded ? 'Hide timeline' : 'View timeline'}
                    </Button>
                  </div>

                  {/* Expandable timeline */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {dispute.timeline.map((entry, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                            {/* Timeline line */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '20px' }}>
                              <div style={{
                                width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                                backgroundColor: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                                border: '2px solid var(--color-surface)',
                              }} />
                              {i < dispute.timeline.length - 1 && (
                                <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--color-border)' }} />
                              )}
                            </div>
                            <div style={{ paddingBottom: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{entry.title}</span>
                                <span style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>{entry.date}</span>
                              </div>
                              <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                {entry.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Resolved Disputes */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Resolved disputes
          <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
            ({resolvedDisputes.length})
          </span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {resolvedDisputes.map((dispute) => {
            const outcomeBadge = getOutcomeBadge(dispute.outcome);
            const isExpanded = expandedResolved === dispute.id;

            return (
              <Card key={dispute.id} variant="default" padding="none" style={{ overflow: 'hidden' }}>
                <div style={{ height: '2px', backgroundColor: dispute.cardColor }} />
                <div style={{ padding: '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dispute.cardColor, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {dispute.cardPartner} ****{dispute.lastFour}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                          {dispute.reason} · Filed {dispute.dateFiled}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>${dispute.amount.toFixed(2)}</div>
                        {dispute.amountRecovered > 0 && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-success-text)', fontWeight: 600 }}>
                            ${dispute.amountRecovered.toFixed(2)} recovered
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '9999px',
                        backgroundColor: outcomeBadge.bg, color: outcomeBadge.color, whiteSpace: 'nowrap',
                      }}>
                        {dispute.outcomeLabel}
                      </span>
                      <button
                        onClick={() => setExpandedResolved(isExpanded ? null : dispute.id)}
                        style={{
                          border: 'none', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-primary)',
                          fontWeight: 600, padding: '0.25rem',
                        }}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Date resolved</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{dispute.dateResolved}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Amount disputed</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>${dispute.amount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Amount recovered</span>
                          <span style={{ fontWeight: 600, color: dispute.amountRecovered > 0 ? 'var(--color-success-text)' : 'var(--color-error-text)' }}>
                            ${dispute.amountRecovered.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.375rem', marginTop: '0.25rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Resolution detail: </span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{dispute.detail}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Know Your Rights */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Know your rights
        </h2>

        <Card variant="default" padding="md" style={{ marginBottom: '0.75rem', borderLeft: '4px solid var(--color-primary)' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Federal consumer protections
          </h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Under Regulation E (electronic fund transfers) and Regulation Z (credit card protections), you have the right to dispute unauthorized, incorrect, or fraudulent charges on your accounts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { stat: '60 days', label: 'Time limit to report unauthorized charges from the date of the statement' },
              { stat: '10 days', label: 'Maximum time for issuer to provide provisional credit after a dispute is filed' },
              { stat: '45 days', label: 'Standard investigation period for most dispute categories' },
            ].map((item) => (
              <Card key={item.stat} variant="outlined" padding="md">
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{item.stat}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{item.label}</div>
              </Card>
            ))}
          </div>
        </Card>

        {/* FAQ Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {faqItems.map((faq) => {
            const isOpen = expandedFaq === faq.question;
            return (
              <Card key={faq.question} variant="outlined" padding="none">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : faq.question)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', border: 'none', backgroundColor: 'transparent',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {faq.question}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', color: 'var(--color-text-tertiary)', transition: 'transform 150ms ease',
                    transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0, marginLeft: '0.75rem',
                  }}>
                    {'\u25BE'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 1rem 0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Recent Transactions for Quick Dispute */}
      {/* ----------------------------------------------------------------- */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Recent transactions
          </h2>
          <span style={{
            fontSize: '0.5625rem', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '9999px',
            backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Quick dispute
          </span>
        </div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          See something wrong? Dispute any transaction directly.
        </p>

        <Card variant="default" padding="none">
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 120px',
            gap: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.6875rem', fontWeight: 600,
            color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span>Card / Merchant</span>
            <span>Date</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {recentTransactions.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 120px',
                gap: '0.75rem', padding: '0.625rem 1rem', alignItems: 'center',
                borderBottom: i < recentTransactions.length - 1 ? '1px solid var(--color-border)' : 'none',
                backgroundColor: tx.suspicious ? 'var(--color-warning-bg)' : 'transparent',
                transition: 'background-color 150ms ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tx.cardColor, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{tx.merchant}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>{tx.cardPartner} ****{tx.lastFour}</div>
                  </div>
                </div>
                {tx.suspicious && tx.suspiciousReason && (
                  <span style={{
                    display: 'inline-block', marginTop: '0.25rem', marginLeft: '1rem',
                    fontSize: '0.5625rem', fontWeight: 700, padding: '0.0625rem 0.375rem', borderRadius: '9999px',
                    backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', border: '1px solid var(--color-warning-text)',
                  }}>
                    {tx.suspiciousReason}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{tx.date}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right' }}>
                ${tx.amount.toFixed(2)}
              </span>
              <div style={{ textAlign: 'right' }}>
                <Button
                  variant={tx.suspicious ? 'danger' : 'ghost'}
                  size="sm"
                  onClick={() => handleQuickDispute(tx)}
                  style={{ fontSize: '0.6875rem' }}
                >
                  {tx.suspicious ? 'Dispute this' : 'Dispute'}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
