import type { ProductLineId } from '../models/ProductLine';
import { brandForProductLine } from '../models/ProductLine';
import { isProFamilyLine } from '../utils/productLineResolution';
import {
  DISCOVER_INTRO_SLIDES,
  DISCOVER_UNIVERSE_CARDS,
  type DiscoverIntroSlide,
} from './discoverChapters';
import {
  DISCOVER_INTRO_SLIDES_PRO_CLUB,
  DISCOVER_INTRO_SLIDES_PRO_PLAYER,
  DISCOVER_INTRO_SLIDES_PRO_STAFF,
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
import {
  DISCOVER_INTRO_SLIDES_SPONSOR,
  DISCOVER_UNIVERSE_CARDS_SPONSOR,
} from './discoverSponsorContent';

function resolveDiscoverLine(line: ProductLineId): ProductLineId {
  if (line === 'homme' || line === 'woman' || line === 'pro') return 'amateur';
  // Santé n’est plus un pôle vitrine : soins intégrés au parcours Joueur.
  if (line === 'sante') return 'amateur';
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') return line;
  if (line === 'sponsor') return 'sponsor';
  if (isProFamilyLine(line)) return 'pro_player';
  return line;
}

export function getDiscoverIntroSlides(line: ProductLineId): DiscoverIntroSlide[] {
  const resolved = resolveDiscoverLine(line);
  if (resolved === 'pro_player') return DISCOVER_INTRO_SLIDES_PRO_PLAYER;
  if (resolved === 'pro_club') return DISCOVER_INTRO_SLIDES_PRO_CLUB;
  if (resolved === 'pro_staff') return DISCOVER_INTRO_SLIDES_PRO_STAFF;
  if (resolved === 'amateur') return DISCOVER_INTRO_SLIDES_AMATEUR;
  if (resolved === 'supporter') return DISCOVER_INTRO_SLIDES_SUPPORTER;
  // sante → amateur via resolveDiscoverLine
  if (resolved === 'sponsor') {
    return [...DISCOVER_INTRO_SLIDES_SPONSOR] as unknown as DiscoverIntroSlide[];
  }
  return DISCOVER_INTRO_SLIDES;
}

export function getDiscoverUniverseCards(line: ProductLineId) {
  const resolved = resolveDiscoverLine(line);
  if (resolved === 'pro_player' || resolved === 'pro_club' || resolved === 'pro_staff') {
    return DISCOVER_UNIVERSE_CARDS_PRO;
  }
  if (resolved === 'amateur') return DISCOVER_UNIVERSE_CARDS_AMATEUR;
  if (resolved === 'supporter') return DISCOVER_UNIVERSE_CARDS_SUPPORTER;
  if (resolved === 'sponsor') return DISCOVER_UNIVERSE_CARDS_SPONSOR;
  return DISCOVER_UNIVERSE_CARDS;
}

export function getDiscoverCarouselCopy(line: ProductLineId): {
  label: string;
  title: string;
  subtitle: string;
} {
  const resolved = resolveDiscoverLine(line);
  const brand = brandForProductLine(resolved);

  if (resolved === 'pro_player') {
    return {
      label: 'Pro Joueur',
      title: 'Carrière et opportunités',
      subtitle: 'Visibilité pro, essais et mandats. Votre vitrine sportive',
    };
  }
  if (resolved === 'pro_club') {
    return {
      label: 'Club',
      title: 'Cœur de ProDay',
      subtitle: 'Équipes, compétitions, permissions et covoiturage',
    };
  }
  if (resolved === 'pro_staff') {
    return {
      label: 'Coach',
      title: 'Banc de touche digital',
      subtitle: 'Tactique IA, IA, effectif — rôles réseau optionnels',
    };
  }
  if (resolved === 'amateur') {
    return {
      label: 'Univers Amateur',
      title: 'Pôle Joueur',
      subtitle: 'Amateur, Formation ou Haut niveau. Homme / Femme, Mercato et CV',
    };
  }
  if (resolved === 'supporter') {
    return {
      label: 'Univers Supporter',
      title: 'Fans et communauté',
      subtitle: 'Matchs live, suivis, débats et boutique tribune',
    };
  }
  if (resolved === 'sponsor') {
    return {
      label: 'Pro Day Sponsor',
      title: 'Votre marque sur le terrain',
      subtitle: 'Campagnes géo, ROI et réseau clubs. Espace marque dédié',
    };
  }
  return {
    label: brand.name,
    title: 'Votre univers ProDay',
    subtitle: 'Swipez pour parcourir chaque pôle',
  };
}
