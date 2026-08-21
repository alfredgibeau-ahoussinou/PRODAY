/**
 * Forfaits club « live / vidéo » facturables (Stripe Invoice via adminClubBilling).
 * Aligné sur `functions/src/clubBillingAdmin.ts` → CLUB_BILLING_OFFER_PRESETS.
 */

export type ClubLivePackId =
  | 'club_premium'
  | 'club_video_pro'
  | 'veo_lives_2'
  | 'video_veo_pack';

export type ClubLivePackDefinition = {
  id: ClubLivePackId;
  label: string;
  shortLabel: string;
  hint: string;
  offerHint: 'club_premium' | 'club_video_pro';
  livesCount?: number;
};

export const CLUB_LIVE_PACKS: Record<ClubLivePackId, ClubLivePackDefinition> = {
  club_premium: {
    id: 'club_premium',
    label: 'Tout inclus',
    shortLabel: 'Tout inclus',
    hint: 'Formule all-inclusive · tarif € / adhérent sur devis',
    offerHint: 'club_premium',
  },
  club_video_pro: {
    id: 'club_video_pro',
    label: 'ProDay Pro + Veo',
    shortLabel: 'Pro + Veo',
    hint: 'Pack caméra Veo / cloud · matériel optionnel',
    offerHint: 'club_video_pro',
  },
  veo_lives_2: {
    id: 'veo_lives_2',
    label: 'Forfait 2 lives Veo',
    shortLabel: '2 lives',
    hint: 'Pack vidéo live (2 captations) · Veo ou all-inclusive',
    offerHint: 'club_video_pro',
    livesCount: 2,
  },
  video_veo_pack: {
    id: 'video_veo_pack',
    label: 'Pack ProDay Pro + Veo',
    shortLabel: 'Pack Veo',
    hint: 'Option catalogue (~149 € indicatif) — montant admin overridable',
    offerHint: 'club_video_pro',
  },
};

export const CLUB_LIVE_PACK_ORDER: ClubLivePackId[] = [
  'club_premium',
  'club_video_pro',
  'veo_lives_2',
  'video_veo_pack',
];

export function isClubLivePackId(value: string | null | undefined): value is ClubLivePackId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(CLUB_LIVE_PACKS, value));
}

export function getClubLivePack(id: ClubLivePackId): ClubLivePackDefinition {
  return CLUB_LIVE_PACKS[id];
}

export function clubLivePackFromOfferHint(
  hint: 'club_premium' | 'club_video_pro' | null | undefined,
): ClubLivePackId {
  if (hint === 'club_video_pro') return 'club_video_pro';
  return 'club_premium';
}

/** Montant EUR valide pour facturation admin (0,01 → 500 000). */
export function normalizeClubCommercialAmountEur(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0.01 || n > 500_000) return null;
  return Math.round(n * 100) / 100;
}

export function formatClubInvoiceStatus(status: string | null | undefined): string {
  switch (String(status ?? '').toLowerCase()) {
    case 'draft':
      return 'Brouillon';
    case 'open':
      return 'Ouverte';
    case 'paid':
      return 'Payée';
    case 'void':
      return 'Annulée';
    case 'uncollectible':
      return 'Irrécouvrable';
    case '':
      return 'Aucune';
    default:
      return String(status);
  }
}
