import { describe, it, expect } from 'vitest';
import {
  isCreditProduct,
  isInstallmentProduct,
  isDepositProduct,
  type CreditProduct,
  type InstallmentProduct,
  type DepositProduct,
} from './product';

describe('Product type guards', () => {
  const baseCreditProduct: CreditProduct = {
    id: '1',
    externalId: 'ext-1',
    category: 'credit_card',
    status: 'active',
    displayName: 'Test Card',
    issuer: 'Synchrony',
    partner: { id: 'p1', name: 'Partner', logoUrl: '', category: 'retail' },
    capabilities: new Set(['make_payment']),
    openedAt: new Date(),
    metadata: {},
    creditLimit: 10000,
    currentBalance: 2000,
    availableCredit: 8000,
    apr: { purchase: 24.99, cashAdvance: 29.99 },
    minimumPaymentDue: 50,
    paymentDueDate: new Date(),
    lastFourDigits: '1234',
  };

  const baseInstallmentProduct: InstallmentProduct = {
    id: '2',
    externalId: 'ext-2',
    category: 'bnpl',
    status: 'active',
    displayName: 'Test BNPL',
    issuer: 'Synchrony',
    partner: { id: 'p2', name: 'Partner 2', logoUrl: '', category: 'retail' },
    capabilities: new Set(['make_payment']),
    openedAt: new Date(),
    metadata: {},
    originalAmount: 1000,
    remainingBalance: 500,
    installments: {
      total: 4,
      completed: 2,
      remaining: 2,
      nextPaymentAmount: 250,
      nextPaymentDate: new Date(),
      frequency: 'monthly',
    },
    merchant: 'Test Merchant',
  };

  const baseDepositProduct: DepositProduct = {
    id: '3',
    externalId: 'ext-3',
    category: 'savings',
    status: 'active',
    displayName: 'High Yield Savings',
    issuer: 'Synchrony Bank',
    partner: { id: 'p3', name: 'Synchrony Bank', logoUrl: '', category: 'banking' },
    capabilities: new Set(),
    openedAt: new Date(),
    metadata: {},
    balance: 25000,
    apy: 5.05,
  };

  it('isCreditProduct should identify credit products', () => {
    expect(isCreditProduct(baseCreditProduct)).toBe(true);
    expect(isCreditProduct(baseInstallmentProduct)).toBe(false);
    expect(isCreditProduct(baseDepositProduct)).toBe(false);
  });

  it('isInstallmentProduct should identify BNPL products', () => {
    expect(isInstallmentProduct(baseInstallmentProduct)).toBe(true);
    expect(isInstallmentProduct(baseCreditProduct)).toBe(false);
    expect(isInstallmentProduct(baseDepositProduct)).toBe(false);
  });

  it('isDepositProduct should identify deposit products', () => {
    expect(isDepositProduct(baseDepositProduct)).toBe(true);
    expect(isDepositProduct(baseCreditProduct)).toBe(false);
    expect(isDepositProduct(baseInstallmentProduct)).toBe(false);
  });

  it('should identify CareCredit as credit product', () => {
    const careCredit = { ...baseCreditProduct, category: 'care_credit' as const };
    expect(isCreditProduct(careCredit)).toBe(true);
  });

  it('should identify installment_loan as installment product', () => {
    const installmentLoan = { ...baseInstallmentProduct, category: 'installment_loan' as const };
    expect(isInstallmentProduct(installmentLoan)).toBe(true);
  });
});
