/**
 * Marketplace équipement club — règles mineurs, paiement, validation.
 */

export type EquipmentListingKind = 'sell' | 'give' | 'wanted';
export type EquipmentCondition = 'new' | 'very_good' | 'good' | 'used';

export type EquipmentCategory =
  | 'crampons'
  | 'survetement'
  | 'maillot'
  | 'gants'
  | 'protege_tibias'
  | 'ballon'
  | 'sac'
  | 'autre';

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory; label: string }[] = [
  { id: 'crampons', label: 'Crampons' },
  { id: 'survetement', label: 'Survêtement' },
  { id: 'maillot', label: 'Maillot' },
  { id: 'gants', label: 'Gants' },
  { id: 'protege_tibias', label: 'Protège-tibias' },
  { id: 'ballon', label: 'Ballon' },
  { id: 'sac', label: 'Sac' },
  { id: 'autre', label: 'Autre' },
];

export const EQUIPMENT_CONDITIONS: { id: EquipmentCondition; label: string }[] = [
  { id: 'new', label: 'Neuf' },
  { id: 'very_good', label: 'Très bon' },
  { id: 'good', label: 'Bon' },
  { id: 'used', label: 'Usé' },
];

export interface EquipmentListingFilter {
  category?: EquipmentCategory;
  condition?: EquipmentCondition;
  kind?: EquipmentListingKind;
  maxPriceCents?: number;
  size?: string;
}

export function filterEquipmentListings(
  listings: ClubEquipmentListing[],
  filter: EquipmentListingFilter,
): ClubEquipmentListing[] {
  return listings.filter((l) => {
    if (filter.category && l.category !== filter.category) return false;
    if (filter.condition && l.condition !== filter.condition) return false;
    if (filter.kind && l.kind !== filter.kind) return false;
    if (filter.maxPriceCents != null && l.price_cents != null && l.price_cents > filter.maxPriceCents) return false;
    if (filter.size && l.size && !l.size.toLowerCase().includes(filter.size.toLowerCase())) return false;
    return true;
  });
}

export interface ClubEquipmentListing {
  id: string;
  club_id: string;
  kind: EquipmentListingKind;
  title: string;
  description: string;
  category: string;
  size?: string;
  condition: EquipmentCondition;
  /** Centimes ; null = don / gratuit / à discuter. */
  price_cents: number | null;
  photo_urls: string[];
  author_uid: string;
  /** Si auteur mineur, tuteur obligatoire pour contact. */
  author_is_minor: boolean;
  guardian_uid?: string | null;
  /** Visibilité club uniquement par défaut. */
  visibility: 'club_members';
  /** Validation club optionnelle avant publication. */
  club_validated_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  status: 'draft' | 'published' | 'sold' | 'given' | 'removed' | 'reported';
  /** UID de l'acheteur/receveur quand status = sold/given. */
  buyer_uid?: string | null;
  sold_at?: Date | null;
}

export interface MarketplaceContactPolicy {
  /** Un adulte inconnu ne peut jamais contacter un mineur directement. */
  allowDirectContact: boolean;
  reason: string;
  /** Contacter le tuteur / staff à la place. */
  contactProxyUid?: string | null;
}

/**
 * Règles de contact marketplace.
 * Paiements : pas de redistribution auto — prestataire conforme ultérieur.
 */
export function resolveMarketplaceContactPolicy(input: {
  listingAuthorUid: string;
  listingAuthorIsMinor: boolean;
  guardianUid?: string | null;
  viewerUid: string;
  viewerIsMinor: boolean;
  viewerIsClubStaff: boolean;
}): MarketplaceContactPolicy {
  if (input.listingAuthorUid === input.viewerUid) {
    return { allowDirectContact: false, reason: 'Vous êtes l’auteur de l’annonce.' };
  }
  if (input.listingAuthorIsMinor) {
    if (input.viewerIsClubStaff && input.guardianUid) {
      return {
        allowDirectContact: false,
        reason: 'Mineur : contact via parent/tuteur ou staff validé uniquement.',
        contactProxyUid: input.guardianUid,
      };
    }
    if (input.guardianUid && input.viewerUid === input.guardianUid) {
      return { allowDirectContact: true, reason: 'Parent/tuteur autorisé.' };
    }
    return {
      allowDirectContact: false,
      reason: 'Interdit : un adulte ne peut pas contacter directement un mineur via la marketplace.',
      contactProxyUid: input.guardianUid ?? null,
    };
  }
  if (input.viewerIsMinor) {
    return {
      allowDirectContact: false,
      reason: 'Mineur : un parent/tuteur doit gérer le contact et l’échange.',
    };
  }
  return { allowDirectContact: true, reason: 'Contact membre club autorisé.' };
}

export const MARKETPLACE_PAYMENT_NOTICE =
  'Les paiements entre membres ne sont pas traités par ProDay dans cette version. Aucune redistribution financière automatique. Un prestataire conforme pourra être activé ultérieurement avec validation du club.';
