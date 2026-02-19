import { type ReactNode, type CSSProperties, forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

/**
 * Card — the foundational surface component.
 *
 * Used for product cards, insight cards, stat blocks, and containers.
 * Supports elevation levels, interactive states, and padding presets.
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '0',
  sm: '0.75rem',
  md: '1.25rem',
  lg: '1.5rem',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, variant = 'default', padding = 'md', className, style, ...rest },
  ref,
) {
  const variantStyles: CSSProperties = {
    default: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    },
    outlined: {
      backgroundColor: 'transparent',
      border: '1px solid var(--color-border)',
    },
    elevated: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-lg)',
    },
    interactive: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer',
      transition: 'box-shadow 150ms ease, border-color 150ms ease',
    },
  }[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: paddingMap[padding],
        ...variantStyles,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
});
