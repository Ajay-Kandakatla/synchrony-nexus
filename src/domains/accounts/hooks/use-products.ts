import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../../../core/types/product';
import type { ProductApiAdapter, PaymentRequest } from '../../../infrastructure/api/api-adapter';

/**
 * React Query hooks for product data.
 *
 * These hooks are the bridge between the adapter layer and UI components.
 * They provide:
 * - Automatic caching & background refresh
 * - Optimistic updates for payments
 * - Type-safe data access
 * - Loading/error states
 */

// ---------------------------------------------------------------------------
// Query keys (centralized for cache invalidation)
// ---------------------------------------------------------------------------

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (userId: string) => [...productKeys.lists(), userId] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (productId: string) => [...productKeys.details(), productId] as const,
  transactions: (productId: string) => [...productKeys.all, 'transactions', productId] as const,
  statements: (productId: string) => [...productKeys.all, 'statements', productId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProducts(userId: string, adapter: ProductApiAdapter) {
  return useQuery({
    queryKey: productKeys.list(userId),
    queryFn: () => adapter.fetchProducts(userId),
    staleTime: 30_000, // 30 seconds — products can change from external events
    gcTime: 5 * 60_000, // 5 minutes in garbage collection
    refetchOnWindowFocus: true,
  });
}

export function useProductDetail(productId: string, adapter: ProductApiAdapter) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => adapter.fetchProductDetail(productId),
    staleTime: 15_000,
    enabled: !!productId,
  });
}

export function useTransactions(
  productId: string,
  adapter: ProductApiAdapter,
  params?: { from?: string; to?: string; limit?: number },
) {
  return useQuery({
    queryKey: [...productKeys.transactions(productId), params],
    queryFn: () => adapter.fetchTransactions(productId, params ?? {}),
    staleTime: 60_000,
    enabled: !!productId,
  });
}

export function useStatements(productId: string, adapter: ProductApiAdapter) {
  return useQuery({
    queryKey: productKeys.statements(productId),
    queryFn: () => adapter.fetchStatements(productId),
    staleTime: 5 * 60_000, // statements rarely change
    enabled: !!productId,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function usePayment(productId: string, adapter: ProductApiAdapter) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentRequest) => adapter.makePayment(productId, request),

    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) });

      // Snapshot previous value for rollback
      const previousDetail = queryClient.getQueryData(productKeys.detail(productId));

      // Optimistic update — reduce balance by payment amount
      queryClient.setQueryData(productKeys.detail(productId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { product: { currentBalance?: number } };
        return {
          ...data,
          product: {
            ...data.product,
            currentBalance: (data.product.currentBalance ?? 0) - request.amount,
          },
        };
      });

      return { previousDetail };
    },

    onError: (_err, _request, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(productKeys.detail(productId), context.previousDetail);
      }
    },

    onSettled: () => {
      // Refetch to get authoritative server state
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.transactions(productId) });
    },
  });
}
