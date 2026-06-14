import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { MainTabId } from './mainTabConfig';
import { getVisibleMainTabs } from '../content/poleExperience';

export type MobileRailLayout = {
  left: MainTabId[];
  center: MainTabId | null;
  right: MainTabId[];
  overflow: MainTabId[];
};

const LEFT_PRIORITY: MainTabId[] = ['home', 'recrutement', 'matchs', 'feed'];
const SECONDARY_PRIORITY: MainTabId[] = [
  'recrutement',
  'matchs',
  'covoiturage',
  'sante',
  'feed',
  'shop',
];

function buildMobileRailLayout(visible: MainTabId[]): MobileRailLayout {
  const left: MainTabId[] = [];

  for (const id of LEFT_PRIORITY) {
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
  else if (visible.includes('profil')) right.push('profil');
  else if (visible.includes('shop')) right.push('shop');

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
  visibleOverride?: MainTabId[]
): MobileRailLayout {
  const visible = visibleOverride ?? getVisibleMainTabs(line, role);
  return buildMobileRailLayout(visible);
}
