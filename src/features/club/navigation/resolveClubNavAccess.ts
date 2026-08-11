import type { ClubOfferFeatureId, ClubOfferId } from '../../../content/clubOffers';
import { clubOfferHasFeature, CLUB_OFFERS } from '../../../content/clubOffers';
import type { PlatformFeatureFlagKey } from '../../../content/platformFeatureFlags';
import {
  CLUB_NAV_FOLDERS,
  type ClubNavFolder,
  type ClubNavItem,
  type ClubNavItemId,
} from './clubNavConfig';

export type ClubNavResolvedItem = ClubNavItem & {
  locked: boolean;
  /** Raison courte si locked. */
  lockReason?: string;
};

export type ClubNavResolvedFolder = {
  id: ClubNavFolder['id'];
  label: string;
  items: ClubNavResolvedItem[];
};

export type ClubNavAccessInput = {
  /** Null = compte club sans abonnement pro → features verrouillées. */
  offerId: ClubOfferId | null;
  isFeatureEnabled: (key: PlatformFeatureFlagKey) => boolean;
};

function hasRequiredFeature(
  offerId: ClubOfferId | null,
  required?: ClubOfferFeatureId[],
): boolean {
  if (!required || required.length === 0) return true;
  if (!offerId) return false;
  return required.some((f) => clubOfferHasFeature(offerId, f));
}

function lockReasonFor(item: ClubNavItem, offerId: ClubOfferId | null): string {
  if (!offerId) {
    return 'Abonnez votre club pour débloquer ce module.';
  }
  const offer = CLUB_OFFERS[offerId];
  if (item.requiresAnyFeature?.includes('competitions')) {
    return `Tournois inclus dès Club Essentiel (votre formule : ${offer.shortLabel}).`;
  }
  if (item.requiresAnyFeature?.some((f) =>
    f === 'video_analysis' || f === 'byo_video' || f === 'hardware_kit',
  )) {
    return `Vidéo incluse dès Tout inclus / Pro + Veo (votre formule : ${offer.shortLabel}).`;
  }
  if (item.requiresAnyFeature?.includes('ai_assistant')) {
    return `Assistant IA avancé inclus dès Tout inclus (votre formule : ${offer.shortLabel}).`;
  }
  if (item.requiresAnyFeature?.includes('full_admin')) {
    return `Module disponible dès Club Essentiel (votre formule : ${offer.shortLabel}).`;
  }
  return `Non inclus dans ${offer.shortLabel}. Voir Offres & formule.`;
}

/** Résout le menu Club selon formule + flags plateforme. */
export function resolveClubNavFolders(input: ClubNavAccessInput): ClubNavResolvedFolder[] {
  const folders: ClubNavResolvedFolder[] = [];

  for (const folder of CLUB_NAV_FOLDERS) {
    const items: ClubNavResolvedItem[] = [];
    for (const item of folder.items) {
      if (item.platformFlag && !input.isFeatureEnabled(item.platformFlag)) {
        continue;
      }
      const entitled = hasRequiredFeature(input.offerId, item.requiresAnyFeature);
      if (!entitled && (item.lockMode ?? 'soft') === 'hide') {
        continue;
      }
      items.push({
        ...item,
        locked: !entitled,
        lockReason: entitled ? undefined : lockReasonFor(item, input.offerId),
      });
    }
    if (items.length > 0) {
      folders.push({ id: folder.id, label: folder.label, items });
    }
  }

  return folders;
}

export function findResolvedClubNavItem(
  folders: ClubNavResolvedFolder[],
  id: ClubNavItemId,
): ClubNavResolvedItem | undefined {
  for (const folder of folders) {
    const hit = folder.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}
