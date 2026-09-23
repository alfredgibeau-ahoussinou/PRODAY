import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { MainTabId } from './mainTabConfig';
import { getVisibleMainTabs } from '../content/poleExperience';
import { canonicalizeActiveProductLine } from '../utils/productLineResolution';

export type MobileRailLayout = {
  left: MainTabId[];
  center: MainTabId | null;
  right: MainTabId[];
  overflow: MainTabId[];
  /** Rangée unique d’onglets égaux (menu dédié par pôle). */
  flat?: MainTabId[];
};

const SECONDARY_PRIORITY: MainTabId[] = [
  'recrutement',
  'matchs',
  'covoiturage',
  'sante',
  'feed',
  'famille',
  'shop',
];

const LEFT_PRIORITY_BY_LINE: Record<ProductLineId, MainTabId[]> = {
  // Legacy homme/woman : priorité rail classique (coach). Joueurs passent par FLAT_RAIL_RULES.
  homme: ['home', 'covoiturage', 'matchs', 'recrutement'],
  woman: ['home', 'covoiturage', 'matchs', 'recrutement'],
  amateur: ['home', 'covoiturage', 'matchs', 'recrutement'],
  pro: ['home', 'covoiturage', 'matchs', 'recrutement'],
  pro_player: ['home', 'reels', 'matchs', 'messages'],
  pro_club: ['home', 'recrutement', 'matchs', 'messages'],
  pro_staff: ['home', 'covoiturage', 'matchs', 'recrutement'],
  sponsor: ['home', 'matchs', 'messages', 'profil'],
  supporter: ['home', 'matchs', 'feed', 'plus', 'reels', 'profil'],
  sante: ['home', 'matchs', 'feed', 'messages'],
  parent: ['home', 'messages', 'matchs', 'profil'],
};

const LEFT_PRIORITY_BY_PRO_ROLE: Partial<Record<UserRole, MainTabId[]>> = {
  player: ['home', 'reels', 'matchs', 'messages'],
  club: ['home', 'recrutement', 'matchs', 'messages'],
  coach: ['home', 'covoiturage', 'matchs', 'recrutement'],
  agent: ['home', 'recrutement', 'matchs', 'feed'],
  recruiter: ['home', 'recrutement', 'matchs', 'feed'],
  organizer: ['home', 'covoiturage', 'matchs', 'recrutement'],
};

type FlatRailRule = {
  match: (line: ProductLineId, role?: UserRole | null) => boolean;
  primary: MainTabId[];
  overflow?: MainTabId[];
};

/** Menus bas plats — un ordre distinct par boule / shell. */
const FLAT_RAIL_RULES: FlatRailRule[] = [
  {
    // Parent guest : role reste « parent », line = supporter.
    match: (line) => line === 'supporter',
    primary: ['home', 'matchs', 'feed', 'plus', 'reels', 'profil'],
    overflow: [],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'player',
    primary: ['home', 'matchs', 'profil', 'plus'],
    overflow: ['feed', 'progression', 'recrutement', 'reels', 'messages', 'covoiturage', 'shop', 'famille'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'coach',
    primary: ['home', 'matchs', 'feed', 'messages', 'profil'],
    overflow: ['covoiturage', 'recrutement', 'shop'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'club',
    primary: ['home', 'recrutement', 'matchs', 'messages', 'profil'],
    overflow: ['feed', 'covoiturage', 'shop'],
  },
  {
    match: (line, role) => line === 'sante' && role === 'physio',
    primary: ['home', 'matchs', 'feed', 'messages', 'profil'],
  },
  {
    match: (line, role) =>
      role === 'player' &&
      (line === 'pro_player' ||
        line === 'homme' ||
        line === 'woman' ||
        isProProductLine(line)),
    primary: ['home', 'matchs', 'profil', 'plus'],
    overflow: ['feed', 'progression', 'recrutement', 'reels', 'messages', 'covoiturage', 'shop', 'famille'],
  },
  {
    match: (line, role) =>
      line === 'pro_club' || (isProProductLine(line) && role === 'club'),
    primary: ['home', 'recrutement', 'matchs', 'messages', 'profil'],
    overflow: ['covoiturage', 'shop'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'coach',
    primary: ['home', 'covoiturage', 'matchs', 'recrutement', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'agent',
    primary: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'recruiter',
    primary: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'shop', 'profil'],
  },
];

function buildFlatRailLayout(
  primary: MainTabId[],
  visible: MainTabId[],
  overflowOrder: MainTabId[] = [],
): MobileRailLayout {
  const flat = primary.filter((id) => visible.includes(id));
  const overflowOrdered = overflowOrder.filter(
    (id) => visible.includes(id) && !flat.includes(id),
  );
  /** Onglets injectés (ex. famille mineurs) hors allowlist overflow. */
  const PRESERVE_EXTRA: MainTabId[] = ['famille'];
  const overflowExtra = PRESERVE_EXTRA.filter(
    (id) => visible.includes(id) && !flat.includes(id) && !overflowOrdered.includes(id),
  );
  return {
    left: [],
    center: null,
    right: [],
    overflow: [...overflowOrdered, ...overflowExtra],
    flat,
  };
}

function buildClassicRailLayout(
  visible: MainTabId[],
  line: ProductLineId,
  role?: UserRole | null,
): MobileRailLayout {
  const leftPriority =
    (line && isProProductLine(line) && role ? LEFT_PRIORITY_BY_PRO_ROLE[role] : undefined) ??
    LEFT_PRIORITY_BY_LINE[line] ??
    LEFT_PRIORITY_BY_LINE.amateur;
  const left: MainTabId[] = [];

  for (const id of leftPriority) {
    if (visible.includes(id) && !left.includes(id)) {
      left.push(id);
    }
    if (left.length >= 2) break;
  }

  if (left.length < 2) {
    for (const id of SECONDARY_PRIORITY) {
      if (visible.includes(id) && !left.includes(id)) {
        left.push(id);
      }
      if (left.length >= 2) break;
    }
  }

  const center = visible.includes('reels') ? 'reels' : null;
  const right: MainTabId[] = [];
  if (visible.includes('messages')) right.push('messages');
  if (visible.includes('profil')) right.push('profil');
  if (right.length === 0 && visible.includes('shop')) right.push('shop');

  const inRail = new Set<MainTabId>([
    ...left,
    ...(center ? ([center] as MainTabId[]) : []),
    ...right,
  ]);
  const overflow = visible.filter((id) => !inRail.has(id));

  return { left, center, right, overflow };
}

function buildMobileRailLayout(
  visible: MainTabId[],
  line: ProductLineId,
  role?: UserRole | null,
): MobileRailLayout {
  for (const rule of FLAT_RAIL_RULES) {
    if (rule.match(line, role)) {
      return buildFlatRailLayout(rule.primary, visible, rule.overflow ?? []);
    }
  }
  return buildClassicRailLayout(visible, line, role);
}

/** Répartit les onglets selon le pôle : menu plat dédié ou rail classique. */
export function getMobileRailLayout(
  line: ProductLineId,
  role?: UserRole | null,
  visibleOverride?: MainTabId[],
): MobileRailLayout {
  const visible = visibleOverride ?? getVisibleMainTabs(line, role);
  const effectiveLine = canonicalizeActiveProductLine(line, role);
  return buildMobileRailLayout(visible, effectiveLine, role);
}
