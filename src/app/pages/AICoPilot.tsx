import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightCard {
  id: string;
  priority: 'Critical' | 'High' | 'Medium';
  category: string;
  icon: string;
  title: string;
  subtitle: string;
  detail: string;
  dataPoints: string[];
  actions: { label: string; variant: 'primary' | 'secondary' | 'ghost' }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: { label: string; variant: 'primary' | 'secondary' }[];
}

interface Nudge {
  id: string;
  icon: string;
  message: string;
  action: string;
  category: 'payment' | 'account' | 'promo';
}

interface AlertConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  activeCount: number;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const insights: InsightCard[] = [
  {
    id: 'promo-expire',
    priority: 'Critical',
    category: 'Promo Expiration',
    icon: '\u23F0',
    title: 'Promo rate expiring in 14 days',
    subtitle: "Lowe's card (\u2022\u20224521) \u2014 $2,340 at 0% APR expires Mar 4",
    detail:
      'Your 0% promotional rate on the Lowe\'s Advantage card will expire on March 4. The remaining promotional balance of $2,340 will begin accruing interest at the standard 29.99% APR. At that rate, carrying the full balance would cost approximately $58.40 in interest during the first month alone.',
    dataPoints: [
      'Promo balance: $2,340 of original $5,000',
      'Days remaining: 14',
      'Post-promo APR: 29.99%',
      'Projected monthly interest: ~$58.40',
    ],
    actions: [
      { label: 'Pay $2,340 now', variant: 'primary' },
      { label: 'Set up payment plan', variant: 'secondary' },
    ],
  },
  {
    id: 'spending-anomaly',
    priority: 'High',
    category: 'Spending Alert',
    icon: '\uD83D\uDCC8',
    title: 'Unusual spending detected',
    subtitle: 'Guitar Center card (\u2022\u20229103) \u2014 3x normal monthly spend',
    detail:
      'Your Guitar Center card typically averages $180/month in charges. This month you have charged $612, which is 3.4x your average. While no fraudulent activity is suspected, this may impact your utilization ratio on this card (currently at 41%).',
    dataPoints: [
      'Average monthly spend: $180',
      'Current month spend: $612',
      'Variance: +340%',
      'Current utilization: 41% ($612 / $1,500 limit)',
    ],
    actions: [
      { label: 'Review transactions', variant: 'primary' },
      { label: 'This is expected', variant: 'ghost' },
    ],
  },
  {
    id: 'score-boost',
    priority: 'Medium',
    category: 'Score Opportunity',
    icon: '\uD83C\uDFAF',
    title: 'Credit score boost opportunity',
    subtitle: 'Pay $2,200 on Rooms To Go (\u2022\u20227788) to drop utilization to 29%',
    detail:
      'Your Rooms To Go card currently has 48% utilization ($3,600 / $7,500 limit). Paying $2,200 would bring it to 18.7%, moving your overall utilization below the 30% threshold that scoring models favor. Our model estimates a potential 15\u201325 point FICO improvement.',
    dataPoints: [
      'Current balance: $3,600 / $7,500 limit',
      'Current utilization: 48%',
      'After $2,200 payment: 18.7%',
      'Overall utilization impact: 34% \u2192 29%',
      'Estimated FICO improvement: +15\u201325 pts',
    ],
    actions: [
      { label: 'Apply this strategy', variant: 'primary' },
      { label: 'See detailed breakdown', variant: 'secondary' },
    ],
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Which of my 15 cards should I use for a $400 grocery run this weekend?',
    timestamp: '10:32 AM',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      'Great question! Looking at your 15 Synchrony cards, none of them are optimized for grocery rewards since they are partner retail cards. However, I can help you think strategically:\n\n' +
      '\u2022 Sam\'s Club Mastercard (\u2022\u20223847) \u2014 Best option. It earns rewards on Sam\'s Club purchases and has 62% available credit. If you shop at Sam\'s Club, this is ideal.\n\n' +
      '\u2022 Amazon Store Card (\u2022\u20226234) \u2014 If buying groceries through Amazon Fresh or Whole Foods, you\'d get 5% back with Prime.\n\n' +
      'For general grocery stores, I\'d recommend using a non-Synchrony card with grocery category bonuses if you have one.',
    timestamp: '10:32 AM',
    actions: [{ label: 'Compare all card rewards', variant: 'secondary' }],
  },
  {
    id: 'm3',
    role: 'user',
    content: 'How should I prioritize my payments this month? I have $3,000 to allocate.',
    timestamp: '10:34 AM',
  },
  {
    id: 'm4',
    role: 'assistant',
    content:
      'With $3,000 available, here is my recommended allocation based on your current balances, APRs, and promotional deadlines:\n\n' +
      '1. Lowe\'s (\u2022\u20224521): $2,340 \u2014 URGENT. Pay off the 0% promo balance before it expires Mar 4. This prevents $58/month in new interest charges.\n\n' +
      '2. Rooms To Go (\u2022\u20227788): $500 \u2014 This drops your utilization from 48% to 41%, helping your overall ratio dip below 30%.\n\n' +
      '3. Remaining $160: Apply to PayPal Credit (\u2022\u20225590) which has your highest non-promo APR at 31.99%.\n\n' +
      'This plan saves you an estimated $74/month in interest and could improve your score by 15\u201325 points.',
    timestamp: '10:34 AM',
    actions: [
      { label: 'Apply this strategy', variant: 'primary' },
      { label: 'Schedule payments', variant: 'secondary' },
    ],
  },
  {
    id: 'm5',
    role: 'user',
    content: 'What about my CareCredit balance? Is the promo still active?',
    timestamp: '10:36 AM',
  },
  {
    id: 'm6',
    role: 'assistant',
    content:
      'Your CareCredit card (\u2022\u20221456) has a $1,872 balance with a 0% promotional rate that runs through August 2025 \u2014 you still have about 6 months remaining.\n\n' +
      'Important: CareCredit uses deferred interest, not waived interest. If any balance remains when the promo ends, you will owe retroactive interest on the entire original amount at 29.99% APR.\n\n' +
      'To avoid this, I recommend setting up automatic payments of $312/month starting now. That will zero out the balance exactly by the August deadline.\n\n' +
      'Current monthly minimum is only $56, so you would need to increase your payment amount voluntarily.',
    timestamp: '10:36 AM',
    actions: [
      { label: 'Set up $312/mo autopay', variant: 'primary' },
      { label: 'Remind me in June', variant: 'secondary' },
    ],
  },
];

const nudges: Nudge[] = [
  {
    id: 'n1',
    icon: '\uD83D\uDCC5',
    message:
      'You usually pay Verizon on the 20th. Your Verizon Visa (\u2022\u20228901) payment of $142 is due Feb 25 \u2014 want to schedule it now?',
    action: 'Schedule payment',
    category: 'payment',
  },
  {
    id: 'n2',
    icon: '\uD83D\uDCB3',
    message:
      'Your Sam\'s Club Mastercard (\u2022\u20223847) has had a $0 balance for 4 months. A small recurring charge keeps the account active and helps your credit age.',
    action: 'Set up small charge',
    category: 'account',
  },
  {
    id: 'n3',
    icon: '\uD83C\uDFE5',
    message:
      'CareCredit promo: Your dentist Dr. Smith accepts CareCredit. You have $4,128 available credit. Upcoming cleanings could earn 0% financing for 6 months.',
    action: 'View CareCredit offers',
    category: 'promo',
  },
];

const initialAlerts: AlertConfig[] = [
  { id: 'a1', label: 'Payment reminders', description: 'Due dates and minimum payment alerts', icon: '\uD83D\uDD14', enabled: true, activeCount: 4 },
  { id: 'a2', label: 'Promo expirations', description: 'Upcoming promotional rate deadlines', icon: '\u23F3', enabled: true, activeCount: 2 },
  { id: 'a3', label: 'Spending anomalies', description: 'Unusual spending pattern detection', icon: '\u26A0\uFE0F', enabled: true, activeCount: 1 },
  { id: 'a4', label: 'Score changes', description: 'Credit score movement notifications', icon: '\uD83D\uDCCA', enabled: false, activeCount: 0 },
  { id: 'a5', label: 'Reward opportunities', description: 'Partner promotions and cashback offers', icon: '\uD83C\uDF81', enabled: true, activeCount: 3 },
];

// ---------------------------------------------------------------------------
// Forecast data
// ---------------------------------------------------------------------------

const forecastData = {
  currentTotal: 18_420,
  aiPlan: [
    { label: '3 mo', value: 14_200, pct: 77 },
    { label: '6 mo', value: 9_600, pct: 52 },
    { label: '12 mo', value: 2_100, pct: 11 },
  ],
  currentTrajectory: [
    { label: '3 mo', value: 16_800, pct: 91 },
    { label: '6 mo', value: 15_100, pct: 82 },
    { label: '12 mo', value: 12_400, pct: 67 },
  ],
};

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------

function PriorityBadge({ level }: { level: 'Critical' | 'High' | 'Medium' }): ReactNode {
  const colorMap = {
    Critical: { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)' },
    High: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
    Medium: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)' },
  };
  const c = colorMap[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.6875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0.2rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      {level}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }): ReactNode {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator(): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--color-text-inverse)' }}>AI</span>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '0.625rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-tertiary)',
              animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forecast bar
// ---------------------------------------------------------------------------

function ForecastBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }): ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{ width: '3rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 20, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: color,
            transition: 'width 0.8s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff' }}>
            ${value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AICoPilot(): ReactNode {
  // ---- Chat state ----
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ---- Insight expansion ----
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [showDataPoints, setShowDataPoints] = useState<string | null>(null);

  // ---- Nudge dismissals ----
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  // ---- Alerts ----
  const [alerts, setAlerts] = useState<AlertConfig[]>(initialAlerts);

  // ---- Auto-scroll ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ---- Simulated send ----
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content:
          'I\'ve analyzed your question across all 15 of your Synchrony accounts. Based on your current balances, payment history, and promotional rates, here is what I recommend:\n\n' +
          'Your total outstanding balance across all cards is $18,420. With your current payment trajectory, you could be debt-free in approximately 14 months by following the optimized plan I\'ve prepared. Would you like me to walk through the details?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: 'Show detailed plan', variant: 'primary' },
          { label: 'Adjust parameters', variant: 'secondary' },
        ],
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
    }, 2400);
  };

  // ---- Quick prompt ----
  const quickPrompts = [
    'Optimize my payments',
    'Which card for groceries?',
    'How to improve my score?',
    'Summarize my accounts',
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  // ---- Alert toggle ----
  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  // ---- Dismiss nudge ----
  const dismissNudge = (id: string) => {
    setDismissedNudges((prev) => new Set(prev).add(id));
  };

  const visibleNudges = nudges.filter((n) => !dismissedNudges.has(n.id));

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ---- Global keyframes (injected once) ---- */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'var(--color-text-inverse)',
                flexShrink: 0,
              }}
            >
              AI
            </span>
            Synchrony AI Co-Pilot
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Proactive insights and personalized guidance across all 15 of your accounts
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Live</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. PROACTIVE INSIGHTS                                              */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <SectionHeader
          icon={'\uD83E\uDDE0'}
          title="Proactive Insights"
          subtitle={`${insights.length} active insights discovered across your portfolio`}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {insights.map((ins) => {
            const isExpanded = expandedInsight === ins.id;
            const showDP = showDataPoints === ins.id;
            return (
              <Card key={ins.id} variant="elevated" padding="md">
                {/* Priority + category */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <PriorityBadge level={ins.priority} />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                    {ins.category}
                  </span>
                </div>

                {/* Icon + title */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{ins.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {ins.title}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {ins.subtitle}
                    </p>
                  </div>
                </div>

                {/* Expandable detail */}
                {isExpanded && (
                  <div
                    style={{
                      animation: 'fadeIn 0.25s ease',
                      margin: '0.75rem 0',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-bg)',
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {ins.detail}
                  </div>
                )}

                {/* Data points */}
                {showDP && (
                  <div
                    style={{
                      animation: 'fadeIn 0.25s ease',
                      margin: '0.5rem 0',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--color-border)',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.375rem' }}>
                      Why am I seeing this?
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {ins.dataPoints.map((dp, i) => (
                        <li key={i}>{dp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Toggle links */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => setExpandedInsight(isExpanded ? null : ins.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>
                  <button
                    onClick={() => setShowDataPoints(showDP ? null : ins.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {showDP ? 'Hide data' : 'Why am I seeing this?'}
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ins.actions.map((act, i) => (
                    <Button key={i} variant={act.variant} size="sm">
                      {act.label}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN GRID: Chat + Sidebar                                          */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* ---- 2. CONVERSATIONAL AI CHAT ---- */}
        <section>
          <SectionHeader
            icon={'\uD83D\uDCAC'}
            title="AI Financial Advisor"
            subtitle="Ask anything about your accounts, payments, or credit strategy"
          />
          <Card variant="default" padding="none" style={{ display: 'flex', flexDirection: 'column', height: 520, overflow: 'hidden' }}>
            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    {/* Avatar */}
                    {!isUser && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-text-inverse)',
                          flexShrink: 0,
                        }}
                      >
                        AI
                      </div>
                    )}
                    {isUser && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-text-inverse)',
                          flexShrink: 0,
                        }}
                      >
                        You
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isUser ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                        border: isUser ? 'none' : '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.content}
                      {msg.actions && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          {msg.actions.map((act, i) => (
                            <Button key={i} variant={act.variant} size="sm">
                              {act.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--color-text-tertiary)',
                          marginTop: '0.375rem',
                        }}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                overflowX: 'auto',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleQuickPrompt(p)}
                  style={{
                    flexShrink: 0,
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your accounts, payments, credit score..."
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
              <Button variant="primary" size="md" onClick={handleSend} disabled={!inputValue.trim()}>
                Send
              </Button>
            </div>
          </Card>
        </section>

        {/* ---- SIDEBAR ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ---- 3. BEHAVIORAL NUDGES ---- */}
          <section>
            <SectionHeader icon={'\uD83D\uDCA1'} title="Smart Nudges" subtitle={`${visibleNudges.length} actions recommended`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visibleNudges.map((nudge) => {
                const categoryColor = {
                  payment: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-text)' },
                  account: { bg: 'var(--color-info-bg)', border: 'var(--color-info-text)' },
                  promo: { bg: 'var(--color-success-bg)', border: 'var(--color-success-text)' },
                }[nudge.category];

                return (
                  <Card key={nudge.id} variant="outlined" padding="sm">
                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          fontSize: '1.25rem',
                          lineHeight: 1,
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: categoryColor.bg,
                          flexShrink: 0,
                        }}
                      >
                        {nudge.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                          {nudge.message}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <Button variant="primary" size="sm">
                            {nudge.action}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => dismissNudge(nudge.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {visibleNudges.length === 0 && (
                <Card variant="outlined" padding="md">
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                    All nudges dismissed. Check back tomorrow.
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* ---- 4. FINANCIAL FORECAST ---- */}
          <section>
            <SectionHeader icon={'\uD83D\uDCC9'} title="Balance Forecast" subtitle="Projected debt paydown over time" />
            <Card variant="elevated" padding="md">
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current total balance
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.125rem' }}>
                  ${forecastData.currentTotal.toLocaleString()}
                </div>
              </div>

              {/* AI plan */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    AI-optimized plan
                  </span>
                </div>
                {forecastData.aiPlan.map((d) => (
                  <ForecastBar key={d.label} label={d.label} value={d.value} pct={d.pct} color="#22c55e" />
                ))}
              </div>

              {/* Current trajectory */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Current trajectory
                  </span>
                </div>
                {forecastData.currentTrajectory.map((d) => (
                  <ForecastBar key={d.label} label={d.label} value={d.value} pct={d.pct} color="#ef4444" />
                ))}
              </div>

              {/* Savings callout */}
              <div
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{'\u2728'}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-success-text)' }}>
                  AI plan saves $10,300 and pays off 11 months sooner
                </span>
              </div>
            </Card>
          </section>

          {/* ---- 5. SMART ALERTS CONFIG ---- */}
          <section>
            <SectionHeader icon={'\u2699\uFE0F'} title="Smart Alerts" subtitle="Configure which AI alerts you receive" />
            <Card variant="default" padding="sm">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    <span style={{ fontSize: '1.125rem', width: 24, textAlign: 'center' }}>{alert.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {alert.label}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                        {alert.description}
                      </div>
                    </div>
                    {alert.enabled && alert.activeCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          backgroundColor: 'var(--color-info-bg)',
                          padding: '0.125rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {alert.activeCount}
                      </span>
                    )}
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      aria-label={`Toggle ${alert.label}`}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: alert.enabled ? 'var(--color-primary)' : 'var(--color-border)',
                        transition: 'background-color 200ms ease',
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: alert.enabled ? 20 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'left 200ms ease',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
