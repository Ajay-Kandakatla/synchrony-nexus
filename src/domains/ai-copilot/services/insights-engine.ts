import type { ApiClient } from '../../../infrastructure/api/api-client';
import type { EventBus } from '../../../core/types/events';
import type {
  Insight,
  InsightCategory,
  PaymentRiskAssessment,
  BehavioralNudge,
  ConversationMessage,
  ConversationContext,
  SuggestedAction,
} from '../../../core/types/ai';

/**
 * AI Insights Engine — the brain of proactive servicing.
 *
 * This service manages the full lifecycle of AI-generated insights:
 * 1. Fetch insights from the AI backend
 * 2. Prioritize and filter based on user context
 * 3. Track interaction (viewed, acted on, dismissed)
 * 4. Feed interaction data back for model improvement
 *
 * Data flow:
 *   User context + Product data → AI Backend → Insights → UI
 *   User interaction → Event Bus → Analytics → AI Backend (feedback loop)
 *
 * Explainability:
 *   Every insight carries an `explanation` field with human-readable reasoning,
 *   contributing data points, and confidence score. The UI renders this as
 *   an expandable "Why am I seeing this?" section.
 *
 * Ethical guardrails:
 *   - Insights never pressure users into debt
 *   - Credit increase suggestions include risk context
 *   - Payment optimization never recommends skipping payments
 *   - All recommendations include opt-out/dismiss
 */

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface InsightsEngine {
  /** Fetch personalized insights for the current user */
  fetchInsights(options?: InsightFetchOptions): Promise<readonly Insight[]>;

  /** Mark an insight as seen */
  markSeen(insightId: string): Promise<void>;

  /** Record that the user acted on an insight */
  recordAction(insightId: string, actionId: string): Promise<void>;

  /** Dismiss an insight with optional feedback */
  dismiss(insightId: string, reason?: string): Promise<void>;

  /** Get payment risk assessments for all products */
  fetchRiskAssessments(): Promise<readonly PaymentRiskAssessment[]>;

  /** Get active behavioral nudges */
  fetchNudges(): Promise<readonly BehavioralNudge[]>;

  /** Send a message to the conversational assistant */
  sendMessage(
    message: string,
    context: ConversationContext,
  ): Promise<ConversationMessage>;

  /** Get suggested actions for a specific product */
  getSuggestedActions(productId: string): Promise<readonly SuggestedAction[]>;
}

export interface InsightFetchOptions {
  categories?: readonly InsightCategory[];
  productIds?: readonly string[];
  minPriority?: 'critical' | 'high' | 'medium' | 'low';
  limit?: number;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createInsightsEngine(
  apiClient: ApiClient,
  eventBus: EventBus,
): InsightsEngine {
  return {
    async fetchInsights(options?: InsightFetchOptions): Promise<readonly Insight[]> {
      const params: Record<string, string> = {};
      if (options?.categories) params['categories'] = options.categories.join(',');
      if (options?.productIds) params['productIds'] = options.productIds.join(',');
      if (options?.minPriority) params['minPriority'] = options.minPriority;
      if (options?.limit) params['limit'] = String(options.limit);

      const response = await apiClient.get(
        '/api/v1/ai/insights',
        insightListSchema as unknown as z.ZodType<z.infer<typeof insightListSchema>>,
        params,
      );

      return response.data.insights as unknown as readonly Insight[];
    },

    async markSeen(insightId: string): Promise<void> {
      await apiClient.post(`/api/v1/ai/insights/${insightId}/seen`, voidSchema);

      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ai.insight.acted_on',
        payload: { insightId, actionId: 'seen' },
        timestamp: new Date(),
        source: { system: 'client', module: 'ai-copilot' },
      });
    },

    async recordAction(insightId: string, actionId: string): Promise<void> {
      await apiClient.post(`/api/v1/ai/insights/${insightId}/actions`, voidSchema, {
        actionId,
      });

      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ai.insight.acted_on',
        payload: { insightId, actionId },
        timestamp: new Date(),
        source: { system: 'client', module: 'ai-copilot' },
      });
    },

    async dismiss(insightId: string, reason?: string): Promise<void> {
      await apiClient.post(`/api/v1/ai/insights/${insightId}/dismiss`, voidSchema, {
        reason,
      });

      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ai.insight.dismissed',
        payload: { insightId, ...(reason !== undefined ? { reason } : {}) },
        timestamp: new Date(),
        source: { system: 'client', module: 'ai-copilot' },
      });
    },

    async fetchRiskAssessments(): Promise<readonly PaymentRiskAssessment[]> {
      const response = await apiClient.get(
        '/api/v1/ai/risk-assessments',
        riskAssessmentListSchema as unknown as z.ZodType<z.infer<typeof riskAssessmentListSchema>>,
      );
      return response.data.assessments as unknown as readonly PaymentRiskAssessment[];
    },

    async fetchNudges(): Promise<readonly BehavioralNudge[]> {
      const response = await apiClient.get('/api/v1/ai/nudges', nudgeListSchema);
      return response.data.nudges as unknown as readonly BehavioralNudge[];
    },

    async sendMessage(
      message: string,
      context: ConversationContext,
    ): Promise<ConversationMessage> {
      const response = await apiClient.post(
        '/api/v1/ai/conversation/messages',
        conversationMessageSchema as unknown as z.ZodType<z.infer<typeof conversationMessageSchema>>,
        { message, context },
      );

      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ai.conversation.message',
        payload: { sessionId: context.sessionId, role: 'user' },
        timestamp: new Date(),
        source: { system: 'client', module: 'ai-copilot' },
      });

      return response.data as unknown as ConversationMessage;
    },

    async getSuggestedActions(productId: string): Promise<readonly SuggestedAction[]> {
      const response = await apiClient.get(
        `/api/v1/ai/products/${productId}/suggested-actions`,
        suggestedActionsSchema,
      );
      return response.data.actions as unknown as readonly SuggestedAction[];
    },
  };
}

// ---------------------------------------------------------------------------
// Zod schemas for response validation
// ---------------------------------------------------------------------------
// (In production these would be in a shared schema package)

import { z } from 'zod';

const voidSchema = z.object({}).passthrough();

const insightListSchema = z.object({
  insights: z.array(z.object({
    id: z.string(),
    category: z.string(),
    priority: z.string(),
    status: z.string(),
    title: z.string(),
    summary: z.string(),
    explanation: z.object({
      reasoning: z.string(),
      dataPoints: z.array(z.object({
        label: z.string(),
        value: z.string(),
        source: z.string(),
      })),
      confidence: z.number(),
    }),
    suggestedActions: z.array(z.object({
      id: z.string(),
      type: z.string(),
      label: z.string(),
      description: z.string(),
      estimatedImpact: z.object({
        metric: z.string(),
        currentValue: z.string(),
        projectedValue: z.string(),
        timeframe: z.string(),
      }).optional(),
      payload: z.record(z.unknown()),
    })),
    relatedProductIds: z.array(z.string()),
    createdAt: z.string().transform((s) => new Date(s)),
    expiresAt: z.string().transform((s) => new Date(s)).optional(),
    metadata: z.record(z.unknown()),
  })),
});

const riskAssessmentListSchema = z.object({
  assessments: z.array(z.object({
    productId: z.string(),
    riskScore: z.number(),
    missedPaymentProbability: z.number(),
    contributingFactors: z.array(z.object({
      factor: z.string(),
      direction: z.enum(['increasing_risk', 'decreasing_risk']),
      magnitude: z.enum(['low', 'medium', 'high']),
    })),
    suggestedInterventions: z.array(z.unknown()),
    assessedAt: z.string().transform((s) => new Date(s)),
  })),
});

const nudgeListSchema = z.object({
  nudges: z.array(z.unknown()),
});

const conversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().transform((s) => new Date(s)),
}).passthrough();

const suggestedActionsSchema = z.object({
  actions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    description: z.string(),
    payload: z.record(z.unknown()),
  }).passthrough()),
});
