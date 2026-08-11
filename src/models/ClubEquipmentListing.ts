/**
 * Marketplace équipement club — règles mineurs, paiement, validation.
 */

export type EquipmentListingKind = 'sell' | 'give' | 'wanted';
export type EquipmentCondition = 'new' | 'very_good' | 'good' | 'used';

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
  status: 'draft' | 'published' | 'sold' | 'removed' | 'reported';
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
