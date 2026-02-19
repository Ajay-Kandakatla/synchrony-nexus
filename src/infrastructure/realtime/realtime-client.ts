import type { AppEvent, EventBus } from '../../core/types/events';

/**
 * Real-time client — bridges server-pushed events into the client event bus.
 *
 * Supports both WebSocket and SSE with automatic fallback.
 * Server events invalidate React Query caches and update Zustand stores
 * through the shared event bus.
 *
 * Connection lifecycle:
 * 1. Attempt WebSocket connection
 * 2. On failure, fall back to SSE
 * 3. Exponential backoff reconnection
 * 4. Heartbeat monitoring
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface RealtimeConfig {
  wsUrl: string;
  sseUrl: string;
  heartbeatIntervalMs: number;
  maxReconnectAttempts: number;
  getAuthToken: () => Promise<string | null>;
}

export interface RealtimeClient {
  connect(): Promise<void>;
  disconnect(): void;
  getStatus(): ConnectionStatus;
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createRealtimeClient(
  config: RealtimeConfig,
  eventBus: EventBus,
): RealtimeClient {
  let status: ConnectionStatus = 'disconnected';
  let ws: WebSocket | null = null;
  let sse: EventSource | null = null;
  let reconnectAttempts = 0;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  const statusHandlers = new Set<(status: ConnectionStatus) => void>();

  function setStatus(newStatus: ConnectionStatus) {
    status = newStatus;
    for (const handler of statusHandlers) {
      handler(newStatus);
    }
  }

  async function connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        ws = new WebSocket(config.wsUrl);

        ws.onopen = () => {
          setStatus('connected');
          reconnectAttempts = 0;
          startHeartbeat();
          resolve(true);
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data as string) as AppEvent;
            eventBus.publish(parsed);
          } catch {
            console.warn('[Realtime] Failed to parse WebSocket message');
          }
        };

        ws.onclose = () => {
          stopHeartbeat();
          if (status !== 'disconnected') {
            attemptReconnect();
          }
        };

        ws.onerror = () => {
          ws?.close();
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  function connectSSE(): void {
    sse = new EventSource(config.sseUrl);

    sse.onopen = () => {
      setStatus('connected');
      reconnectAttempts = 0;
    };

    sse.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string) as AppEvent;
        eventBus.publish(parsed);
      } catch {
        console.warn('[Realtime] Failed to parse SSE message');
      }
    };

    sse.onerror = () => {
      sse?.close();
      if (status !== 'disconnected') {
        attemptReconnect();
      }
    };
  }

  function attemptReconnect() {
    if (reconnectAttempts >= config.maxReconnectAttempts) {
      setStatus('error');
      return;
    }

    setStatus('reconnecting');
    reconnectAttempts++;

    const backoffMs = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
    setTimeout(async () => {
      const wsConnected = await connectWebSocket();
      if (!wsConnected) {
        connectSSE();
      }
    }, backoffMs);
  }

  function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, config.heartbeatIntervalMs);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  return {
    async connect() {
      setStatus('connecting');
      const wsConnected = await connectWebSocket();
      if (!wsConnected) {
        connectSSE();
      }
    },

    disconnect() {
      setStatus('disconnected');
      stopHeartbeat();
      ws?.close();
      sse?.close();
      ws = null;
      sse = null;
    },

    getStatus() {
      return status;
    },

    onStatusChange(handler) {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    },
  };
}
