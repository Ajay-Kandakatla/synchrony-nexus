import { type ReactNode, useState, useRef, useEffect } from 'react';
import type { ConversationMessage, SuggestedAction } from '../../../core/types/ai';
import { Button } from '../../../shared/components/ui/Button';

/**
 * ConversationPanel — the AI copilot chat interface.
 *
 * This is NOT a generic chatbot. It's a contextual assistant that:
 * - Knows which product the user is viewing
 * - Can reference active insights
 * - Renders structured responses (cards, charts, action buttons)
 * - Supports quick-action chips for common intents
 *
 * UX: Slide-in panel from the right (desktop) or bottom sheet (mobile).
 */

interface ConversationPanelProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClear: () => void;
  onActionClick?: (action: SuggestedAction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const quickPrompts = [
  'How can I pay less interest?',
  'What are my upcoming payments?',
  'Help me improve my credit score',
  'Show me my spending patterns',
];

export function ConversationPanel({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClear,
  onActionClick,
  isOpen,
  onClose,
}: ConversationPanelProps): ReactNode {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="AI Assistant"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        maxWidth: '100vw',
        height: '100vh',
        backgroundColor: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 300,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Financial Co-Pilot</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            AI-powered financial assistant
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onClear}
            aria-label="Clear conversation"
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                How can I help?
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>
                Ask me anything about your accounts
              </p>
            </div>

            {/* Quick prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
              }}
            >
              {msg.content}

              {/* Inline actions from assistant */}
              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.75rem' }}>
                  {msg.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant="secondary"
                      size="sm"
                      onClick={() => onActionClick?.(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px 12px 12px 4px',
                backgroundColor: 'var(--color-bg)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error-text)',
              fontSize: '0.75rem',
            }}
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          aria-label="Message input"
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
        <Button type="submit" variant="primary" size="md" disabled={!input.trim() || isLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </Button>
      </form>
    </div>
  );
}
