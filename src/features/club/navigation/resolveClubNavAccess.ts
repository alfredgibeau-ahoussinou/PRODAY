import type { ClubOfferFeatureId, ClubOfferId } from '../../../content/clubOffers';
import { clubOfferHasFeature, CLUB_OFFERS } from '../../../content/clubOffers';
import type { PlatformFeatureFlagKey } from '../../../content/platformFeatureFlags';
import {
  CLUB_NAV_FOLDERS,
  CLUB_PRIMARY_NAV_IDS,
  CLUB_TOOL_GROUPS,
  findClubNavItem,
  type ClubNavFolder,
  type ClubNavItem,
  type ClubNavItemId,
} from './clubNavConfig';

export type ClubNavResolvedItem = ClubNavItem & {
  locked: boolean;
  lockReason?: string;
};

export type ClubNavResolvedFolder = {
  id: ClubNavFolder['id'];
  label: string;
  items: ClubNavResolvedItem[];
};

export type ClubNavAccessInput = {
  offerId: ClubOfferId | null;
  isFeatureEnabled: (key: PlatformFeatureFlagKey) => boolean;
};

function isVideoNavItem(item: ClubNavItem): boolean {
  return (
    item.requiresAnyFeature?.some(
      (f) => f === 'video_analysis' || f === 'byo_video' || f === 'hardware_kit',
    ) ?? false
  );
}

function hasRequiredFeature(
  offerId: ClubOfferId | null,
  required?: ClubOfferFeatureId[],
): boolean {
  if (!required || required.length === 0) return true;
  if (!offerId) return false;
  return required.some((f) => clubOfferHasFeature(offerId, f));
}

function lockReasonFor(item: ClubNavItem, offerId: ClubOfferId | null): string {
  if (isVideoNavItem(item)) {
    return 'Vidéo : activez le module vidéo club, ou passez en formule adaptée (Veo, XbotGo ou smartphone).';
  }
  if (!offerId) {
    return 'Abonnez votre club pour débloquer ce module.';
  }
  const offer = CLUB_OFFERS[offerId];
  if (item.requiresAnyFeature?.includes('competitions')) {
    return `Événements inclus dès Club Essentiel (votre formule : ${offer.shortLabel}).`;
  }
  if (item.requiresAnyFeature?.includes('full_admin')) {
    return `Module disponible dès Club Essentiel (votre formule : ${offer.shortLabel}).`;
  }
  return `Non inclus dans ${offer.shortLabel}. Voir Pack Club.`;
}

function resolveItem(
  item: ClubNavItem,
  input: ClubNavAccessInput,
): ClubNavResolvedItem | null {
  if (item.platformFlag && !input.isFeatureEnabled(item.platformFlag)) {
    return null;
  }
  const offerOk = hasRequiredFeature(input.offerId, item.requiresAnyFeature);
  const entitled =
    offerOk || (isVideoNavItem(item) && input.isFeatureEnabled('club_video'));
  if (!entitled && (item.lockMode ?? 'soft') === 'hide') {
    return null;
  }
  return {
    ...item,
    locked: !entitled,
    lockReason: entitled ? undefined : lockReasonFor(item, input.offerId),
  };
}

/** Résout le menu Club selon formule + flags plateforme. */
export function resolveClubNavFolders(input: ClubNavAccessInput): ClubNavResolvedFolder[] {
  const folders: ClubNavResolvedFolder[] = [];

  for (const folder of CLUB_NAV_FOLDERS) {
    const items: ClubNavResolvedItem[] = [];
    for (const item of folder.items) {
      const resolved = resolveItem(item, input);
      if (resolved) items.push(resolved);
    }
    if (items.length > 0) {
      folders.push({ id: folder.id, label: folder.label, items });
    }
  }

  return folders;
}

/** Catalogue plat (sidebar + recherche). */
export function resolveClubNavCatalog(input: ClubNavAccessInput): ClubNavResolvedItem[] {
  return resolveClubNavFolders(input).flatMap((f) => f.items);
}

/** Onglets barre mobile. */
export function resolveClubPrimaryNav(input: ClubNavAccessInput): ClubNavResolvedItem[] {
  return CLUB_PRIMARY_NAV_IDS.map((id) => {
    const base = findClubNavItem(id);
    if (!base) return null;
    if (id === 'plus' || id === 'today' || id === 'club') {
      return { ...base, locked: false };
    }
    return resolveItem(base, input) ?? { ...base, locked: false };
  }).filter(Boolean) as ClubNavResolvedItem[];
}

/** Outils Menu (groupés). */
export function resolveClubMenuItems(input: ClubNavAccessInput): ClubNavResolvedItem[] {
  const ids = CLUB_TOOL_GROUPS.flatMap((g) => g.ids);
  const out: ClubNavResolvedItem[] = [];
  for (const id of ids) {
    const base = findClubNavItem(id);
    if (!base) continue;
    const resolved = resolveItem(base, input);
    if (resolved) out.push(resolved);
  }
  return out;
}

export function findResolvedClubNavItem(
  folders: ClubNavResolvedFolder[],
  id: ClubNavItemId,
): ClubNavResolvedItem | undefined {
  for (const folder of folders) {
    const hit = folder.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  const plus = findClubNavItem('plus');
  if (id === 'plus' && plus) return { ...plus, locked: false };
  return undefined;
}

export function findInClubNavCatalog(
  catalog: ClubNavResolvedItem[],
  id: ClubNavItemId,
): ClubNavResolvedItem | undefined {
  return catalog.find((i) => i.id === id) ?? findResolvedClubNavItem([], id);
}
