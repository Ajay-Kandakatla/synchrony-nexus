import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Product, ProductStatus } from '../../../core/types/product';

/**
 * Account store — event-driven state management.
 *
 * Architecture decision: Zustand + Immer + React Query hybrid.
 *
 * Why this combination:
 * - Zustand: Minimal boilerplate, TypeScript-first, no provider wrapping.
 *   Perfect for client-owned state (UI state, selections, preferences).
 * - React Query: Server state management (caching, deduplication, background
 *   refresh). Products, transactions, statements live here.
 * - Immer: Immutable updates with mutable syntax. Reduces bugs in
 *   complex state transitions.
 *
 * What lives in Zustand (client state):
 * - Selected product
 * - UI state (modals, panels, filters)
 * - Optimistic updates pending confirmation
 *
 * What lives in React Query (server state):
 * - Product list & details
 * - Transaction history
 * - Statements
 * - AI insights
 *
 * The event bus bridges the two: server events (via WebSocket) invalidate
 * React Query caches, and UI events update Zustand.
 */

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AccountState {
  selectedProductId: string | null;
  optimisticUpdates: Map<string, OptimisticUpdate>;
  paymentFlow: PaymentFlowState | null;
  filters: AccountFilters;
}

interface OptimisticUpdate {
  id: string;
  productId: string;
  type: 'payment' | 'autopay' | 'lock';
  timestamp: Date;
  rollback: () => void;
}

interface PaymentFlowState {
  step: 'amount' | 'source' | 'review' | 'confirmation';
  productId: string;
  amount: number | null;
  sourceAccountId: string | null;
  scheduledDate: Date | null;
}

interface AccountFilters {
  statusFilter: ProductStatus | 'all';
  categoryFilter: string | 'all';
  sortBy: 'name' | 'balance' | 'due_date';
  sortDirection: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface AccountActions {
  selectProduct(productId: string | null): void;

  // Payment flow
  startPaymentFlow(productId: string): void;
  updatePaymentFlow(updates: Partial<PaymentFlowState>): void;
  cancelPaymentFlow(): void;
  completePaymentFlow(): void;

  // Optimistic updates
  addOptimisticUpdate(update: Omit<OptimisticUpdate, 'timestamp'>): void;
  confirmOptimisticUpdate(updateId: string): void;
  rollbackOptimisticUpdate(updateId: string): void;

  // Filters
  setFilter<K extends keyof AccountFilters>(key: K, value: AccountFilters[K]): void;
  resetFilters(): void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS: AccountFilters = {
  statusFilter: 'all',
  categoryFilter: 'all',
  sortBy: 'due_date',
  sortDirection: 'asc',
};

export const useAccountStore = create<AccountState & AccountActions>()(
  immer((set) => ({
    // Initial state
    selectedProductId: null,
    optimisticUpdates: new Map(),
    paymentFlow: null,
    filters: { ...DEFAULT_FILTERS },

    // Actions
    selectProduct(productId) {
      set((state) => {
        state.selectedProductId = productId;
      });
    },

    startPaymentFlow(productId) {
      set((state) => {
        state.paymentFlow = {
          step: 'amount',
          productId,
          amount: null,
          sourceAccountId: null,
          scheduledDate: null,
        };
      });
    },

    updatePaymentFlow(updates) {
      set((state) => {
        if (state.paymentFlow) {
          Object.assign(state.paymentFlow, updates);
        }
      });
    },

    cancelPaymentFlow() {
      set((state) => {
        state.paymentFlow = null;
      });
    },

    completePaymentFlow() {
      set((state) => {
        state.paymentFlow = null;
      });
    },

    addOptimisticUpdate(update) {
      set((state) => {
        state.optimisticUpdates.set(update.id, {
          ...update,
          timestamp: new Date(),
        });
      });
    },

    confirmOptimisticUpdate(updateId) {
      set((state) => {
        state.optimisticUpdates.delete(updateId);
      });
    },

    rollbackOptimisticUpdate(updateId) {
      set((state) => {
        const update = state.optimisticUpdates.get(updateId);
        if (update) {
          update.rollback();
          state.optimisticUpdates.delete(updateId);
        }
      });
    },

    setFilter(key, value) {
      set((state) => {
        (state.filters as Record<string, unknown>)[key] = value;
      });
    },

    resetFilters() {
      set((state) => {
        state.filters = { ...DEFAULT_FILTERS };
      });
    },
  })),
);
