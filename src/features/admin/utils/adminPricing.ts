/** Prix catalogue — défauts locaux ; override via `platform_config.club_pricing`. */
export const DEFAULT_PRICE_PER_MEMBER_EUR = 3;
export const PROMO_PRICE_PER_MEMBER_EUR = 2.8;
export const STANDARD_PRICE_PER_MEMBER_EUR = 3.5;

export type ClubPricingRates = {
  min_per_member_eur: number;
  standard_per_member_eur: number;
  promo_per_member_eur: number;
};

export const DEFAULT_CLUB_PRICING: ClubPricingRates = {
  min_per_member_eur: DEFAULT_PRICE_PER_MEMBER_EUR,
  standard_per_member_eur: STANDARD_PRICE_PER_MEMBER_EUR,
  promo_per_member_eur: PROMO_PRICE_PER_MEMBER_EUR,
};

export function normalizeClubPricing(
  input?: Partial<ClubPricingRates> | null,
): ClubPricingRates {
  return {
    min_per_member_eur: Math.max(
      0,
      Number(input?.min_per_member_eur ?? DEFAULT_CLUB_PRICING.min_per_member_eur),
    ),
    standard_per_member_eur: Math.max(
      0,
      Number(input?.standard_per_member_eur ?? DEFAULT_CLUB_PRICING.standard_per_member_eur),
    ),
    promo_per_member_eur: Math.max(
      0,
      Number(input?.promo_per_member_eur ?? DEFAULT_CLUB_PRICING.promo_per_member_eur),
    ),
  };
}
