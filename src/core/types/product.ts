/**
 * Core product type system.
 *
 * Every financial product in the Nexus ecosystem implements BaseProduct.
 * The plugin system registers product types at runtime, and the capability
 * system determines what UI surfaces and actions are available for each.
 */

// ---------------------------------------------------------------------------
// Product taxonomy
// ---------------------------------------------------------------------------

export type ProductCategory =
  | 'credit_card'
  | 'bnpl'
  | 'savings'
  | 'cd'
  | 'ira'
  | 'money_market'
  | 'installment_loan'
  | 'care_credit'
  | 'promotional_financing';

export type ProductStatus =
  | 'active'
  | 'pending_activation'
  | 'suspended'
  | 'closed'
  | 'delinquent'
  | 'charged_off';

// ---------------------------------------------------------------------------
// Capability system — drives UI rendering & action availability
// ---------------------------------------------------------------------------

export type ProductCapability =
  | 'make_payment'
  | 'view_statements'
  | 'dispute_transaction'
  | 'request_credit_increase'
  | 'set_autopay'
  | 'manage_alerts'
  | 'view_rewards'
  | 'transfer_balance'
  | 'lock_card'
  | 'replace_card'
  | 'manage_authorized_users'
  | 'view_offers'
  | 'export_data'
  | 'chat_support'
  | 'schedule_payment'
  | 'view_interest_breakdown'
  | 'restructure_plan';

// ---------------------------------------------------------------------------
// Base product interface — all products implement this
// ---------------------------------------------------------------------------

export interface BaseProduct {
  readonly id: string;
  readonly externalId: string;
  readonly category: ProductCategory;
  readonly status: ProductStatus;
  readonly displayName: string;
  readonly issuer: string;
  readonly partner: ProductPartner;
  readonly capabilities: ReadonlySet<ProductCapability>;
  readonly openedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ProductPartner {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly category: string;
}

// ---------------------------------------------------------------------------
// Credit product extension
// ---------------------------------------------------------------------------

export interface CreditProduct extends BaseProduct {
  readonly category: 'credit_card' | 'care_credit';
  readonly creditLimit: number;
  readonly currentBalance: number;
  readonly availableCredit: number;
  readonly apr: AprInfo;
  readonly minimumPaymentDue: number;
  readonly paymentDueDate: Date;
  readonly lastFourDigits: string;
  readonly rewardsBalance?: RewardsBalance;
}

export interface AprInfo {
  readonly purchase: number;
  readonly cashAdvance: number;
  readonly penalty?: number;
  readonly promotional?: PromotionalApr;
}

export interface PromotionalApr {
  readonly rate: number;
  readonly expiresAt: Date;
  readonly remainingBalance: number;
}

export interface RewardsBalance {
  readonly type: 'cashback' | 'points' | 'miles';
  readonly value: number;
  readonly displayValue: string;
}

// ---------------------------------------------------------------------------
// BNPL / Installment product extension
// ---------------------------------------------------------------------------

export interface InstallmentProduct extends BaseProduct {
  readonly category: 'bnpl' | 'installment_loan';
  readonly originalAmount: number;
  readonly remainingBalance: number;
  readonly installments: InstallmentSchedule;
  readonly merchant: string;
}

export interface InstallmentSchedule {
  readonly total: number;
  readonly completed: number;
  readonly remaining: number;
  readonly nextPaymentAmount: number;
  readonly nextPaymentDate: Date;
  readonly frequency: 'weekly' | 'biweekly' | 'monthly';
}

// ---------------------------------------------------------------------------
// Savings / deposit product extension
// ---------------------------------------------------------------------------

export interface DepositProduct extends BaseProduct {
  readonly category: 'savings' | 'cd' | 'ira' | 'money_market';
  readonly balance: number;
  readonly apy: number;
  readonly maturityDate?: Date;
  readonly earlyWithdrawalPenalty?: number;
}

// ---------------------------------------------------------------------------
// Union type for all products
// ---------------------------------------------------------------------------

export type Product = CreditProduct | InstallmentProduct | DepositProduct;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCreditProduct(p: BaseProduct): p is CreditProduct {
  return p.category === 'credit_card' || p.category === 'care_credit';
}

export function isInstallmentProduct(p: BaseProduct): p is InstallmentProduct {
  return p.category === 'bnpl' || p.category === 'installment_loan';
}

export function isDepositProduct(p: BaseProduct): p is DepositProduct {
  return (
    p.category === 'savings' ||
    p.category === 'cd' ||
    p.category === 'ira' ||
    p.category === 'money_market'
  );
}
