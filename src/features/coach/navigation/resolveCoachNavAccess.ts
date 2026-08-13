import {
  COACH_NAV_FOLDERS,
  type CoachNavFolder,
  type CoachNavItem,
  type CoachNavItemId,
} from './coachNavConfig';

export type CoachNavResolvedItem = CoachNavItem & {
  locked: boolean;
  lockReason?: string;
};

export type CoachNavResolvedFolder = {
  id: CoachNavFolder['id'];
  label: string;
  items: CoachNavResolvedItem[];
};

export type CoachNavAccessInput = {
  canSmartTactics: boolean;
  /** Flag admin `coach_video` — Mes vidéos. */
  canVideo: boolean;
};

function isEntitled(item: CoachNavItem, input: CoachNavAccessInput): boolean {
  if (item.requiresSmartTactics && !input.canSmartTactics) return false;
  if (item.requiresVideo && !input.canVideo) return false;
  return true;
}

function lockReasonFor(item: CoachNavItem): string {
  if (item.requiresVideo) {
    return 'Vidéo Coach : activez « Vidéo Coach (Veo) » dans l’admin Paramètres.';
  }
  return 'Tactique IA inclus avec Coach Pro, ou si ton club a l’offre Tout inclus.';
}

/** Résout le menu Coach (soft-lock Tactique IA + Vidéo). */
export function resolveCoachNavFolders(input: CoachNavAccessInput): CoachNavResolvedFolder[] {
  const folders: CoachNavResolvedFolder[] = [];

  for (const folder of COACH_NAV_FOLDERS) {
    const items: CoachNavResolvedItem[] = [];
    for (const item of folder.items) {
      const entitled = isEntitled(item, input);
      if (!entitled && (item.lockMode ?? 'soft') === 'hide') {
        continue;
      }
      items.push({
        ...item,
        locked: !entitled,
        lockReason: entitled ? undefined : lockReasonFor(item),
      });
    }
    if (items.length > 0) {
      folders.push({ id: folder.id, label: folder.label, items });
    }
  }

  return folders;
}

export function findResolvedCoachNavItem(
  folders: CoachNavResolvedFolder[],
  id: CoachNavItemId,
): CoachNavResolvedItem | undefined {
  for (const folder of folders) {
    const hit = folder.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}
