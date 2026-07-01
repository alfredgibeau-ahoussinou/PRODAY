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
  order: MainTabId[];
};

/** Menus bas plats — un ordre distinct par boule / shell. */
const FLAT_RAIL_RULES: FlatRailRule[] = [
  {
    match: (line, role) => line === 'supporter' && role === 'supporter',
    order: ['matchs', 'feed', 'messages', 'reels', 'shop', 'profil'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'player',
    order: ['home', 'covoiturage', 'recrutement', 'profil'],
  },
  {
    match: (line, role) => line === 'amateur' && role === 'coach',
    order: ['home', 'matchs', 'recrutement', 'messages', 'profil'],
  },
  {
    match: (line, role) => line === 'sante' && role === 'physio',
    order: ['home', 'matchs', 'feed', 'messages', 'profil'],
  },
  {
    match: (line, role) =>
      role === 'player' &&
      (line === 'pro_player' ||
        line === 'homme' ||
        line === 'woman' ||
        isProProductLine(line)),
    order: ['home', 'recrutement', 'reels', 'matchs', 'profil'],
  },
  {
    match: (line, role) =>
      line === 'pro_club' || (isProProductLine(line) && role === 'club'),
    order: ['home', 'recrutement', 'matchs', 'messages', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'coach',
    order: ['home', 'matchs', 'recrutement', 'covoiturage', 'messages', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'agent',
    order: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'recruiter',
    order: ['home', 'recrutement', 'matchs', 'feed', 'messages', 'profil'],
  },
  {
    match: (line, role) => isProProductLine(line) && role === 'organizer',
    order: ['home', 'matchs', 'recrutement', 'feed', 'messages', 'profil'],
  },
];

function buildFlatRailLayout(order: MainTabId[], visible: MainTabId[]): MobileRailLayout {
  const flat = order.filter((id) => visible.includes(id));
  return { left: [], center: null, right: [], overflow: [], flat };
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
      return buildFlatRailLayout(rule.order, visible);
    }
  }
  return buildClassicRailLayout(visible, line, role);
}

/** Répartit les onglets selon le pôle : menu plat dédié ou rail classique (Homme / Woman). */
export function getMobileRailLayout(
  line: ProductLineId,
  role?: UserRole | null,
  visibleOverride?: MainTabId[],
): MobileRailLayout {
  const visible = visibleOverride ?? getVisibleMainTabs(line, role);
  const effectiveLine = canonicalizeActiveProductLine(line, role);
  return buildMobileRailLayout(visible, effectiveLine, role);
}
