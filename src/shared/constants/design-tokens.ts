/**
 * Design tokens — the single source of truth for visual design.
 *
 * These tokens are consumed by CSS custom properties and directly
 * by components. The theme engine swaps token sets for dark mode
 * and partner white-labeling.
 */

export const tokens = {
  color: {
    // Primary palette
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Semantic colors
    success: { light: '#dcfce7', main: '#16a34a', dark: '#15803d' },
    warning: { light: '#fef3c7', main: '#d97706', dark: '#b45309' },
    error: { light: '#fef2f2', main: '#dc2626', dark: '#991b1b' },
    info: { light: '#eff6ff', main: '#2563eb', dark: '#1e40af' },

    // Neutral scale
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Risk-adaptive colors
    risk: {
      low: '#16a34a',
      moderate: '#d97706',
      elevated: '#ea580c',
      high: '#dc2626',
    },

    // Utilization gradient
    utilization: {
      healthy: '#16a34a',    // 0-30%
      moderate: '#ca8a04',   // 30-50%
      elevated: '#ea580c',   // 50-75%
      critical: '#dc2626',   // 75-100%
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
  },

  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04)',
    xl: '0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.04)',
  },

  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  transition: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },

  zIndex: {
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
  },
} as const;

export type DesignTokens = typeof tokens;
