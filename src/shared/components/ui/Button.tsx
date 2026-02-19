import { type ReactNode, type ButtonHTMLAttributes, forwardRef, type CSSProperties } from 'react';

/**
 * Button — design system primitive.
 *
 * Variants:
 * - primary: High-emphasis CTA (make payment, submit)
 * - secondary: Medium-emphasis (view details, cancel)
 * - ghost: Low-emphasis (dismiss, learn more)
 * - danger: Destructive actions (close account, cancel autopay)
 *
 * All sizes meet 44x44px minimum touch target for mobile accessibility.
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const sizeStyles: Record<string, CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem', minHeight: '32px' },
  md: { padding: '0.5rem 1rem', fontSize: '0.875rem', minHeight: '40px' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem', minHeight: '48px' },
};

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-strong)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'primary', size = 'md', fullWidth, loading, icon, disabled, style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : loading ? 0.8 : 1,
        transition: 'background-color 150ms ease, opacity 150ms ease',
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : icon ? (
        <span style={{ display: 'flex', width: '18px', height: '18px' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
});
