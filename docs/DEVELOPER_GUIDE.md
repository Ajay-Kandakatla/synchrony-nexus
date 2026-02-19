# Nexus Platform -- Developer Integration Guide

This guide covers everything needed to connect real backend APIs to the Nexus financial servicing platform. The frontend is built with React 19, TypeScript 5.7, and Vite 6, and uses an adapter pattern that lets you swap mock data for live APIs without touching UI or domain code.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [API Contracts](#2-api-contracts)
3. [Step-by-Step Integration Guide](#3-step-by-step-integration-guide)
4. [Environment Configuration](#4-environment-configuration)
5. [Testing](#5-testing)
6. [Deployment](#6-deployment)

---

## 1. Architecture Overview

### The Adapter Pattern

All external API communication flows through a strict layered architecture. UI components never call `fetch` directly. Instead, data travels through three layers:

```
+---------------------+
|   UI Components     |   React components, hooks (useProducts, useInsights)
|   (React 19)        |
+----------+----------+
           |
           | React Query hooks call domain services
           v
+----------+----------+
|  Domain Services    |   InsightsEngine, account store, payment flows
|  (Business Logic)   |
+----------+----------+
           |
           | Domain services call adapter methods
           v
+----------+----------+
|   API Adapters      |   ProductApiAdapter, AI adapter implementations
|   (Integration)     |
+----------+----------+
           |
           | Adapters use ApiClient (fetch + Zod validation + retry)
           v
+----------+----------+
|   ApiClient         |   Typed HTTP client with auth, retries, dedup
|   (Infrastructure)  |
+----------+----------+
           |
           | HTTP / WebSocket
           v
+----------+----------+
|   Real Backend      |   Your API server, BFF, partner services
|   (External)        |
+----------+----------+
```

### How the Mock Layer Works

In development, [MSW (Mock Service Worker)](https://mswjs.io/) intercepts all HTTP requests at the network level. The mock handlers live in `src/test/mocks/handlers.ts` and replicate the exact API contract shape. This means:

- The app boots and runs identically whether hitting real or mock APIs
- No `if (isDev)` conditionals anywhere in production code
- The same handlers power both development mode (`msw/browser`) and test mode (`msw/node`)

To disable mocking and hit a real backend, set `VITE_API_BASE_URL` to your server and stop starting the MSW worker.

### Key Files

| File | Purpose |
|------|---------|
| `src/infrastructure/api/api-client.ts` | Typed HTTP client with Zod validation, retries, dedup |
| `src/infrastructure/api/api-adapter.ts` | Adapter interfaces, registry, response types |
| `src/infrastructure/auth/auth-service.ts` | Token lifecycle (in-memory access token, httpOnly refresh) |
| `src/core/config/app-config.ts` | Environment-aware configuration loader |
| `src/app/bootstrap.ts` | Service wiring and application startup |
| `src/test/mocks/handlers.ts` | MSW mock API handlers |

---

## 2. API Contracts

All endpoints are served under the base path configured by `VITE_API_BASE_URL` (default: `http://localhost:8080`). The full URL for any endpoint is `{VITE_API_BASE_URL}/api/v1/{path}`.

Every response is validated against a Zod schema on the client side. If your backend returns data that does not match the schema, the client will throw a `SCHEMA_VALIDATION_ERROR`.

All requests include:
- `Authorization: Bearer {token}` header (auto-injected by ApiClient)
- `Content-Type: application/json` header
- `X-Request-ID: {uuid}` header for tracing

---

### 2.1 Products API

#### GET /api/v1/products

Fetch all products for the authenticated user.

**Response: `ProductListResponse`**

```typescript
interface ProductListResponse {
  products: readonly RawProductData[];
}

interface RawProductData {
  id: string;
  externalId: string;
  category: 'credit_card' | 'bnpl' | 'savings' | 'cd' | 'ira'
           | 'money_market' | 'installment_loan' | 'care_credit'
           | 'promotional_financing';
  status: 'active' | 'pending_activation' | 'suspended'
        | 'closed' | 'delinquent' | 'charged_off';
  displayName: string;
  issuer: string;
  partner: {
    id: string;
    name: string;
    logoUrl: string;
    category: string;
  };
  openedAt: string;              // ISO 8601
  metadata: Record<string, unknown>;
  // Credit-specific fields (when category is credit_card or care_credit):
  creditLimit?: number;
  currentBalance?: number;
  availableCredit?: number;
  apr?: {
    purchase: number;
    cashAdvance: number;
    promotional?: {
      rate: number;
      expiresAt: string;          // ISO 8601
      remainingBalance: number;
    };
  };
  minimumPaymentDue?: number;
  paymentDueDate?: string;        // ISO 8601
  lastFourDigits?: string;
  // Installment-specific fields (when category is bnpl or installment_loan):
  originalAmount?: number;
  remainingBalance?: number;
  installments?: {
    total: number;
    completed: number;
    remaining: number;
    nextPaymentAmount: number;
    nextPaymentDate: string;      // ISO 8601
    frequency: 'weekly' | 'biweekly' | 'monthly';
  };
  merchant?: string;
  // Deposit-specific fields (when category is savings, cd, ira, money_market):
  balance?: number;
  apy?: number;
  maturityDate?: string;          // ISO 8601
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/products" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)"
```

---

#### GET /api/v1/products/:id

Fetch a single product by ID.

**Response: `ProductDetailResponse`**

```typescript
interface ProductDetailResponse {
  product: RawProductData;
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/products/prod-1" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

#### POST /api/v1/products/:id/payments

Submit a payment against a product.

**Request: `PaymentRequest`**

```typescript
interface PaymentRequest {
  amount: number;               // Payment amount in dollars
  sourceAccountId: string;      // Funding source account ID
  scheduledDate?: string;       // ISO 8601, omit for immediate
}
```

**Response: `PaymentResponse`**

```typescript
interface PaymentResponse {
  confirmationId: string;
  status: 'confirmed' | 'pending' | 'failed';
  scheduledDate: string;        // ISO 8601
}
```

**Example:**

```bash
curl -X POST "http://localhost:8080/api/v1/products/prod-1/payments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200.00,
    "sourceAccountId": "bank-acct-001",
    "scheduledDate": "2026-02-20T00:00:00Z"
  }'
```

---

#### GET /api/v1/products/:id/transactions

Fetch transactions for a product with optional filtering.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `from` | string | ISO 8601 start date |
| `to` | string | ISO 8601 end date |
| `limit` | number | Max results (default: 25) |
| `offset` | number | Pagination offset |
| `category` | string | Filter by category |

**Response: `TransactionListResponse`**

```typescript
interface TransactionListResponse {
  transactions: readonly RawTransactionData[];
  total: number;
  hasMore: boolean;
}

interface RawTransactionData {
  id: string;
  date: string;                 // ISO 8601
  description: string;
  merchantName: string;
  amount: number;               // Positive = charge, negative = credit/payment
  category: string;
  status: 'posted' | 'pending' | 'declined';
  disputed: boolean;
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/products/prod-1/transactions?limit=10&from=2026-01-01T00:00:00Z" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

#### GET /api/v1/products/:id/statements

Fetch statement history for a product.

**Response: `StatementListResponse`**

```typescript
interface StatementListResponse {
  statements: readonly RawStatementData[];
}

interface RawStatementData {
  id: string;
  periodStart: string;          // ISO 8601
  periodEnd: string;            // ISO 8601
  closingBalance: number;
  minimumPaymentDue: number;
  paymentDueDate: string;       // ISO 8601
  downloadUrl: string;          // Signed URL for PDF download
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/products/prod-1/statements" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

### 2.2 AI Engine API

#### GET /api/v1/ai/insights

Fetch AI-generated insights for the authenticated user.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `categories` | string | Comma-separated list of `InsightCategory` values |
| `productIds` | string | Comma-separated product IDs |
| `minPriority` | string | Minimum priority: `critical`, `high`, `medium`, `low` |
| `limit` | number | Max results |

**Response: `InsightListResponse`**

```typescript
interface InsightListResponse {
  insights: Insight[];
}

interface Insight {
  id: string;
  category: 'payment_optimization' | 'credit_improvement'
           | 'savings_opportunity' | 'risk_alert'
           | 'promotional_expiry' | 'spending_pattern'
           | 'debt_reduction' | 'product_recommendation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'seen' | 'acted_on' | 'dismissed' | 'expired';
  title: string;
  summary: string;
  explanation: {
    reasoning: string;
    dataPoints: Array<{
      label: string;
      value: string;
      source: string;
    }>;
    confidence: number;          // 0.0 to 1.0
  };
  suggestedActions: Array<{
    id: string;
    type: 'navigate' | 'api_call' | 'schedule'
        | 'dismiss' | 'learn_more' | 'contact_support';
    label: string;
    description: string;
    estimatedImpact?: {
      metric: string;
      currentValue: string;
      projectedValue: string;
      timeframe: string;
    };
    payload: Record<string, unknown>;
  }>;
  relatedProductIds: string[];
  createdAt: string;             // ISO 8601
  expiresAt?: string;            // ISO 8601
  metadata: Record<string, unknown>;
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/ai/insights?minPriority=high&limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

#### GET /api/v1/ai/risk-assessments

Fetch payment risk assessments for all products.

**Response: `RiskAssessmentListResponse`**

```typescript
interface RiskAssessmentListResponse {
  assessments: PaymentRiskAssessment[];
}

interface PaymentRiskAssessment {
  productId: string;
  riskScore: number;             // 0-100, higher = riskier
  missedPaymentProbability: number; // 0.0 to 1.0
  contributingFactors: Array<{
    factor: string;
    direction: 'increasing_risk' | 'decreasing_risk';
    magnitude: 'low' | 'medium' | 'high';
  }>;
  suggestedInterventions: Array<{
    id: string;
    type: string;
    label: string;
    description: string;
    payload: Record<string, unknown>;
  }>;
  assessedAt: string;            // ISO 8601
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/ai/risk-assessments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

#### GET /api/v1/ai/nudges

Fetch behavioral nudges for the current user.

**Response: `NudgeListResponse`**

```typescript
interface NudgeListResponse {
  nudges: BehavioralNudge[];
}

interface BehavioralNudge {
  id: string;
  type: 'payment_reminder' | 'savings_prompt' | 'credit_tip'
      | 'promotional_alert' | 'milestone_celebration' | 'risk_warning';
  trigger: 'time_based' | 'event_based' | 'threshold_based' | 'pattern_based';
  content: {
    headline: string;
    body: string;
    cta?: {
      id: string;
      type: string;
      label: string;
      description: string;
      payload: Record<string, unknown>;
    };
    illustration?: string;
  };
  targetProductIds: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  displayConstraints: {
    maxImpressions: number;
    cooldownHours: number;
    respectDismissals: boolean;
  };
  createdAt: string;             // ISO 8601
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/v1/ai/nudges" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

---

#### POST /api/v1/ai/conversation/messages

Send a message to the AI conversational assistant.

**Request:**

```typescript
interface ConversationMessageRequest {
  message: string;
  context: {
    sessionId: string;
    activeProductId?: string;
    recentInsightIds: string[];
    userIntent?: string;
  };
}
```

**Response: `ConversationMessageResponse`**

```typescript
interface ConversationMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  attachments?: Array<{
    type: 'product_card' | 'chart' | 'transaction' | 'insight' | 'link';
    data: Record<string, unknown>;
  }>;
  actions?: Array<{
    id: string;
    type: string;
    label: string;
    description: string;
    payload: Record<string, unknown>;
  }>;
  timestamp: string;             // ISO 8601
}
```

**Example:**

```bash
curl -X POST "http://localhost:8080/api/v1/ai/conversation/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I reduce my interest charges?",
    "context": {
      "sessionId": "sess-abc-123",
      "activeProductId": "prod-1",
      "recentInsightIds": ["insight-1", "insight-2"]
    }
  }'
```

---

### 2.3 Auth API

#### POST /api/v1/auth/refresh

Refresh the access token using the httpOnly refresh cookie.

This endpoint is called automatically by `AuthService.getToken()` when the in-memory access token expires (5-minute TTL). The refresh token is sent via an httpOnly secure cookie that is attached by the browser automatically when `credentials: 'include'` is set.

**Request:** No body. The refresh token is in the httpOnly cookie.

**Response: `TokenResponse`**

```typescript
interface TokenResponse {
  accessToken: string;           // Short-lived JWT (5 minutes)
  expiresIn: number;             // Seconds until expiry (e.g., 300)
}
```

**Example:**

```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  --cookie "refresh_token=<httponly-cookie-value>"
```

---

## 3. Step-by-Step Integration Guide

### 3.1 Creating a New API Adapter

An adapter implements the `ApiAdapter` interface (or a domain-specific extension like `ProductApiAdapter`). Here is a complete example for a real product API:

```typescript
// src/infrastructure/api/adapters/real-product-adapter.ts

import { z } from 'zod';
import type { ApiClient } from '../api-client';
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
} from '../api-adapter';

// Zod schemas for response validation
const productListSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
  }).passthrough()),
});

const productDetailSchema = z.object({
  product: z.object({
    id: z.string(),
  }).passthrough(),
});

const paymentResponseSchema = z.object({
  confirmationId: z.string(),
  status: z.enum(['confirmed', 'pending', 'failed']),
  scheduledDate: z.string(),
});

const transactionListSchema = z.object({
  transactions: z.array(z.object({ id: z.string() }).passthrough()),
  total: z.number(),
  hasMore: z.boolean(),
});

const statementListSchema = z.object({
  statements: z.array(z.object({
    id: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
  }).passthrough()),
});

export function createRealProductAdapter(client: ApiClient): ProductApiAdapter {
  return {
    id: 'real-product-api',
    name: 'Production Product API',
    version: '1.0.0',
    capabilities: new Set<ProductApiCapability>([
      'fetch_products',
      'fetch_detail',
      'make_payment',
      'fetch_transactions',
      'fetch_statements',
    ]),

    async healthCheck(): Promise<AdapterHealthStatus> {
      const start = performance.now();
      try {
        await client.get('/api/v1/health', z.object({ status: z.string() }));
        return {
          healthy: true,
          latencyMs: performance.now() - start,
        };
      } catch (err) {
        return {
          healthy: false,
          latencyMs: performance.now() - start,
          lastError: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },

    async initialize(): Promise<void> {
      // Perform any setup: validate connectivity, fetch config, etc.
    },

    async dispose(): Promise<void> {
      // Clean up connections if needed
    },

    async fetchProducts(userId: string): Promise<ProductListResponse> {
      const response = await client.get(
        '/api/v1/products',
        productListSchema,
        { userId },
      );
      return response.data as ProductListResponse;
    },

    async fetchProductDetail(productId: string): Promise<ProductDetailResponse> {
      const response = await client.get(
        `/api/v1/products/${productId}`,
        productDetailSchema,
      );
      return response.data as ProductDetailResponse;
    },

    async makePayment(
      productId: string,
      request: PaymentRequest,
    ): Promise<PaymentResponse> {
      const response = await client.post(
        `/api/v1/products/${productId}/payments`,
        paymentResponseSchema,
        request,
      );
      return response.data;
    },

    async fetchTransactions(
      productId: string,
      params: TransactionQueryParams,
    ): Promise<TransactionListResponse> {
      const queryParams: Record<string, string> = {};
      if (params.from) queryParams['from'] = params.from;
      if (params.to) queryParams['to'] = params.to;
      if (params.limit) queryParams['limit'] = String(params.limit);
      if (params.offset) queryParams['offset'] = String(params.offset);
      if (params.category) queryParams['category'] = params.category;

      const response = await client.get(
        `/api/v1/products/${productId}/transactions`,
        transactionListSchema,
        queryParams,
      );
      return response.data as TransactionListResponse;
    },

    async fetchStatements(productId: string): Promise<StatementListResponse> {
      const response = await client.get(
        `/api/v1/products/${productId}/statements`,
        statementListSchema,
      );
      return response.data as StatementListResponse;
    },
  };
}
```

---

### 3.2 Registering an Adapter in the Registry

The `AdapterRegistry` manages adapter lifecycle (creation, caching, disposal). Register your adapter factory at boot time:

```typescript
// src/infrastructure/api/adapters/registry.ts

import { AdapterRegistry } from '../api-adapter';
import type { ProductApiAdapter } from '../api-adapter';
import { createRealProductAdapter } from './real-product-adapter';

// Create a singleton registry for product adapters
export const productAdapterRegistry = new AdapterRegistry<ProductApiAdapter>();

// Register your adapter factory
productAdapterRegistry.register('real-product-api', (client) =>
  createRealProductAdapter(client),
);
```

Then resolve it where needed:

```typescript
// In bootstrap.ts or a service initialization file
const productAdapter = await productAdapterRegistry.resolve(
  'real-product-api',
  apiClient,
);
```

---

### 3.3 Swapping Mock Data for Real API Calls

The transition from mock to real is controlled at the infrastructure level, not in UI code. There are two approaches:

**Approach A: Remove MSW (simplest)**

Stop starting the MSW worker. In development, MSW is started in your app entry point. Comment it out or gate it behind a flag:

```typescript
// src/main.tsx (or wherever MSW is started)

async function startApp() {
  // Only start MSW when no real backend is configured
  if (!import.meta.env.VITE_API_BASE_URL) {
    const { worker } = await import('./test/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  // Boot the application
  const container = await bootstrap();
  // ... render React
}

startApp();
```

Then set `VITE_API_BASE_URL=https://your-api.example.com` in your `.env` file and MSW will not intercept requests.

**Approach B: Selective mocking**

Use MSW's `passthrough()` for endpoints that have real backends while keeping mocks for endpoints still under development:

```typescript
// src/test/mocks/handlers.ts
import { http, passthrough } from 'msw';

export const handlers = [
  // This endpoint is now real -- pass through to the actual server
  http.get('*/api/v1/products', () => passthrough()),

  // This endpoint is still mocked
  http.get('*/api/v1/ai/insights', () => {
    return HttpResponse.json({ insights: [/* ... */] });
  }),
];
```

---

### 3.4 Configuring Environment Variables

Create a `.env.local` file (git-ignored) in the project root:

```bash
# .env.local
VITE_API_BASE_URL=https://api.staging.example.com
VITE_BFF_BASE_URL=https://bff.staging.example.com
```

The config loader in `src/core/config/app-config.ts` reads these at build time and constructs all derived URLs:

```typescript
// Automatically derived from VITE_API_BASE_URL:
api.baseUrl    = "${VITE_API_BASE_URL}/api/v1"
bff.baseUrl    = "${VITE_BFF_BASE_URL}" || "${VITE_API_BASE_URL}"
realtime.wsUrl = "${VITE_API_BASE_URL (with ws:// protocol)}/ws"
realtime.sseUrl = "${VITE_API_BASE_URL}/sse"
```

---

### 3.5 Handling Authentication Tokens

The auth flow is handled by `AuthService` in `src/infrastructure/auth/auth-service.ts`. Here is the token lifecycle:

1. **Access tokens** are short-lived (5 min), stored only in JavaScript memory (never localStorage/sessionStorage).
2. **Refresh tokens** are httpOnly secure cookies set by the BFF. The browser sends them automatically.
3. **Token refresh** is transparent. `ApiClient` calls `getAuthToken()` on every request. If the token is expired or about to expire (within 30 seconds), `AuthService` silently refreshes it.
4. **Concurrent refresh requests** are deduplicated -- multiple API calls waiting for a token will share a single refresh call.
5. **Auth failures** (401/403) trigger `authService.login()` which redirects to the login page.

You do not need to manage tokens manually. The `ApiClient` handles this:

```typescript
const apiClient = createApiClient({
  baseUrl: config.api.baseUrl,
  timeout: config.api.timeout,
  retries: config.api.retries,
  getAuthToken: () => authService.getToken(), // Automatic refresh
  onError: (err) => {
    if (err.isAuthError) {
      authService.login(window.location.pathname);
    }
  },
});
```

If your backend uses a different auth scheme, implement a custom `AuthService` that conforms to the same interface:

```typescript
interface AuthService {
  getToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  login(returnUrl?: string): void;
  logout(): Promise<void>;
  onAuthStateChange(handler: (authenticated: boolean) => void): () => void;
}
```

---

## 4. Environment Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:8080` | Base URL for all API endpoints |
| `VITE_BFF_BASE_URL` | No | Same as `VITE_API_BASE_URL` | Base URL for the Backend-for-Frontend (auth endpoints) |

All `VITE_` prefixed variables are exposed to client-side code at build time by Vite. Never put secrets in `VITE_` variables.

### Environment Files

Vite loads env files in the following order (later files override earlier ones):

| File | Purpose | Git |
|------|---------|-----|
| `.env` | Shared defaults for all environments | Committed |
| `.env.local` | Local developer overrides | Git-ignored |
| `.env.development` | Development-specific defaults | Committed |
| `.env.staging` | Staging-specific defaults | Committed |
| `.env.production` | Production-specific defaults | Committed |

### Example `.env` Files

**.env (committed -- shared defaults)**

```bash
VITE_API_BASE_URL=http://localhost:8080
```

**.env.local (git-ignored -- your personal overrides)**

```bash
VITE_API_BASE_URL=https://api.dev.internal.example.com
VITE_BFF_BASE_URL=https://bff.dev.internal.example.com
```

**.env.production (committed -- production defaults)**

```bash
VITE_API_BASE_URL=https://api.nexus.example.com
VITE_BFF_BASE_URL=https://bff.nexus.example.com
```

### Feature Flags

Feature flags are managed by the `FeatureFlagService` in `src/infrastructure/feature-flags/feature-flag-service.ts`. The current provider is `config` (hardcoded map in `bootstrap.ts`). To integrate a third-party provider like LaunchDarkly or Statsig, implement the `FeatureFlagService` interface:

```typescript
interface FeatureFlagService {
  isEnabled(flag: string, context?: FlagContext): boolean;
  getVariant<T = string>(flag: string, defaultValue: T, context?: FlagContext): T;
  evaluateAll(context?: FlagContext): ReadonlyMap<string, unknown>;
  onFlagChange(flag: string, handler: (value: unknown) => void): () => void;
  trackExposure(flag: string, variant: string): void;
}
```

Current flags defined in bootstrap:

| Flag | Default | Description |
|------|---------|-------------|
| `ai-copilot` | `true` | AI insights and conversation panel |
| `nudge-overlay` | `true` | Behavioral nudge display |
| `credit-health-dashboard` | `true` | Credit health visualization |
| `dispute-ai-triage` | `true` | AI-assisted dispute flow |
| `dark-mode` | `true` | Dark mode theme toggle |
| `payment-ai-suggestions` | `true` | AI-powered payment suggestions |

---

## 5. Testing

### 5.1 Integration Testing with MSW

The project uses MSW for integration tests. The test server is configured in `src/test/mocks/server.ts` and uses the same handlers as the browser worker.

**Setup (already configured in `vitest.config.ts` and `src/test/setup.ts`):**

The test setup file at `src/test/setup.ts` is loaded automatically before all tests.

**Writing an integration test:**

```typescript
// src/domains/accounts/__tests__/product-api.integration.test.ts

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../../infrastructure/api/api-client';
import { z } from 'zod';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Product API Integration', () => {
  const client = createApiClient({
    baseUrl: 'http://localhost:8080/api/v1',
    timeout: 5000,
    retries: 0,
    getAuthToken: async () => 'test-token',
  });

  it('fetches product list', async () => {
    const schema = z.object({
      products: z.array(z.object({ id: z.string() }).passthrough()),
    });

    const response = await client.get('/api/v1/products', schema);
    expect(response.data.products).toHaveLength(2);
    expect(response.data.products[0].id).toBe('prod-1');
  });

  it('handles server errors with retry', async () => {
    let attempts = 0;
    server.use(
      http.get('*/api/v1/products', () => {
        attempts++;
        if (attempts < 2) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ products: [] });
      }),
    );

    const retryClient = createApiClient({
      baseUrl: 'http://localhost:8080/api/v1',
      timeout: 5000,
      retries: 2,
      getAuthToken: async () => 'test-token',
    });

    const schema = z.object({ products: z.array(z.unknown()) });
    const response = await retryClient.get('/api/v1/products', schema);
    expect(response.data.products).toEqual([]);
    expect(attempts).toBe(2);
  });
});
```

**Override handlers for specific test scenarios:**

```typescript
it('shows error state when API returns 403', async () => {
  server.use(
    http.get('*/api/v1/products', () => {
      return HttpResponse.json(
        { message: 'Forbidden', code: 'AUTH_INSUFFICIENT_PERMISSIONS' },
        { status: 403 },
      );
    }),
  );

  // Test that your component renders the error state
});
```

### 5.2 Unit Testing with Mock Adapters

For unit tests that do not need network behavior, create a mock adapter:

```typescript
// src/test/mocks/mock-product-adapter.ts

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
} from '../../infrastructure/api/api-adapter';

export function createMockProductAdapter(
  overrides?: Partial<ProductApiAdapter>,
): ProductApiAdapter {
  return {
    id: 'mock-product-api',
    name: 'Mock Product API',
    version: '1.0.0',
    capabilities: new Set<ProductApiCapability>([
      'fetch_products',
      'fetch_detail',
      'make_payment',
      'fetch_transactions',
      'fetch_statements',
    ]),

    healthCheck: async (): Promise<AdapterHealthStatus> => ({
      healthy: true,
      latencyMs: 1,
    }),

    initialize: async () => {},
    dispose: async () => {},

    fetchProducts: async (): Promise<ProductListResponse> => ({
      products: [
        { id: 'prod-1', category: 'credit_card', displayName: 'Test Card' },
      ],
    }),

    fetchProductDetail: async (id): Promise<ProductDetailResponse> => ({
      product: { id, category: 'credit_card', displayName: 'Test Card' },
    }),

    makePayment: async (_, req): Promise<PaymentResponse> => ({
      confirmationId: 'PAY-test-123',
      status: 'confirmed',
      scheduledDate: new Date().toISOString(),
    }),

    fetchTransactions: async (): Promise<TransactionListResponse> => ({
      transactions: [],
      total: 0,
      hasMore: false,
    }),

    fetchStatements: async (): Promise<StatementListResponse> => ({
      statements: [],
    }),

    // Apply any overrides
    ...overrides,
  };
}
```

Use it in component tests:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '../hooks/use-products';
import { createMockProductAdapter } from '../../../test/mocks/mock-product-adapter';

it('returns product list from adapter', async () => {
  const adapter = createMockProductAdapter();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(
    () => useProducts('user-1', adapter),
    { wrapper },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.products).toHaveLength(1);
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run a specific test file
npx vitest run src/domains/accounts/__tests__/product-api.integration.test.ts
```

---

## 6. Deployment

### 6.1 Vercel (Pre-configured)

The project includes a `vercel.json` configuration:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Set environment variables in the Vercel dashboard under Project Settings > Environment Variables:

- `VITE_API_BASE_URL` = your production API URL
- `VITE_BFF_BASE_URL` = your production BFF URL

### 6.2 Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_BFF_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.nexus.example.com \
  --build-arg VITE_BFF_BASE_URL=https://bff.nexus.example.com \
  -t nexus-app .

docker run -p 3000:80 nexus-app
```

### 6.3 AWS S3 + CloudFront

```bash
# Build
VITE_API_BASE_URL=https://api.nexus.example.com npm run build

# Sync to S3
aws s3 sync dist/ s3://your-nexus-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

Configure CloudFront to return `index.html` for 403/404 errors to support client-side routing.

### 6.4 Generic Static Host

The build output is a static SPA in `dist/`. Any static file server works, provided:

1. All routes fall back to `index.html` (SPA routing).
2. The `assets/` directory is served with long-lived cache headers.
3. `index.html` is served with `Cache-Control: no-cache` to ensure fresh deployments.

Build command:

```bash
npm run build
```

Output directory: `dist/`

---

## Quick Reference

### Integration Checklist

- [ ] Set `VITE_API_BASE_URL` to your backend
- [ ] Set `VITE_BFF_BASE_URL` to your BFF (if different)
- [ ] Implement the auth refresh endpoint (`POST /api/v1/auth/refresh`)
- [ ] Implement the products endpoints
- [ ] Implement the AI engine endpoints
- [ ] Remove or gate the MSW worker start
- [ ] Create adapter implementations with Zod schemas
- [ ] Register adapters in the adapter registry
- [ ] Run the test suite against real API: `npm test`
- [ ] Deploy with environment variables configured

### Error Codes

The `ApiClient` classifies errors automatically:

| Status | Behavior |
|--------|----------|
| 401, 403 | Triggers auth redirect via `onError` callback |
| 429 | Retried with exponential backoff |
| 500+ | Retried with exponential backoff (up to `config.api.retries`) |
| Network error | Retried with exponential backoff |
| Zod validation failure | Throws `SCHEMA_VALIDATION_ERROR` (not retried) |

### Backoff Formula

```
delay = min(1000 * 2^attempt + random(0..500), 30000) ms
```

Retries in production: 3. Retries in development: 1.
