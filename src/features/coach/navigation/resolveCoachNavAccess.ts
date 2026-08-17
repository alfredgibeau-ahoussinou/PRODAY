import {
  COACH_NAV_CATALOG,
  COACH_NAV_FOLDERS,
  COACH_SECONDARY_NAV_IDS,
  canonicalizeCoachNav,
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

function resolveItem(item: CoachNavItem, input: CoachNavAccessInput): CoachNavResolvedItem | null {
  const entitled = isEntitled(item, input);
  if (!entitled && (item.lockMode ?? 'soft') === 'hide') {
    return null;
  }
  return {
    ...item,
    locked: !entitled,
    lockReason: entitled ? undefined : lockReasonFor(item),
  };
}

/** Catalogue complet (onglets + outils nestés) pour deep links et verrous. */
export function resolveCoachNavCatalog(input: CoachNavAccessInput): CoachNavResolvedItem[] {
  const items: CoachNavResolvedItem[] = [];
  for (const item of COACH_NAV_CATALOG) {
    const resolved = resolveItem(item, input);
    if (resolved) items.push(resolved);
  }
  return items;
}

/** Résout le menu Coach (8 onglets primaires). */
export function resolveCoachNavFolders(input: CoachNavAccessInput): CoachNavResolvedFolder[] {
  const byId = new Map(resolveCoachNavCatalog(input).map((item) => [item.id, item]));
  const folders: CoachNavResolvedFolder[] = [];

  for (const folder of COACH_NAV_FOLDERS) {
    const items = folder.items
      .map((item) => byId.get(item.id))
      .filter((item): item is CoachNavResolvedItem => Boolean(item));
    if (items.length > 0) {
      folders.push({ id: folder.id, label: folder.label, items });
    }
  }

  return folders;
}

export function resolveCoachMoreItems(input: CoachNavAccessInput): CoachNavResolvedItem[] {
  const byId = new Map(resolveCoachNavCatalog(input).map((item) => [item.id, item]));
  return COACH_SECONDARY_NAV_IDS.map((id) => byId.get(id)).filter(
    (item): item is CoachNavResolvedItem => Boolean(item),
  );
}

export function findInCoachNavCatalog(
  catalog: CoachNavResolvedItem[],
  id: CoachNavItemId,
): CoachNavResolvedItem | undefined {
  const canonical = canonicalizeCoachNav(id);
  return catalog.find((i) => i.id === canonical || i.id === id);
}

export function findResolvedCoachNavItem(
  folders: CoachNavResolvedFolder[],
  id: CoachNavItemId,
): CoachNavResolvedItem | undefined {
  const canonical = canonicalizeCoachNav(id);
  for (const folder of folders) {
    const hit = folder.items.find((i) => i.id === canonical || i.id === id);
    if (hit) return hit;
  }
  return undefined;
}
