import type { z } from 'zod';
import type { ApiClient } from './api-client';

/**
 * API Adapter interface — the integration boundary for partner APIs.
 *
 * Every external API (core platform, partner services, AI engine)
 * is accessed through an adapter that conforms to this interface.
 * This allows:
 * - Swapping backends without touching domain logic
 * - Versioned contracts via schema evolution
 * - Graceful degradation when a partner API is down
 * - Testing with mock adapters
 */

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface ApiAdapter<TCapabilities extends string = string> {
  /** Unique identifier for this adapter */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** API version this adapter targets */
  readonly version: string;

  /** Capabilities this adapter provides */
  readonly capabilities: ReadonlySet<TCapabilities>;

  /** Health check — called periodically to detect degradation */
  healthCheck(): Promise<AdapterHealthStatus>;

  /** Initialize the adapter (auth handshake, config fetch, etc.) */
  initialize(): Promise<void>;

  /** Tear down connections */
  dispose(): Promise<void>;
}

export interface AdapterHealthStatus {
  readonly healthy: boolean;
  readonly latencyMs: number;
  readonly degradedCapabilities?: readonly string[];
  readonly lastError?: string;
}

// ---------------------------------------------------------------------------
// Product API adapter
// ---------------------------------------------------------------------------

export interface ProductApiAdapter extends ApiAdapter<ProductApiCapability> {
  fetchProducts(userId: string): Promise<ProductListResponse>;
  fetchProductDetail(productId: string): Promise<ProductDetailResponse>;
  makePayment(productId: string, request: PaymentRequest): Promise<PaymentResponse>;
  fetchTransactions(productId: string, params: TransactionQueryParams): Promise<TransactionListResponse>;
  fetchStatements(productId: string): Promise<StatementListResponse>;
}

export type ProductApiCapability =
  | 'fetch_products'
  | 'fetch_detail'
  | 'make_payment'
  | 'fetch_transactions'
  | 'fetch_statements'
  | 'manage_autopay'
  | 'lock_card';

// Response shapes — kept intentionally flat for adapter simplicity
export interface ProductListResponse {
  products: readonly RawProductData[];
}

export interface ProductDetailResponse {
  product: RawProductData;
}

export interface RawProductData {
  id: string;
  [key: string]: unknown;
}

export interface PaymentRequest {
  amount: number;
  sourceAccountId: string;
  scheduledDate?: string;
}

export interface PaymentResponse {
  confirmationId: string;
  status: 'confirmed' | 'pending' | 'failed';
  scheduledDate: string;
}

export interface TransactionQueryParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  category?: string;
}

export interface TransactionListResponse {
  transactions: readonly RawTransactionData[];
  total: number;
  hasMore: boolean;
}

export interface RawTransactionData {
  id: string;
  [key: string]: unknown;
}

export interface StatementListResponse {
  statements: readonly RawStatementData[];
}

export interface RawStatementData {
  id: string;
  periodStart: string;
  periodEnd: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Adapter factory — creates adapters from config
// ---------------------------------------------------------------------------

export type AdapterFactory<T extends ApiAdapter> = (client: ApiClient) => T;

/**
 * Registry of adapter factories, keyed by adapter ID.
 * New partner integrations register their factory here.
 */
export class AdapterRegistry<T extends ApiAdapter> {
  private readonly factories = new Map<string, AdapterFactory<T>>();
  private readonly instances = new Map<string, T>();

  register(id: string, factory: AdapterFactory<T>): void {
    if (this.factories.has(id)) {
      throw new Error(`Adapter "${id}" is already registered`);
    }
    this.factories.set(id, factory);
  }

  async resolve(id: string, client: ApiClient): Promise<T> {
    const existing = this.instances.get(id);
    if (existing) return existing;

    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`No adapter registered for "${id}"`);
    }

    const instance = factory(client);
    await instance.initialize();
    this.instances.set(id, instance);
    return instance;
  }

  async disposeAll(): Promise<void> {
    const disposals = Array.from(this.instances.values()).map((a) => a.dispose());
    await Promise.allSettled(disposals);
    this.instances.clear();
  }
}
