import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { InsightsEngine, InsightFetchOptions } from '../services/insights-engine';
import type { Insight, InsightCategory, InsightPriority } from '../../../core/types/ai';

/**
 * React hooks for the AI insights system.
 */

export const insightKeys = {
  all: ['insights'] as const,
  list: (options?: InsightFetchOptions) => [...insightKeys.all, 'list', options] as const,
  risk: () => [...insightKeys.all, 'risk'] as const,
  nudges: () => [...insightKeys.all, 'nudges'] as const,
  suggested: (productId: string) => [...insightKeys.all, 'suggested', productId] as const,
};

export function useInsights(engine: InsightsEngine, options?: InsightFetchOptions) {
  return useQuery({
    queryKey: insightKeys.list(options),
    queryFn: () => engine.fetchInsights(options),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useRiskAssessments(engine: InsightsEngine) {
  return useQuery({
    queryKey: insightKeys.risk(),
    queryFn: () => engine.fetchRiskAssessments(),
    staleTime: 5 * 60_000,
  });
}

export function useNudges(engine: InsightsEngine) {
  return useQuery({
    queryKey: insightKeys.nudges(),
    queryFn: () => engine.fetchNudges(),
    staleTime: 5 * 60_000,
  });
}

export function useSuggestedActions(engine: InsightsEngine, productId: string) {
  return useQuery({
    queryKey: insightKeys.suggested(productId),
    queryFn: () => engine.getSuggestedActions(productId),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}

export function useInsightActions(engine: InsightsEngine) {
  const queryClient = useQueryClient();

  const markSeen = useMutation({
    mutationFn: (insightId: string) => engine.markSeen(insightId),
  });

  const dismiss = useMutation({
    mutationFn: ({ insightId, reason }: { insightId: string; reason?: string }) =>
      engine.dismiss(insightId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
  });

  const recordAction = useMutation({
    mutationFn: ({ insightId, actionId }: { insightId: string; actionId: string }) =>
      engine.recordAction(insightId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
  });

  return { markSeen, dismiss, recordAction };
}

/**
 * Filter and sort insights for display.
 * Critical insights float to the top. Expired/dismissed are excluded.
 */
export function useFilteredInsights(
  insights: readonly Insight[] | undefined,
  options?: {
    categories?: InsightCategory[];
    minPriority?: InsightPriority;
    limit?: number;
  },
): readonly Insight[] {
  const priorityOrder: Record<InsightPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  if (!insights) return [];

  let filtered = insights.filter((i) => i.status !== 'expired' && i.status !== 'dismissed');

  if (options?.categories?.length) {
    const cats = new Set(options.categories);
    filtered = filtered.filter((i) => cats.has(i.category));
  }

  if (options?.minPriority) {
    const minOrder = priorityOrder[options.minPriority];
    filtered = filtered.filter((i) => priorityOrder[i.priority] <= minOrder);
  }

  filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}
