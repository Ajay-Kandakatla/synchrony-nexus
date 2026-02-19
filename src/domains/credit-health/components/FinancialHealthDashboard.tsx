import { type ReactNode, useMemo } from 'react';
import type { FinancialHealthScore, FinancialHealthDimensions } from '../../../core/types/user';
import type { CreditProduct } from '../../../core/types/product';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';

/**
 * FinancialHealthDashboard — gamified health visualization.
 *
 * Shows the user's overall financial health score and dimensional
 * breakdown. Uses color coding, trend indicators, and actionable
 * optimization paths.
 *
 * Design inspired by credit score dashboards but goes further
 * by showing controllable dimensions and specific next-best-actions.
 */

interface FinancialHealthDashboardProps {
  score: FinancialHealthScore;
  creditProducts: readonly CreditProduct[];
  onOptimize: (dimension: keyof FinancialHealthDimensions) => void;
}

const dimensionConfig: Record<
  keyof FinancialHealthDimensions,
  { label: string; icon: string; description: string }
> = {
  utilization: {
    label: 'Credit utilization',
    icon: '📊',
    description: 'How much of your available credit you use',
  },
  paymentHistory: {
    label: 'Payment history',
    icon: '✅',
    description: 'Your track record of on-time payments',
  },
  accountAge: {
    label: 'Account age',
    icon: '📅',
    description: 'Average age of your credit accounts',
  },
  productMix: {
    label: 'Product mix',
    icon: '🔀',
    description: 'Diversity of your credit product types',
  },
  savingsRate: {
    label: 'Savings rate',
    icon: '🏦',
    description: 'How consistently you save',
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs attention';
}

const trendIcons: Record<string, string> = {
  improving: '↗',
  stable: '→',
  declining: '↘',
};

export function FinancialHealthDashboard({
  score,
  creditProducts,
  onOptimize,
}: FinancialHealthDashboardProps): ReactNode {
  const scoreColor = getScoreColor(score.overall);

  // Calculate total utilization across products
  const totalUtilization = useMemo(() => {
    const totalBalance = creditProducts.reduce((sum, p) => sum + p.currentBalance, 0);
    const totalLimit = creditProducts.reduce((sum, p) => sum + p.creditLimit, 0);
    if (totalLimit === 0) return 0;
    return Math.round((totalBalance / totalLimit) * 100);
  }, [creditProducts]);

  const dimensions = Object.entries(dimensionConfig) as [
    keyof FinancialHealthDimensions,
    (typeof dimensionConfig)[keyof FinancialHealthDimensions],
  ][];

  return (
    <div>
      {/* Overall score */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)' }}>
          Financial Health Score
        </div>

        {/* Circular score visualization */}
        <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 1rem' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            {/* Score arc */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score.overall / 100) * 440} 440`}
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dasharray 500ms ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {score.overall}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
              of 100
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: scoreColor }}>
            {getScoreLabel(score.overall)}
          </span>
          <span style={{ fontSize: '1rem' }}>{trendIcons[score.trend]}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            {score.trend}
          </span>
        </div>
      </Card>

      {/* Utilization overview */}
      <Card variant="default" padding="md" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Credit Utilization</h3>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: getScoreColor(100 - totalUtilization),
            }}
          >
            {totalUtilization}%
          </span>
        </div>

        {/* Per-product utilization bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {creditProducts.map((product) => {
            const util = product.creditLimit > 0
              ? Math.round((product.currentBalance / product.creditLimit) * 100)
              : 0;
            return (
              <div key={product.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {product.displayName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    ${product.currentBalance.toLocaleString()} / ${product.creditLimit.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(util, 100)}%`,
                      height: '100%',
                      borderRadius: '3px',
                      backgroundColor: getScoreColor(100 - util),
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {totalUtilization > 30 && (
          <div style={{ marginTop: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={() => onOptimize('utilization')}>
              See how to reduce utilization
            </Button>
          </div>
        )}
      </Card>

      {/* Dimensional breakdown */}
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>
        Score breakdown
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {dimensions.map(([key, config]) => {
          const value = score.dimensions[key];
          return (
            <Card key={key} variant="interactive" padding="md">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{config.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{config.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: getScoreColor(value) }}>
                      {value}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--color-border)',
                      marginTop: '0.375rem',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${value}%`,
                        height: '100%',
                        borderRadius: '2px',
                        backgroundColor: getScoreColor(value),
                        transition: 'width 300ms ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                    {config.description}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
