/** @deprecated Contenu migré vers brandExperience.ts — réexports pour compatibilité. */
import type { ProDayModuleDef } from './prodayModules';
import { PRODAY_MODULES } from './prodayModules';
import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import {
  getDiscoverHomeCopy as getDiscoverCopy,
  getUniverseIdentity,
  getBrandIdentity,
  HOMME_IDENTITY,
  WOMAN_IDENTITY,
  PRO_IDENTITY,
} from './brandExperience';
import {
  getDiscoverUniverseCardsForLine,
  getDashboardMetaForLine,
  getModulesForRoleAndLine,
} from './poleExperience';
import { ROLE_DASHBOARD_TAGLINE } from './dashboardUniques';
import { isFemalePlayerPresentation } from '../utils/playerSegment';

export { getUniverseIdentity, getBrandIdentity, HOMME_IDENTITY, WOMAN_IDENTITY, PRO_IDENTITY };

export interface DiscoverHomeCopy {
  heroTitle: string;
  heroSub: string;
  trustText: string;
  ctaText: string;
  sectionExplore: string;
  secondaryMercato: string;
  playersStatLabel: string;
}

export function getDiscoverHomeCopy(line: ProductLineId | boolean): DiscoverHomeCopy {
  if (typeof line === 'boolean') return getDiscoverCopy(line ? 'woman' : 'homme');
  return getDiscoverCopy(line);
}

export function getHomeModules(
  line: ProductLineId | boolean,
  role?: UserRole
): ProDayModuleDef[] {
  const productLine = typeof line === 'boolean' ? (line ? 'woman' : 'homme') : line;
  const cards = getDiscoverUniverseCardsForLine(productLine);
  const cardById = Object.fromEntries(cards.map((c) => [c.id, c]));
  const base = PRODAY_MODULES.map((mod) => {
    const card = cardById[mod.id as keyof typeof cardById];
    if (!card) return mod;
    return { ...mod, title: card.title, subtitle: card.subtitle };
  });
  if (!role) return base;
  const { order } = getModulesForRoleAndLine(role, productLine);
  const byId = Object.fromEntries(base.map((m) => [m.id, m]));
  return order.map((id) => {
    const mod = byId[id];
    if (!mod) return null;
    if (role === 'player' && id === 'recrutement' && productLine !== 'pro') {
      return {
        ...mod,
        title: isFemalePlayerPresentation(null, productLine) ? 'Mercato F' : 'Candidater',
        subtitle: 'Annonces clubs — sans publication',
      };
    }
    return mod;
  }).filter(Boolean) as ProDayModuleDef[];
}

export function getHomeDashboardMeta(
  role: UserRole,
  line: ProductLineId | boolean
): { eyebrow: string; tagline: string } {
  const productLine = typeof line === 'boolean' ? (line ? 'woman' : 'homme') : line;
  const meta = getDashboardMetaForLine(role, productLine);
  return {
    eyebrow: meta.eyebrow,
    tagline: ROLE_DASHBOARD_TAGLINE[role] ?? meta.eyebrow,
  };
}
