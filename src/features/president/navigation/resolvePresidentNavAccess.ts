import {
  PRESIDENT_MENU_DEST_IDS,
  PRESIDENT_NAV_CATALOG,
  PRESIDENT_NAV_FOLDERS,
  PRESIDENT_PRIMARY_NAV_IDS,
  type PresidentNavFolder,
  type PresidentNavItem,
  type PresidentNavItemId,
} from './presidentNavConfig';

export type PresidentNavResolvedItem = PresidentNavItem & {
  locked?: boolean;
  lockReason?: string;
};

export type PresidentNavResolvedFolder = {
  id: PresidentNavFolder['id'];
  label: string;
  items: PresidentNavResolvedItem[];
};

/**
 * Résolution nav Président — v1 : tout le catalogue (gate d’accès au pôle ailleurs).
 */
export function resolvePresidentNavFolders(): PresidentNavResolvedFolder[] {
  return PRESIDENT_NAV_FOLDERS.map((folder) => ({
    id: folder.id,
    label: folder.label,
    items: folder.items.map((item) => ({ ...item })),
  }));
}

export function resolvePresidentNavCatalog(): PresidentNavResolvedItem[] {
  return PRESIDENT_NAV_CATALOG.map((item) => ({ ...item }));
}

export function resolvePresidentPrimaryNav(): PresidentNavResolvedItem[] {
  const catalog = resolvePresidentNavCatalog();
  return PRESIDENT_PRIMARY_NAV_IDS.map((id) => {
    if (id === 'menu') {
      return {
        id: 'menu' as const,
        label: 'Menu',
        shortLabel: 'Menu',
        icon: 'hamburger' as const,
        hint: 'Toutes les sections',
      };
    }
    return catalog.find((i) => i.id === id)!;
  }).filter(Boolean);
}

export function resolvePresidentMenuItems(): PresidentNavResolvedItem[] {
  const catalog = resolvePresidentNavCatalog();
  return PRESIDENT_MENU_DEST_IDS.map((id) => catalog.find((i) => i.id === id)!).filter(
    Boolean,
  );
}

export function findInPresidentNavCatalog(
  id: PresidentNavItemId,
): PresidentNavResolvedItem | undefined {
  return resolvePresidentNavCatalog().find((i) => i.id === id);
}

/** Destinations de la palette ⌘K / recherche. */
export function resolvePresidentCommandItems(): PresidentNavResolvedItem[] {
  return resolvePresidentNavCatalog().filter((i) => i.id !== 'menu');
}
