import type {
  ProductApiAdapter,
  ProductApiCapability,
  AdapterHealthStatus,
  ProductListResponse,
  ProductDetailResponse,
  PaymentRequest,
  PaymentResponse,
  TransactionQueryParams,
  TransactionListResponse,
  StatementListResponse,
  RawProductData,
  RawTransactionData,
  RawStatementData,
} from './api-adapter';

/**
 * MockProductApiAdapter -- a fully self-contained mock implementation
 * of the ProductApiAdapter interface.
 *
 * PURPOSE
 * -------
 * This adapter ships with the demo build so the front-end can run
 * end-to-end without a real backend.  Every method returns static data
 * after a configurable delay that simulates real API latency.
 *
 * HOW TO REPLACE
 * --------------
 * 1. Create a new file (e.g. `partner-api-service.ts`) that implements
 *    `ProductApiAdapter` and calls your real REST / GraphQL endpoints.
 * 2. Register the new adapter in the `AdapterRegistry` instead of this one.
 * 3. Delete or exclude this file from production bundles.
 *
 * See `api-adapter.ts` for the full interface contract.
 */

// ---------------------------------------------------------------------------
// API contract reference -- quick-reference for developers wiring up a real
// backend.  Each entry documents the HTTP method, URL path, and the
// request / response shapes that the adapter methods expect.
// ---------------------------------------------------------------------------

export const API_CONTRACTS = {
  fetchProducts: {
    method: 'GET' as const,
    url: '/api/v1/users/:userId/products',
    description: 'Returns all financial products for a given user.',
    requestShape: '{ userId: string } (path param)',
    responseShape: 'ProductListResponse  { products: RawProductData[] }',
  },
  fetchProductDetail: {
    method: 'GET' as const,
    url: '/api/v1/products/:productId',
    description: 'Returns full details for a single product.',
    requestShape: '{ productId: string } (path param)',
    responseShape: 'ProductDetailResponse  { product: RawProductData }',
  },
  makePayment: {
    method: 'POST' as const,
    url: '/api/v1/products/:productId/payments',
    description: 'Submits a payment against a product balance.',
    requestShape: 'PaymentRequest  { amount: number; sourceAccountId: string; scheduledDate?: string }',
    responseShape: 'PaymentResponse  { confirmationId: string; status: "confirmed" | "pending" | "failed"; scheduledDate: string }',
  },
  fetchTransactions: {
    method: 'GET' as const,
    url: '/api/v1/products/:productId/transactions',
    description: 'Returns paginated transactions for a product.',
    requestShape: 'TransactionQueryParams  { from?: string; to?: string; limit?: number; offset?: number; category?: string }',
    responseShape: 'TransactionListResponse  { transactions: RawTransactionData[]; total: number; hasMore: boolean }',
  },
  fetchStatements: {
    method: 'GET' as const,
    url: '/api/v1/products/:productId/statements',
    description: 'Returns available billing statements for a product.',
    requestShape: '{ productId: string } (path param)',
    responseShape: 'StatementListResponse  { statements: RawStatementData[] }',
  },
} as const;

/** Exported type so consumers can reference the contract shape. */
export type ApiContracts = typeof API_CONTRACTS;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Options for tuning the mock adapter behavior. */
export interface MockApiConfig {
  /**
   * Simulated network delay in milliseconds.
   * Set to 0 for instant responses (useful in tests).
   * @default 400
   */
  delayMs: number;
}

const DEFAULT_CONFIG: MockApiConfig = {
  delayMs: 400,
};

// ---------------------------------------------------------------------------
// Static demo data
// ---------------------------------------------------------------------------

const DEMO_PRODUCTS: readonly RawProductData[] = [
  {
    id: 'prod-cc-1001',
    externalId: 'SYF-CC-7842',
    category: 'credit_card',
    status: 'active',
    displayName: 'Synchrony Cashback Visa',
    issuer: 'Synchrony Financial',
    partner: {
      id: 'partner-synchrony',
      name: 'Synchrony Financial',
      logoUrl: '/assets/logos/synchrony.svg',
      category: 'issuer',
    },
    creditLimit: 12000,
    currentBalance: 3247.89,
    availableCredit: 8752.11,
    apr: {
      purchase: 21.99,
      cashAdvance: 25.99,
    },
    minimumPaymentDue: 65.0,
    paymentDueDate: '2025-06-15',
    lastFourDigits: '4821',
    rewardsBalance: {
      type: 'cashback',
      value: 142.37,
      displayValue: '$142.37',
    },
    openedAt: '2022-03-10',
  },
  {
    id: 'prod-cc-1002',
    externalId: 'SYF-CC-3199',
    category: 'credit_card',
    status: 'active',
    displayName: 'CareCredit Health Card',
    issuer: 'Synchrony Financial',
    partner: {
      id: 'partner-carecredit',
      name: 'CareCredit',
      logoUrl: '/assets/logos/carecredit.svg',
      category: 'healthcare',
    },
    creditLimit: 5000,
    currentBalance: 1820.0,
    availableCredit: 3180.0,
    apr: {
      purchase: 26.99,
      cashAdvance: 27.99,
      promotional: {
        rate: 0,
        expiresAt: '2025-12-31',
        remainingBalance: 1200.0,
      },
    },
    minimumPaymentDue: 45.0,
    paymentDueDate: '2025-06-20',
    lastFourDigits: '7733',
    openedAt: '2023-08-01',
  },
  {
    id: 'prod-bnpl-2001',
    externalId: 'SYF-BNPL-5510',
    category: 'bnpl',
    status: 'active',
    displayName: 'PayPal Pay-in-4 -- Electronics Purchase',
    issuer: 'Synchrony Financial',
    partner: {
      id: 'partner-paypal',
      name: 'PayPal',
      logoUrl: '/assets/logos/paypal.svg',
      category: 'payments',
    },
    originalAmount: 499.99,
    remainingBalance: 250.0,
    merchant: 'Best Buy',
    installments: {
      total: 4,
      completed: 2,
      remaining: 2,
      nextPaymentAmount: 125.0,
      nextPaymentDate: '2025-06-01',
      frequency: 'biweekly',
    },
    openedAt: '2025-04-15',
  },
] as const;

const DEMO_TRANSACTIONS: readonly RawTransactionData[] = [
  {
    id: 'txn-10001',
    productId: 'prod-cc-1001',
    date: '2025-05-12',
    postedDate: '2025-05-13',
    description: 'Amazon.com',
    amount: -89.97,
    category: 'shopping',
    status: 'posted',
    merchantCategory: 'online_retail',
  },
  {
    id: 'txn-10002',
    productId: 'prod-cc-1001',
    date: '2025-05-10',
    postedDate: '2025-05-11',
    description: 'Whole Foods Market',
    amount: -64.23,
    category: 'groceries',
    status: 'posted',
    merchantCategory: 'grocery',
  },
  {
    id: 'txn-10003',
    productId: 'prod-cc-1001',
    date: '2025-05-08',
    postedDate: '2025-05-08',
    description: 'Payment Received -- Thank You',
    amount: 200.0,
    category: 'payment',
    status: 'posted',
    merchantCategory: 'payment',
  },
  {
    id: 'txn-10004',
    productId: 'prod-cc-1001',
    date: '2025-05-05',
    postedDate: '2025-05-06',
    description: 'Shell Gas Station',
    amount: -52.14,
    category: 'gas',
    status: 'posted',
    merchantCategory: 'fuel',
  },
  {
    id: 'txn-10005',
    productId: 'prod-cc-1001',
    date: '2025-05-02',
    postedDate: '2025-05-03',
    description: 'Netflix Subscription',
    amount: -15.99,
    category: 'entertainment',
    status: 'posted',
    merchantCategory: 'streaming',
  },
] as const;

const DEMO_STATEMENTS: readonly RawStatementData[] = [
  {
    id: 'stmt-3001',
    productId: 'prod-cc-1001',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    closingBalance: 3420.15,
    minimumPaymentDue: 68.0,
    paymentDueDate: '2025-05-15',
    totalCredits: 200.0,
    totalDebits: 587.42,
    downloadUrl: '/api/v1/statements/stmt-3001/pdf',
  },
  {
    id: 'stmt-3002',
    productId: 'prod-cc-1001',
    periodStart: '2025-03-01',
    periodEnd: '2025-03-31',
    closingBalance: 3032.73,
    minimumPaymentDue: 61.0,
    paymentDueDate: '2025-04-15',
    totalCredits: 150.0,
    totalDebits: 410.88,
    downloadUrl: '/api/v1/statements/stmt-3002/pdf',
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pauses execution for the given duration, simulating network latency.
 * Returns immediately if delayMs <= 0.
 */
function simulateLatency(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a pseudo-random confirmation ID in the format
 * "CONF-XXXXXXXX" where X is an uppercase hex character.
 */
function generateConfirmationId(): string {
  const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
  return `CONF-${hex}`;
}

// ---------------------------------------------------------------------------
// MockProductApiAdapter
// ---------------------------------------------------------------------------

/**
 * A mock implementation of {@link ProductApiAdapter} that returns static
 * demo data after a configurable delay.
 *
 * Each public method mirrors a real API call:
 *  - `fetchProducts()`      -- list all products for a user
 *  - `fetchProductDetail()` -- get a single product by ID
 *  - `makePayment()`        -- submit a payment (always succeeds)
 *  - `fetchTransactions()`  -- paginated transaction history
 *  - `fetchStatements()`    -- billing statement list
 *
 * Replace this adapter with a real implementation by creating a class
 * that implements `ProductApiAdapter` and registering it in the
 * `AdapterRegistry`.
 */
export class MockProductApiAdapter implements ProductApiAdapter {
  // -- Identity -----------------------------------------------------------

  readonly id = 'mock-product-api';
  readonly name = 'Mock Product API (Demo)';
  readonly version = '1.0.0';

  readonly capabilities: ReadonlySet<ProductApiCapability> = new Set<ProductApiCapability>([
    'fetch_products',
    'fetch_detail',
    'make_payment',
    'fetch_transactions',
    'fetch_statements',
  ]);

  // -- Internal state -----------------------------------------------------

  private readonly config: MockApiConfig;
  private initialized = false;

  constructor(config: Partial<MockApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -- Lifecycle ----------------------------------------------------------

  /**
   * Initialize the adapter.
   *
   * In a real adapter this would perform an auth handshake, fetch config
   * from the server, or warm caches.  The mock is a no-op.
   */
  async initialize(): Promise<void> {
    await simulateLatency(this.config.delayMs / 2);
    this.initialized = true;
  }

  /**
   * Dispose of resources held by the adapter.
   *
   * In a real adapter this would close WebSocket connections, cancel
   * in-flight requests, or revoke tokens.  The mock is a no-op.
   */
  async dispose(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Health check.
   *
   * The mock adapter is always healthy.  A real adapter would ping the
   * upstream API and report degraded capabilities when appropriate.
   */
  async healthCheck(): Promise<AdapterHealthStatus> {
    return {
      healthy: true,
      latencyMs: this.config.delayMs,
    };
  }

  // -- Data methods -------------------------------------------------------

  /**
   * Fetch all products for the given user.
   *
   * Real implementation:
   *   GET /api/v1/users/:userId/products
   *
   * @param _userId - The authenticated user ID (unused in mock).
   * @returns A list of 3 demo credit products.
   */
  async fetchProducts(_userId: string): Promise<ProductListResponse> {
    await simulateLatency(this.config.delayMs);
    return {
      products: [...DEMO_PRODUCTS],
    };
  }

  /**
   * Fetch full details for a single product.
   *
   * Real implementation:
   *   GET /api/v1/products/:productId
   *
   * @param productId - The product ID to look up.
   * @returns The matching product, or the first demo product as fallback.
   */
  async fetchProductDetail(productId: string): Promise<ProductDetailResponse> {
    await simulateLatency(this.config.delayMs);
    const match = DEMO_PRODUCTS.find((p) => p.id === productId);
    const fallback = DEMO_PRODUCTS[0];
    const product = match ?? fallback;
    if (!product) {
      throw new Error(`No demo product found for id "${productId}"`);
    }
    return {
      product: { ...product },
    };
  }

  /**
   * Submit a payment against a product balance.
   *
   * Real implementation:
   *   POST /api/v1/products/:productId/payments
   *   Body: PaymentRequest
   *
   * The mock always returns a "confirmed" status with a random
   * confirmation ID.
   *
   * @param _productId - The product being paid (unused in mock).
   * @param request    - Payment details (amount, source account, date).
   * @returns A simulated payment confirmation.
   */
  async makePayment(
    _productId: string,
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    await simulateLatency(this.config.delayMs * 1.5);
    return {
      confirmationId: generateConfirmationId(),
      status: 'confirmed',
      scheduledDate: request.scheduledDate ?? new Date().toISOString().split('T')[0] ?? '',
    };
  }

  /**
   * Fetch paginated transactions for a product.
   *
   * Real implementation:
   *   GET /api/v1/products/:productId/transactions?from=...&to=...&limit=...&offset=...
   *
   * The mock ignores query params and returns all 5 demo transactions.
   *
   * @param _productId - The product whose transactions to fetch.
   * @param _params    - Pagination / filter parameters (unused in mock).
   * @returns 5 demo transactions.
   */
  async fetchTransactions(
    _productId: string,
    _params: TransactionQueryParams,
  ): Promise<TransactionListResponse> {
    await simulateLatency(this.config.delayMs);
    return {
      transactions: [...DEMO_TRANSACTIONS],
      total: DEMO_TRANSACTIONS.length,
      hasMore: false,
    };
  }

  /**
   * Fetch billing statements for a product.
   *
   * Real implementation:
   *   GET /api/v1/products/:productId/statements
   *
   * @param _productId - The product whose statements to fetch.
   * @returns 2 demo billing statements.
   */
  async fetchStatements(_productId: string): Promise<StatementListResponse> {
    await simulateLatency(this.config.delayMs);
    return {
      statements: [...DEMO_STATEMENTS],
    };
  }
}
