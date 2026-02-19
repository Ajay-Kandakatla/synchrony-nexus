/**
 * Dispute domain types.
 *
 * The dispute system is AI-triaged: when a user initiates a dispute,
 * the AI classifies the type, pre-fills the form, estimates resolution
 * time, and tracks status in real-time.
 */

export type DisputeStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_needed'
  | 'provisional_credit_issued'
  | 'resolved_in_favor'
  | 'resolved_against'
  | 'withdrawn';

export type DisputeCategory =
  | 'unauthorized_transaction'
  | 'duplicate_charge'
  | 'incorrect_amount'
  | 'merchandise_not_received'
  | 'merchandise_defective'
  | 'subscription_cancelled'
  | 'billing_error'
  | 'other';

export type DisputePriority = 'standard' | 'expedited';

export interface Dispute {
  readonly id: string;
  readonly productId: string;
  readonly transactionId: string;
  readonly status: DisputeStatus;
  readonly category: DisputeCategory;
  readonly amount: number;
  readonly merchantName: string;
  readonly description: string;
  readonly priority: DisputePriority;
  readonly aiClassification: AIDisputeClassification;
  readonly timeline: readonly DisputeTimelineEntry[];
  readonly documents: readonly DisputeDocument[];
  readonly provisionalCredit?: number;
  readonly estimatedResolutionDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AIDisputeClassification {
  readonly suggestedCategory: DisputeCategory;
  readonly confidence: number;
  readonly reasoning: string;
  readonly suggestedDescription: string;
  readonly estimatedResolutionDays: number;
  readonly likelyOutcome: 'favorable' | 'uncertain' | 'unfavorable';
  readonly requiredDocuments: readonly string[];
}

export interface DisputeTimelineEntry {
  readonly id: string;
  readonly status: DisputeStatus;
  readonly description: string;
  readonly timestamp: Date;
  readonly actor: 'user' | 'system' | 'analyst';
}

export interface DisputeDocument {
  readonly id: string;
  readonly name: string;
  readonly type: 'receipt' | 'screenshot' | 'correspondence' | 'other';
  readonly uploadedAt: Date;
  readonly sizeBytes: number;
}

export interface DisputeCreateRequest {
  productId: string;
  transactionId: string;
  category: DisputeCategory;
  description: string;
  amount: number;
}

export interface Transaction {
  readonly id: string;
  readonly productId: string;
  readonly date: Date;
  readonly description: string;
  readonly merchantName: string;
  readonly amount: number;
  readonly category: string;
  readonly status: 'posted' | 'pending' | 'declined';
  readonly disputed: boolean;
}
