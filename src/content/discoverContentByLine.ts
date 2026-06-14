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

export function getDiscoverIntroSlides(line: ProductLineId): DiscoverIntroSlide[] {
  if (line === 'woman') return DISCOVER_INTRO_SLIDES_WOMAN;
  if (line === 'pro') return DISCOVER_INTRO_SLIDES_PRO;
  return DISCOVER_INTRO_SLIDES;
}

export function getDiscoverUniverseCards(line: ProductLineId) {
  if (line === 'woman') return DISCOVER_UNIVERSE_CARDS_WOMAN;
  if (line === 'pro') return DISCOVER_UNIVERSE_CARDS_PRO;
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
  return {
    label: brand.name,
    title: '4 mondes, un seul tap',
    subtitle: 'Swipez — Mercato, matchs et sponsors',
  };
}
