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
};

/** Résout le menu Coach (soft-lock Tactique IA). */
export function resolveCoachNavFolders(input: CoachNavAccessInput): CoachNavResolvedFolder[] {
  const folders: CoachNavResolvedFolder[] = [];

  for (const folder of COACH_NAV_FOLDERS) {
    const items: CoachNavResolvedItem[] = [];
    for (const item of folder.items) {
      const entitled = !item.requiresSmartTactics || input.canSmartTactics;
      if (!entitled && (item.lockMode ?? 'soft') === 'hide') {
        continue;
      }
      items.push({
        ...item,
        locked: !entitled,
        lockReason: entitled
          ? undefined
          : 'Tactique IA inclus avec Coach Pro, ou si ton club a l’offre Tout inclus.',
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
