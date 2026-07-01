import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { MainTabId } from './mainTabConfig';
import { getVisibleMainTabs } from '../content/poleExperience';

export type MobileRailLayout = {
  left: MainTabId[];
  center: MainTabId | null;
  right: MainTabId[];
  overflow: MainTabId[];
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

function buildMobileRailLayout(
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

/** Répartit les onglets : 2 à gauche, Reels au centre, Messages à droite, reste dans « Menu ». */
export function getMobileRailLayout(
  line: ProductLineId,
  role?: UserRole | null,
  visibleOverride?: MainTabId[],
): MobileRailLayout {
  const visible = visibleOverride ?? getVisibleMainTabs(line, role);
  return buildMobileRailLayout(visible, line, role);
}
