import type { ProductLineId } from '../models/ProductLine';
import type { ProDayModuleId } from '../content/prodayModules';
import type { TranslateFn } from './types';
import type { AuthTabId } from '../components/auth/AuthTabRail';
import type { DiscoverJourneyStep, DiscoverJourneyStepId } from '../content/discoverGuestJourney';
import type { DiscoverQuickId } from '../components/discover/DiscoverQuickAccess';
import { brandForProductLine } from '../models/ProductLine';

const LINE_SUFFIX: Record<ProductLineId, string> = {
  homme: 'homme',
  woman: 'woman',
  amateur: 'amateur',
  supporter: 'supporter',
  pro: 'pro',
  pro_player: 'pro_player',
  pro_club: 'pro_club',
  pro_staff: 'pro_staff',
  sponsor: 'sponsor',
  sante: 'sante',
  parent: 'parent',
};

function lineKey(line: ProductLineId, base: string): string {
  return `${base}.${LINE_SUFFIX[line]}`;
}

export interface LocalizedDiscoverCopy {
  heroTitle: string;
  heroSub: string;
  trustText: string;
  ctaText: string;
  sectionExplore: string;
  secondaryMercato: string;
  playersStatLabel: string;
}

export function getLocalizedDiscoverCopy(
  line: ProductLineId,
  t: TranslateFn
): LocalizedDiscoverCopy {
  const lk = (base: string) => t(lineKey(line, base));
  return {
    heroTitle: lk('discover.hero'),
    heroSub: lk('discover.mission'),
    trustText: lk('discover.trust'),
    ctaText: lk('discover.cta'),
    sectionExplore: lk('discover.sectionExplore'),
    secondaryMercato: lk('discover.secondaryMercato'),
    playersStatLabel: lk('discover.playersStat'),
  };
}

export function getLocalizedUniverseLabel(line: ProductLineId, t: TranslateFn): string {
  return t(lineKey(line, 'universe'));
}

export function getLocalizedQuickAccessItems(
  t: TranslateFn
): { id: DiscoverQuickId; label: string; sub: string }[] {
  return [
    { id: 'mercato', label: t('discover.quick.mercato'), sub: t('discover.quick.mercatoSub') },
    { id: 'matchs', label: t('discover.quick.matchs'), sub: t('discover.quick.matchsSub') },
    { id: 'reels', label: t('discover.quick.reels'), sub: t('discover.quick.reelsSub') },
    { id: 'shop', label: t('discover.quick.shop'), sub: t('discover.quick.shopSub') },
  ];
}

export function getLocalizedModules(
  t: TranslateFn
): { id: ProDayModuleId; title: string; subtitle: string }[] {
  return [
    {
      id: 'recrutement',
      title: t('modules.recrutement.title'),
      subtitle: t('modules.recrutement.subtitle'),
    },
    { id: 'matchs', title: t('modules.matchs.title'), subtitle: t('modules.matchs.subtitle') },
    {
      id: 'gestion',
      title: t('modules.gestion.title'),
      subtitle: t('modules.gestion.subtitle'),
    },
    {
      id: 'smart_tactics',
      title: t('modules.smart_tactics.title'),
      subtitle: t('modules.smart_tactics.subtitle'),
    },
    {
      id: 'sponsors',
      title: t('modules.sponsors.title'),
      subtitle: t('modules.sponsors.subtitle'),
    },
  ];
}

const JOURNEY_ICONS: Record<DiscoverJourneyStepId, DiscoverJourneyStep['icon']> = {
  profile: 'person',
  mercato: 'search',
  season: 'calendar',
};

export function getLocalizedGuestJourneySteps(
  line: ProductLineId,
  t: TranslateFn
): DiscoverJourneyStep[] {
  const ids: DiscoverJourneyStepId[] = ['profile', 'mercato', 'season'];
  return ids.map((id) => ({
    id,
    icon:
      line === 'sante' && id === 'profile'
        ? 'heart'
        : (line === 'pro' || line === 'pro_staff') && id === 'profile'
          ? 'school'
          : line === 'pro_player' && id === 'profile'
            ? 'person'
            : line === 'pro_club' && id === 'profile'
              ? 'school'
              : line === 'supporter' && id === 'mercato'
                ? 'people'
                : JOURNEY_ICONS[id],
    title: t(lineKey(line, `journey.${id}.title`)),
    body: t(lineKey(line, `journey.${id}.body`)),
  }));
}

export function getLocalizedAuthCopy(
  line: ProductLineId,
  tab: AuthTabId,
  t: TranslateFn,
  opts?: { brandName?: string; sponsor?: boolean; parent?: boolean },
): { title: string; sub: string } {
  const brandName = opts?.brandName ?? brandForProductLine(line).name;
  if (tab === 'login') {
    return {
      title: t('auth.welcomeBack'),
      sub: opts?.sponsor
        ? t('auth.loginSub.sponsor')
        : opts?.parent
          ? t('auth.loginSub.parent')
          : t(lineKey(line, 'auth.loginSub')),
    };
  }
  return {
    title: t('auth.signupTitle', { brand: brandName }),
    sub: opts?.sponsor
      ? t('auth.signupSub.sponsor')
      : opts?.parent
        ? t('auth.signupSub.parent')
        : t(lineKey(line, 'auth.signupSub')),
  };
}
