/**
 * AI engine types — the nervous system of the servicing platform.
 *
 * The AI layer is not a chatbot bolted on. It's a first-class system component
 * that drives proactive insights, risk detection, behavioral nudges, and
 * adaptive UI rendering.
 */

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export type InsightCategory =
  | 'payment_optimization'
  | 'credit_improvement'
  | 'savings_opportunity'
  | 'risk_alert'
  | 'promotional_expiry'
  | 'spending_pattern'
  | 'debt_reduction'
  | 'product_recommendation';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export type InsightStatus = 'new' | 'seen' | 'acted_on' | 'dismissed' | 'expired';

export interface Insight {
  readonly id: string;
  readonly category: InsightCategory;
  readonly priority: InsightPriority;
  readonly status: InsightStatus;
  readonly title: string;
  readonly summary: string;
  readonly explanation: InsightExplanation;
  readonly suggestedActions: readonly SuggestedAction[];
  readonly relatedProductIds: readonly string[];
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface InsightExplanation {
  /** Human-readable explanation of why this insight was generated */
  readonly reasoning: string;
  /** Data points that contributed to this insight */
  readonly dataPoints: readonly ExplanationDataPoint[];
  /** Confidence level 0-1 */
  readonly confidence: number;
}

export interface ExplanationDataPoint {
  readonly label: string;
  readonly value: string;
  readonly source: string;
}

// ---------------------------------------------------------------------------
// Suggested actions — the bridge between insight and action
// ---------------------------------------------------------------------------

export type ActionType =
  | 'navigate'
  | 'api_call'
  | 'schedule'
  | 'dismiss'
  | 'learn_more'
  | 'contact_support';

export interface SuggestedAction {
  readonly id: string;
  readonly type: ActionType;
  readonly label: string;
  readonly description: string;
  readonly estimatedImpact?: ActionImpact;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface ActionImpact {
  readonly metric: string;
  readonly currentValue: string;
  readonly projectedValue: string;
  readonly timeframe: string;
}

// ---------------------------------------------------------------------------
// Conversational assistant
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly attachments?: readonly MessageAttachment[];
  readonly actions?: readonly SuggestedAction[];
  readonly timestamp: Date;
}

export interface MessageAttachment {
  readonly type: 'product_card' | 'chart' | 'transaction' | 'insight' | 'link';
  readonly data: Readonly<Record<string, unknown>>;
}

export interface ConversationContext {
  readonly sessionId: string;
  readonly activeProductId?: string;
  readonly recentInsightIds: readonly string[];
  readonly userIntent?: string;
}

// ---------------------------------------------------------------------------
// Behavioral nudge framework
// ---------------------------------------------------------------------------

export type NudgeType =
  | 'payment_reminder'
  | 'savings_prompt'
  | 'credit_tip'
  | 'promotional_alert'
  | 'milestone_celebration'
  | 'risk_warning';

export type NudgeTrigger =
  | 'time_based'
  | 'event_based'
  | 'threshold_based'
  | 'pattern_based';

export interface BehavioralNudge {
  readonly id: string;
  readonly type: NudgeType;
  readonly trigger: NudgeTrigger;
  readonly content: NudgeContent;
  readonly targetProductIds: readonly string[];
  readonly priority: InsightPriority;
  readonly displayConstraints: NudgeDisplayConstraints;
  readonly createdAt: Date;
}

export interface NudgeContent {
  readonly headline: string;
  readonly body: string;
  readonly cta?: SuggestedAction;
  readonly illustration?: string;
}

export interface NudgeDisplayConstraints {
  /** Max times to show this nudge */
  readonly maxImpressions: number;
  /** Minimum hours between impressions */
  readonly cooldownHours: number;
  /** Don't show if user dismissed similar nudge recently */
  readonly respectDismissals: boolean;
}

// ---------------------------------------------------------------------------
// Predictive risk
// ---------------------------------------------------------------------------

export interface PaymentRiskAssessment {
  readonly productId: string;
  readonly riskScore: number; // 0-100, higher = riskier
  readonly missedPaymentProbability: number; // 0-1
  readonly contributingFactors: readonly RiskContributingFactor[];
  readonly suggestedInterventions: readonly SuggestedAction[];
  readonly assessedAt: Date;
}

export interface RiskContributingFactor {
  readonly factor: string;
  readonly direction: 'increasing_risk' | 'decreasing_risk';
  readonly magnitude: 'low' | 'medium' | 'high';
}
