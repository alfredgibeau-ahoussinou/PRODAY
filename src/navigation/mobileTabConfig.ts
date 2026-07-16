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
  homme: ['home', 'matchs', 'recrutement', 'feed'],
  woman: ['home', 'matchs', 'recrutement', 'feed'],
  amateur: ['home', 'covoiturage', 'matchs', 'recrutement'],
  pro: ['home', 'matchs', 'recrutement', 'feed'],
  pro_player: ['home', 'recrutement', 'matchs', 'reels'],
  pro_club: ['home', 'recrutement', 'matchs', 'messages'],
  pro_staff: ['home', 'matchs', 'recrutement', 'feed'],
  supporter: ['matchs', 'feed', 'messages', 'reels'],
  sante: ['home', 'matchs', 'feed', 'messages'],
};

const LEFT_PRIORITY_BY_PRO_ROLE: Partial<Record<UserRole, MainTabId[]>> = {
  player: ['home', 'recrutement', 'matchs', 'reels'],
  club: ['home', 'recrutement', 'matchs', 'messages'],
  coach: ['home', 'matchs', 'recrutement', 'covoiturage'],
  agent: ['home', 'recrutement', 'matchs', 'feed'],
  recruiter: ['home', 'recrutement', 'matchs', 'feed'],
  organizer: ['home', 'matchs', 'recrutement', 'feed'],
};

type FlatRailRule = {
  match: (line: ProductLineId, role?: UserRole | null) => boolean;
  primary: MainTabId[];
  overflow?: MainTabId[];
};

/** Menus bas plats — un ordre distinct par boule / shell. */
const FLAT_RAIL_RULES: FlatRailRule[] = [
  {
    match: (line, role) => line === 'supporter' && role === 'supporter',
    primary: ['matchs', 'feed', 'messages', 'reels', 'shop', 'profil'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'player',
    primary: ['home', 'covoiturage', 'recrutement', 'shop', 'profil'],
    overflow: ['matchs', 'messages', 'reels', 'sante', 'feed', 'famille'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'coach',
    primary: ['home', 'matchs', 'recrutement', 'messages', 'shop', 'profil'],
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
    primary: ['home', 'recrutement', 'reels', 'matchs', 'shop', 'profil'],
    overflow: ['sante', 'messages'],
  },
  {
    match: (line, role) =>
      line === 'pro_club' || (isProProductLine(line) && role === 'club'),
    primary: ['home', 'recrutement', 'matchs', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'coach',
    primary: ['home', 'matchs', 'recrutement', 'covoiturage', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'agent',
    primary: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'recruiter',
    primary: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'shop', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'organizer',
    primary: ['home', 'matchs', 'recrutement', 'feed', 'messages', 'shop', 'profil'],
  },
];

function buildFlatRailLayout(
  primary: MainTabId[],
  visible: MainTabId[],
  overflowOrder: MainTabId[] = [],
): MobileRailLayout {
  const flat = primary.filter((id) => visible.includes(id));
  const overflow = overflowOrder.filter((id) => visible.includes(id) && !flat.includes(id));
  return { left: [], center: null, right: [], overflow, flat };
}

function buildClassicRailLayout(
  visible: MainTabId[],
  line: ProductLineId,
  role?: UserRole | null,
): MobileRailLayout {
  const leftPriority =
    (line && isProProductLine(line) && role ? LEFT_PRIORITY_BY_PRO_ROLE[role] : undefined) ??
    LEFT_PRIORITY_BY_LINE[line] ??
    LEFT_PRIORITY_BY_LINE.homme;
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
