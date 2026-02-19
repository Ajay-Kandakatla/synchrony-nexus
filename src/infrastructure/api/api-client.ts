import { z } from 'zod';

/**
 * API client abstraction layer.
 *
 * This is NOT a fetch wrapper. It's an adapter-pattern API client that:
 * 1. Enforces typed request/response contracts via Zod schemas
 * 2. Provides automatic retry with exponential backoff
 * 3. Supports request deduplication
 * 4. Integrates with the auth token lifecycle
 * 5. Emits observability hooks
 *
 * Every domain service talks to the backend through this layer.
 * Partner-specific APIs are integrated via adapters that implement
 * the same interface.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
  onRequest?: (req: ApiRequest) => ApiRequest;
  onResponse?: (res: ApiResponse<unknown>) => void;
  onError?: (err: ApiError) => void;
  getAuthToken: () => Promise<string | null>;
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  deduplicate?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
  latencyMs: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createApiClient(config: ApiClientConfig) {
  const inflight = new Map<string, Promise<ApiResponse<unknown>>>();

  async function request<T>(
    req: ApiRequest,
    responseSchema: z.ZodType<T>,
  ): Promise<ApiResponse<T>> {
    // Deduplication for GET requests
    const dedupeKey = req.deduplicate ? `${req.method}:${req.path}:${JSON.stringify(req.params)}` : null;
    if (dedupeKey && inflight.has(dedupeKey)) {
      const existing = await inflight.get(dedupeKey)!;
      return existing as ApiResponse<T>;
    }

    const processedReq = config.onRequest ? config.onRequest(req) : req;
    const promise = executeWithRetry(processedReq, responseSchema, config.retries);

    if (dedupeKey) {
      inflight.set(dedupeKey, promise as Promise<ApiResponse<unknown>>);
      promise.finally(() => inflight.delete(dedupeKey));
    }

    return promise;
  }

  async function executeWithRetry<T>(
    req: ApiRequest,
    schema: z.ZodType<T>,
    retriesLeft: number,
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();

    try {
      const token = await config.getAuthToken();
      const url = buildUrl(config.baseUrl, req.path, req.params);

      const response = await fetch(url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...config.headers,
          ...req.headers,
        },
        body: req.body ? JSON.stringify(req.body) : null,
        signal: req.signal ?? AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const apiError = new ApiError(
          (errorBody as { message?: string }).message ?? `HTTP ${response.status}`,
          response.status,
          (errorBody as { code?: string }).code ?? 'UNKNOWN',
          requestId,
          errorBody,
        );

        if (apiError.isRetryable && retriesLeft > 0) {
          await delay(getBackoffMs(config.retries - retriesLeft));
          return executeWithRetry(req, schema, retriesLeft - 1);
        }

        config.onError?.(apiError);
        throw apiError;
      }

      const raw = await response.json();
      const parsed = schema.parse(raw);

      const apiResponse: ApiResponse<T> = {
        data: parsed,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        requestId,
        latencyMs: performance.now() - startTime,
      };

      config.onResponse?.(apiResponse as ApiResponse<unknown>);
      return apiResponse;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof z.ZodError) {
        const apiError = new ApiError(
          'Response validation failed',
          0,
          'SCHEMA_VALIDATION_ERROR',
          requestId,
          err.issues,
        );
        config.onError?.(apiError);
        throw apiError;
      }
      // Network / timeout errors
      if (retriesLeft > 0) {
        await delay(getBackoffMs(config.retries - retriesLeft));
        return executeWithRetry(req, schema, retriesLeft - 1);
      }
      const apiError = new ApiError(
        (err as Error).message ?? 'Network error',
        0,
        'NETWORK_ERROR',
        requestId,
      );
      config.onError?.(apiError);
      throw apiError;
    }
  }

  return {
    get: <T>(path: string, schema: z.ZodType<T>, params?: Record<string, string>) =>
      request({ method: 'GET', path, ...(params !== undefined ? { params } : {}), deduplicate: true }, schema),

    post: <T>(path: string, schema: z.ZodType<T>, body?: unknown) =>
      request({ method: 'POST', path, body }, schema),

    put: <T>(path: string, schema: z.ZodType<T>, body?: unknown) =>
      request({ method: 'PUT', path, body }, schema),

    patch: <T>(path: string, schema: z.ZodType<T>, body?: unknown) =>
      request({ method: 'PATCH', path, body }, schema),

    delete: <T>(path: string, schema: z.ZodType<T>) =>
      request({ method: 'DELETE', path }, schema),

    raw: request,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrl(base: string, path: string, params?: Record<string, string>): string {
  const url = new URL(path, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function getBackoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt + Math.random() * 500, 30_000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Type export for adapters
// ---------------------------------------------------------------------------

export type ApiClient = ReturnType<typeof createApiClient>;
