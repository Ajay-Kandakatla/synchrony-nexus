/**
 * PII boundary — ensures sensitive data never leaks into unsafe contexts.
 *
 * This module enforces the principle that PII is a "hot potato":
 * - It arrives from the API already masked where possible
 * - Any PII that must be displayed is wrapped in a boundary
 * - PII is NEVER written to localStorage, sessionStorage, or cookies
 * - PII is NEVER included in telemetry events
 * - PII is NEVER logged to the console in production
 * - PII is NEVER included in URL parameters
 *
 * The boundary provides display-only access with auditing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PIIType =
  | 'ssn'
  | 'account_number'
  | 'routing_number'
  | 'card_number'
  | 'cvv'
  | 'dob'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'address';

interface PIIField<T = string> {
  /** The actual value — only accessible through controlled display */
  readonly value: T;
  /** What type of PII this is */
  readonly type: PIIType;
  /** Pre-masked version safe for display in most contexts */
  readonly masked: string;
  /** Audit: when this PII was accessed */
  readonly accessLog: PIIAccessEntry[];
}

interface PIIAccessEntry {
  readonly timestamp: Date;
  readonly context: string;
  readonly action: 'display' | 'copy' | 'submit';
}

// ---------------------------------------------------------------------------
// PII Container
// ---------------------------------------------------------------------------

export class PIIContainer<T = string> {
  private readonly _value: T;
  private readonly _type: PIIType;
  private readonly _masked: string;
  private readonly _accessLog: PIIAccessEntry[] = [];

  constructor(value: T, type: PIIType, masked: string) {
    this._value = value;
    this._type = type;
    this._masked = masked;

    // Freeze to prevent mutation
    Object.freeze(this);
  }

  /** Get the masked version (safe for general display) */
  get masked(): string {
    return this._masked;
  }

  /** Get the full value (audited, for authorized display only) */
  reveal(context: string): T {
    this._accessLog.push({
      timestamp: new Date(),
      context,
      action: 'display',
    });
    return this._value;
  }

  /** Get the PII type */
  get type(): PIIType {
    return this._type;
  }

  /** Prevent accidental stringification */
  toString(): string {
    return this._masked;
  }

  /** Prevent accidental JSON serialization */
  toJSON(): string {
    return this._masked;
  }

  /** Get access audit trail */
  get auditTrail(): readonly PIIAccessEntry[] {
    return [...this._accessLog];
  }
}

// ---------------------------------------------------------------------------
// Factory functions for common PII types
// ---------------------------------------------------------------------------

export function maskCardNumber(fullNumber: string): PIIContainer {
  const last4 = fullNumber.slice(-4);
  return new PIIContainer(fullNumber, 'card_number', `****${last4}`);
}

export function maskAccountNumber(fullNumber: string): PIIContainer {
  const last4 = fullNumber.slice(-4);
  return new PIIContainer(fullNumber, 'account_number', `****${last4}`);
}

export function maskSSN(ssn: string): PIIContainer {
  const last4 = ssn.slice(-4);
  return new PIIContainer(ssn, 'ssn', `***-**-${last4}`);
}

export function maskEmail(email: string): PIIContainer {
  const [local, domain] = email.split('@');
  if (!local || !domain) return new PIIContainer(email, 'email', '***@***');
  const maskedLocal = local[0] + '***';
  return new PIIContainer(email, 'email', `${maskedLocal}@${domain}`);
}

export function maskPhone(phone: string): PIIContainer {
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return new PIIContainer(phone, 'phone', `(***) ***-${last4}`);
}

// ---------------------------------------------------------------------------
// Storage guard — prevents PII from entering unsafe storage
// ---------------------------------------------------------------------------

const UNSAFE_STORAGE_APIS = ['localStorage', 'sessionStorage'] as const;

export function installStorageGuard(): void {
  if (typeof window === 'undefined') return;

  for (const apiName of UNSAFE_STORAGE_APIS) {
    const original = window[apiName];
    const originalSetItem = original.setItem.bind(original);

    original.setItem = (key: string, value: string) => {
      if (containsPIIPattern(value)) {
        console.error(
          `[PIIBoundary] Blocked attempt to write PII to ${apiName}.${key}`,
        );
        return;
      }
      originalSetItem(key, value);
    };
  }
}

function containsPIIPattern(value: string): boolean {
  const patterns = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // card number
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN
    /\b\d{9,12}\b/, // account number (rough)
  ];
  return patterns.some((p) => p.test(value));
}
