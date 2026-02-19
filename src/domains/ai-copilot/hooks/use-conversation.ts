import { useCallback, useRef, useState } from 'react';
import type { ConversationContext, ConversationMessage } from '../../../core/types/ai';
import type { InsightsEngine } from '../services/insights-engine';

/**
 * Hook for the AI conversational assistant.
 *
 * Manages conversation state, message history, and streaming responses.
 * The conversation is contextual — it knows which product the user is
 * looking at and what insights are active.
 */

interface UseConversationOptions {
  engine: InsightsEngine;
  activeProductId?: string;
  recentInsightIds?: readonly string[];
}

interface ConversationState {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

export function useConversation({ engine, activeProductId, recentInsightIds = [] }: UseConversationOptions) {
  const sessionIdRef = useRef(crypto.randomUUID());

  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: sessionIdRef.current,
  });

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const context: ConversationContext = {
          sessionId: sessionIdRef.current,
          ...(activeProductId !== undefined ? { activeProductId } : {}),
          recentInsightIds: [...recentInsightIds],
        };

        const response = await engine.sendMessage(content, context);

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, response],
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
        }));
      }
    },
    [engine, activeProductId, recentInsightIds],
  );

  const clearConversation = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID();
    setState({
      messages: [],
      isLoading: false,
      error: null,
      sessionId: sessionIdRef.current,
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sessionId: state.sessionId,
    sendMessage,
    clearConversation,
  };
}
