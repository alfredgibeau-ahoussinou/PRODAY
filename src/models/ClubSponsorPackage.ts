/**
 * Micro-sponsoring club — packages configurables, sans promesse de visibilité fictive.
 */

export type ClubSponsorPackageScope =
  | 'club'
  | 'match'
  | 'team'
  | 'tournament'
  | 'day'
  | 'event';

export type ClubSponsorVisibilitySlot =
  | 'match_page_logo'
  | 'live_score_logo'
  | 'match_summary'
  | 'sponsor_message'
  | 'tournament_page';

export interface ClubSponsorPackage {
  id: string;
  club_id: string;
  label: string;
  scope: ClubSponsorPackageScope;
  /** Montant configurable par le club (centimes). */
  price_cents: number;
  /** Uniquement des slots techniquement disponibles. */
  visibility_slots: ClubSponsorVisibilitySlot[];
  active: boolean;
  created_at: Date;
}

export interface ClubSponsorCampaignStub {
  id: string;
  club_id: string;
  package_id: string;
  sponsor_name: string;
  status: 'draft' | 'pending_club_validation' | 'active' | 'ended';
  /** Paiement via prestataire — jamais de redistribution auto arbitraire. */
  payment_status: 'unpaid' | 'pending_provider' | 'paid' | 'refunded';
}

export const CLUB_SPONSOR_PAYMENT_NOTICE =
  'Les flux financiers passent par un prestataire conforme lorsque la fonctionnalité est activée. Le club définit bénéficiaire, règles et validation. Aucune redistribution automatique arbitraire.';

export function defaultMatchSponsorPackage(clubId: string, priceCents = 2000): ClubSponsorPackage {
  return {
    id: `pkg_match_${clubId}`,
    club_id: clubId,
    label: 'Sponsor match',
    scope: 'match',
    price_cents: priceCents,
    visibility_slots: ['match_page_logo', 'match_summary', 'sponsor_message'],
    active: true,
    created_at: new Date(),
  };
}
