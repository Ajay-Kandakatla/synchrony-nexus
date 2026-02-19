/**
 * Marketplace domain types.
 *
 * The marketplace surfaces partner offers, deals, and financing options.
 * Tightly integrated with the AI engine for personalized recommendations.
 */

export type OfferCategory =
  | 'electronics'
  | 'home_improvement'
  | 'automotive'
  | 'healthcare'
  | 'jewelry'
  | 'furniture'
  | 'outdoor'
  | 'travel'
  | 'retail'
  | 'services';

export type OfferStatus = 'active' | 'expiring_soon' | 'expired' | 'coming_soon';

export interface MarketplaceOffer {
  readonly id: string;
  readonly partnerId: string;
  readonly partnerName: string;
  readonly partnerLogoUrl: string;
  readonly category: OfferCategory;
  readonly status: OfferStatus;
  readonly title: string;
  readonly description: string;
  readonly terms: string;
  readonly financingDetails: FinancingDetails;
  readonly expiresAt?: Date;
  readonly featured: boolean;
  readonly personalizedScore?: number; // 0-100, AI-generated relevance score
}

export interface FinancingDetails {
  readonly type: 'deferred_interest' | 'reduced_apr' | 'equal_pay' | 'no_interest';
  readonly promotionalPeriodMonths: number;
  readonly minimumPurchase?: number;
  readonly apr?: number;
}

export interface MarketplacePartner {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly category: OfferCategory;
  readonly description: string;
  readonly storeCount?: number;
  readonly websiteUrl: string;
  readonly activeOfferCount: number;
}

export interface MarketplaceSearchParams {
  query?: string;
  category?: OfferCategory;
  featured?: boolean;
  sortBy?: 'relevance' | 'expiring_soon' | 'newest';
  limit?: number;
  offset?: number;
}
