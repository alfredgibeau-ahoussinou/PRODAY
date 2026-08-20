import type { MatchsDeepLink } from './navigationDeepLink';

/** Incrémente applyNonce pour que Matchs consomme le lien même sans remount. */
export function stampMatchsDeepLink(link: MatchsDeepLink): MatchsDeepLink {
  return { ...link, applyNonce: (link.applyNonce ?? 0) + 1 };
}

export function supporterChapterFromPendingLink(
  link: MatchsDeepLink | null,
): NonNullable<MatchsDeepLink['supporterChapter']> | null {
  return link?.supporterChapter ?? null;
}

export type SupporterLiveOpeners = {
  showOverlay?: () => void;
  openMatchsLive?: () => void;
};

/** Chip LIVE : overlay Accueil si présent, sinon onglet Matchs (chapitre live). */
export function openSupporterLive(openers: SupporterLiveOpeners): void {
  if (openers.showOverlay) {
    openers.showOverlay();
    return;
  }
  openers.openMatchsLive?.();
}
