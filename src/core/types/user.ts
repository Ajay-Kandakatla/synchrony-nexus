/**
 * User & identity types.
 *
 * The user model is thin on the frontend — PII stays server-side.
 * We only hold what's needed for personalization and UI rendering.
 */

export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly email: string; // masked on the client, e.g. a***@example.com
  readonly preferences: UserPreferences;
  readonly riskProfile: RiskProfile;
  readonly financialHealthScore: FinancialHealthScore;
  readonly createdAt: Date;
}

export interface UserPreferences {
  readonly locale: string;
  readonly timezone: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly notificationChannels: ReadonlySet<NotificationChannel>;
  readonly dashboardLayout: DashboardLayout;
  readonly accessibilitySettings: AccessibilitySettings;
}

export type NotificationChannel = 'push' | 'sms' | 'email' | 'in_app';

export type DashboardLayout = 'default' | 'compact' | 'detailed';

export interface AccessibilitySettings {
  readonly reduceMotion: boolean;
  readonly highContrast: boolean;
  readonly fontSize: 'default' | 'large' | 'extra_large';
  readonly screenReaderOptimized: boolean;
}

// ---------------------------------------------------------------------------
// Risk & health scoring — drives adaptive UI
// ---------------------------------------------------------------------------

export type RiskTier = 'low' | 'moderate' | 'elevated' | 'high';

export interface RiskProfile {
  readonly tier: RiskTier;
  readonly factors: readonly RiskFactor[];
  readonly lastAssessedAt: Date;
}

export interface RiskFactor {
  readonly code: string;
  readonly description: string;
  readonly impact: 'positive' | 'negative' | 'neutral';
  readonly weight: number;
}

export interface FinancialHealthScore {
  readonly overall: number; // 0-100
  readonly dimensions: FinancialHealthDimensions;
  readonly trend: 'improving' | 'stable' | 'declining';
  readonly lastUpdatedAt: Date;
}

export interface FinancialHealthDimensions {
  readonly utilization: number; // 0-100
  readonly paymentHistory: number;
  readonly accountAge: number;
  readonly productMix: number;
  readonly savingsRate: number;
}
