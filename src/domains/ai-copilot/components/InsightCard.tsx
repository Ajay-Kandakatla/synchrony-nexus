import { type ReactNode, useState } from 'react';
import type { Insight, SuggestedAction } from '../../../core/types/ai';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';

/**
 * InsightCard — renders an AI-generated insight with actionable CTAs.
 *
 * UX principles:
 * - Priority-based visual weight (critical gets red accent, low gets subtle)
 * - Expandable explanation ("Why am I seeing this?")
 * - Impact projections shown inline with actions
 * - Always dismissible with optional feedback
 */

interface InsightCardProps {
  insight: Insight;
  onAction: (action: SuggestedAction) => void;
  onDismiss: (reason?: string) => void;
  onMarkSeen: () => void;
}

const priorityConfig: Record<string, { accentColor: string; bgColor: string; label: string }> = {
  critical: { accentColor: '#dc2626', bgColor: 'var(--color-error-bg)', label: 'Urgent' },
  high: { accentColor: '#ea580c', bgColor: 'var(--color-warning-bg)', label: 'Important' },
  medium: { accentColor: 'var(--color-primary)', bgColor: 'var(--color-info-bg)', label: '' },
  low: { accentColor: 'var(--color-text-tertiary)', bgColor: 'var(--color-surface)', label: '' },
};

const categoryIcons: Record<string, string> = {
  payment_optimization: '💰',
  credit_improvement: '📈',
  savings_opportunity: '🏦',
  risk_alert: '⚠️',
  promotional_expiry: '⏰',
  spending_pattern: '📊',
  debt_reduction: '📉',
  product_recommendation: '✨',
};

export function InsightCard({ insight, onAction, onDismiss, onMarkSeen }: InsightCardProps): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const config = priorityConfig[insight.priority] ?? priorityConfig['medium']!;

  return (
    <Card
      variant="default"
      padding="none"
      style={{
        borderLeft: `3px solid ${config.accentColor}`,
        overflow: 'hidden',
      }}
      role="article"
      aria-label={`Insight: ${insight.title}`}
    >
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
            {categoryIcons[insight.category] ?? '💡'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {insight.title}
              </h4>
              {config.label && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: config.accentColor,
                    backgroundColor: config.bgColor,
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px',
                  }}
                >
                  {config.label}
                </span>
              )}
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {insight.summary}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss()}
            aria-label="Dismiss insight"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Suggested actions */}
        {insight.suggestedActions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {insight.suggestedActions.map((action, idx) => (
              <Button
                key={action.id}
                variant={idx === 0 ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onAction(action)}
              >
                {action.label}
                {action.estimatedImpact && (
                  <span style={{ opacity: 0.8, fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                    ({action.estimatedImpact.projectedValue})
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Expandable explanation */}
        <button
          onClick={() => {
            setExpanded((e) => !e);
            if (!expanded) onMarkSeen();
          }}
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 150ms ease',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          Why am I seeing this?
        </button>

        {expanded && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p style={{ margin: '0 0 0.5rem' }}>{insight.explanation.reasoning}</p>

            {insight.explanation.dataPoints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {insight.explanation.dataPoints.map((dp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{dp.label}</span>
                    <span style={{ fontWeight: 500 }}>{dp.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.6875rem',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Confidence: {Math.round(insight.explanation.confidence * 100)}%
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
