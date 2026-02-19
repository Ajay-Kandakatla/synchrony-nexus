import { type ReactNode, useEffect, useState } from 'react';
import type { BehavioralNudge } from '../../../core/types/ai';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';

/**
 * NudgeOverlay — renders behavioral nudges as non-blocking banners.
 *
 * Nudges are timed, context-aware interventions:
 * - Payment reminders with loss-aversion framing
 * - Savings milestones with celebration
 * - Promotional expiry countdowns
 * - Credit tips timed to decision moments
 *
 * Display rules:
 * - Max 1 nudge visible at a time
 * - Respects cooldown periods
 * - Respects max impressions
 * - Respects user dismissals
 */

interface NudgeOverlayProps {
  nudges: readonly BehavioralNudge[];
  onInteract: (nudgeId: string, action: string) => void;
  onDismiss: (nudgeId: string) => void;
}

export function NudgeOverlay({ nudges, onInteract, onDismiss }: NudgeOverlayProps): ReactNode {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentNudge = nudges[currentIndex];
  if (!currentNudge || !visible) return null;

  const nudgeTypeStyles: Record<string, { icon: string; accentColor: string }> = {
    payment_reminder: { icon: '💳', accentColor: 'var(--color-warning-text)' },
    savings_prompt: { icon: '🎯', accentColor: '#16a34a' },
    credit_tip: { icon: '💡', accentColor: 'var(--color-primary)' },
    promotional_alert: { icon: '⏰', accentColor: '#ea580c' },
    milestone_celebration: { icon: '🎉', accentColor: '#8b5cf6' },
    risk_warning: { icon: '⚠️', accentColor: '#dc2626' },
  };

  const typeStyle = nudgeTypeStyles[currentNudge.type] ?? { icon: '💡', accentColor: 'var(--color-primary)' };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: '380px',
        maxWidth: 'calc(100vw - 2rem)',
        zIndex: 400,
        animation: 'slideUp 300ms ease-out',
      }}
    >
      <Card variant="elevated" padding="none">
        <div style={{ padding: '1rem 1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{typeStyle.icon}</span>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {currentNudge.content.headline}
              </h4>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {currentNudge.content.body}
              </p>
            </div>
            <button
              onClick={() => {
                onDismiss(currentNudge.id);
                if (currentIndex < nudges.length - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  setVisible(false);
                }
              }}
              aria-label="Dismiss"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* CTA */}
          {currentNudge.content.cta && (
            <div style={{ marginTop: '0.75rem' }}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => onInteract(currentNudge.id, currentNudge.content.cta!.id)}
              >
                {currentNudge.content.cta.label}
              </Button>
            </div>
          )}

          {/* Nudge count indicator */}
          {nudges.length > 1 && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '0.25rem',
              }}
            >
              {nudges.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: i === currentIndex ? typeStyle.accentColor : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
