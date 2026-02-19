import { type ReactNode, useState, useCallback } from 'react';
import type { Transaction, DisputeCategory, AIDisputeClassification, DisputeCreateRequest } from '../types/dispute';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';

/**
 * DisputeWizard — AI-assisted dispute creation.
 *
 * Flow:
 * 1. User selects a transaction to dispute
 * 2. AI auto-classifies the dispute type and pre-fills details
 * 3. User reviews/adjusts the classification
 * 4. Submit with estimated timeline
 *
 * The AI classification reduces dispute-to-resolution time by
 * routing correctly on first submission.
 */

interface DisputeWizardProps {
  transaction: Transaction;
  aiClassification: AIDisputeClassification | null;
  isClassifying: boolean;
  onSubmit: (request: DisputeCreateRequest) => Promise<void>;
  onCancel: () => void;
}

const categoryLabels: Record<DisputeCategory, string> = {
  unauthorized_transaction: 'Unauthorized transaction',
  duplicate_charge: 'Duplicate charge',
  incorrect_amount: 'Incorrect amount',
  merchandise_not_received: 'Merchandise not received',
  merchandise_defective: 'Defective merchandise',
  subscription_cancelled: 'Cancelled subscription still charged',
  billing_error: 'Billing error',
  other: 'Other',
};

export function DisputeWizard({
  transaction,
  aiClassification,
  isClassifying,
  onSubmit,
  onCancel,
}: DisputeWizardProps): ReactNode {
  const [step, setStep] = useState<'classify' | 'details' | 'review'>('classify');
  const [category, setCategory] = useState<DisputeCategory | null>(
    aiClassification?.suggestedCategory ?? null,
  );
  const [description, setDescription] = useState(
    aiClassification?.suggestedDescription ?? '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!category) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        productId: transaction.productId,
        transactionId: transaction.id,
        category,
        description,
        amount: transaction.amount,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [category, description, transaction, onSubmit]);

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Transaction summary */}
      <Card variant="outlined" padding="md" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{transaction.merchantName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              {transaction.date.toLocaleDateString()} &middot; {transaction.description}
            </div>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-error-text)' }}>
            ${transaction.amount.toFixed(2)}
          </div>
        </div>
      </Card>

      {/* Step 1: AI Classification */}
      {step === 'classify' && (
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
            What happened?
          </h2>
          <p style={{ margin: '0 0 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Select the reason for your dispute
          </p>

          {/* AI suggestion */}
          {isClassifying && (
            <Card variant="outlined" padding="sm" style={{ marginBottom: '1rem', borderColor: 'var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>🧠</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Analyzing transaction...
                </span>
              </div>
            </Card>
          )}

          {aiClassification && !isClassifying && (
            <Card
              variant="outlined"
              padding="sm"
              style={{ marginBottom: '1rem', borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }}
            >
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                  🧠 AI suggests: {categoryLabels[aiClassification.suggestedCategory]}
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {aiClassification.reasoning}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  Confidence: {Math.round(aiClassification.confidence * 100)}% &middot;
                  Est. resolution: {aiClassification.estimatedResolutionDays} days
                </div>
              </div>
            </Card>
          )}

          {/* Category selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {(Object.entries(categoryLabels) as [DisputeCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setCategory(key);
                  if (aiClassification && key === aiClassification.suggestedCategory) {
                    setDescription(aiClassification.suggestedDescription);
                  }
                  setStep('details');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    key === aiClassification?.suggestedCategory
                      ? 'var(--color-primary)'
                      : 'var(--color-border)'
                  }`,
                  backgroundColor:
                    key === aiClassification?.suggestedCategory
                      ? 'var(--color-primary-light)'
                      : 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: key === aiClassification?.suggestedCategory ? 600 : 400,
                  color: 'var(--color-text-primary)',
                }}
              >
                {label}
                {key === aiClassification?.suggestedCategory && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                    Recommended
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Button variant="ghost" onClick={onCancel} fullWidth>Cancel</Button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
            Tell us more
          </h2>
          <p style={{ margin: '0 0 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {category ? categoryLabels[category] : ''}
          </p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />

          {/* Required documents hint */}
          {aiClassification && aiClassification.requiredDocuments.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                Recommended supporting documents:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {aiClassification.requiredDocuments.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button variant="ghost" onClick={() => setStep('classify')} fullWidth>Back</Button>
            <Button variant="primary" onClick={() => setStep('review')} fullWidth disabled={!description.trim()}>
              Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700 }}>
            Review your dispute
          </h2>

          <Card variant="default" padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Type</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {category ? categoryLabels[category] : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Amount</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>${transaction.amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Merchant</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{transaction.merchantName}</span>
              </div>
              {aiClassification && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Est. resolution</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    ~{aiClassification.estimatedResolutionDays} days
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              {description}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button variant="ghost" onClick={() => setStep('details')} fullWidth>Back</Button>
            <Button variant="primary" onClick={handleSubmit} fullWidth loading={isSubmitting} size="lg">
              Submit dispute
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
