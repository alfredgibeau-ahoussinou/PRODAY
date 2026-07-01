import type { ProductLineId } from '../models/ProductLine';
import { brandForProductLine } from '../models/ProductLine';
import {
  DISCOVER_INTRO_SLIDES,
  DISCOVER_UNIVERSE_CARDS,
  type DiscoverIntroSlide,
} from './discoverChapters';
import {
  DISCOVER_INTRO_SLIDES_WOMAN,
  DISCOVER_UNIVERSE_CARDS_WOMAN,
} from './discoverWomanContent';
import {
  DISCOVER_INTRO_SLIDES_PRO,
  DISCOVER_UNIVERSE_CARDS_PRO,
} from './discoverProContent';
import {
  DISCOVER_INTRO_SLIDES_AMATEUR,
  DISCOVER_UNIVERSE_CARDS_AMATEUR,
} from './discoverAmateurContent';
import {
  DISCOVER_INTRO_SLIDES_SUPPORTER,
  DISCOVER_UNIVERSE_CARDS_SUPPORTER,
} from './discoverSupporterContent';

export function getDiscoverIntroSlides(line: ProductLineId): DiscoverIntroSlide[] {
  if (line === 'woman') return DISCOVER_INTRO_SLIDES_WOMAN;
  if (line === 'pro') return DISCOVER_INTRO_SLIDES_PRO;
  if (line === 'amateur') return DISCOVER_INTRO_SLIDES_AMATEUR;
  if (line === 'supporter') return DISCOVER_INTRO_SLIDES_SUPPORTER;
  return DISCOVER_INTRO_SLIDES;
}

export function getDiscoverUniverseCards(line: ProductLineId) {
  if (line === 'woman') return DISCOVER_UNIVERSE_CARDS_WOMAN;
  if (line === 'pro') return DISCOVER_UNIVERSE_CARDS_PRO;
  if (line === 'amateur') return DISCOVER_UNIVERSE_CARDS_AMATEUR;
  if (line === 'supporter') return DISCOVER_UNIVERSE_CARDS_SUPPORTER;
  return DISCOVER_UNIVERSE_CARDS;
}

export function getDiscoverCarouselCopy(line: ProductLineId): {
  label: string;
  title: string;
  subtitle: string;
} {
  const brand = brandForProductLine(line);
  if (line === 'woman') {
    return {
      label: 'Univers Woman',
      title: 'Foot féminin, un seul tap',
      subtitle: 'Mercato F, matchs, covoiturage, santé et Shop — un seul tap',
    };
  }
  if (line === 'pro') {
    return {
      label: 'Univers Pro',
      title: 'Coach, agent, santé',
      subtitle: 'Mercato Pro, réseau clubs et pôle santé — un seul tap',
    };
  }
  if (line === 'amateur') {
    return {
      label: 'Univers Amateur',
      title: 'Joueur ou coach amateur',
      subtitle: 'Mercato Amateur, matchs, effectif et convocations — un seul tap',
    };
  }
  if (line === 'supporter') {
    return {
      label: 'Univers Supporter',
      title: 'Fans & communauté',
      subtitle: 'Matchs, réels et fil — votre tribune numérique',
    };
  }
  return {
    label: brand.name,
    title: '4 mondes, un seul tap',
    subtitle: 'Swipez — Mercato, matchs et sponsors',
  };
}
