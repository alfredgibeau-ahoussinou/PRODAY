import type { IconName } from '../components/ui/iconNames';
import type { ProDayModuleId } from './prodayModules';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export type DiscoverChapterId =
  | 'welcome'
  | 'explore'
  | 'live'
  | 'journey'
  | 'join';

export interface DiscoverChapter {
  id: DiscoverChapterId;
  label: string;
  short: string;
}

export const DISCOVER_CHAPTERS: DiscoverChapter[] = [
  { id: 'welcome', label: 'Accueil', short: '1' },
  { id: 'explore', label: 'Pôles', short: '2' },
  { id: 'live', label: 'Direct', short: '3' },
  { id: 'journey', label: 'Parcours', short: '4' },
  { id: 'join', label: 'Rejoindre', short: '5' },
];

export type IntroSlideAction = 'signup' | 'live' | 'modules' | 'sponsors';

export interface DiscoverIntroSlide {
  id: string;
  kicker: string;
  title: string;
  body: string;
  image: number;
  icon: IconName;
  cta: string;
  action: IntroSlideAction;
}

export const DISCOVER_INTRO_SLIDES: DiscoverIntroSlide[] = [
  {
    id: 'welcome',
    kicker: 'PRO DAY MAN',
    title: 'Une saison.\nUne app.',
    body: 'Mercato, matchs et sponsors. Tout pour votre saison amateur.',
    image: SHOWCASE_IMAGES.discoverHero,
    icon: 'home',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'modules',
    kicker: 'VOS PILIERS',
    title: 'Mercato,\nmatchs, club.',
    body: 'Les pôles ProDay. Recrutement, saison et sponsors en un tap.',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    cta: 'Voir les pôles',
    action: 'modules',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Compte\ngratuit.',
    body: 'Créez votre profil en quelques minutes et débloquez toute l’app.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'person',
    cta: 'Commencer',
    action: 'signup',
  },
];

export interface DiscoverUniverseCard {
  id: ProDayModuleId;
  title: string;
  subtitle: string;
  image: number;
  icon: IconName;
  accent: string;
}

export const DISCOVER_UNIVERSE_CARDS: DiscoverUniverseCard[] = [
  {
    id: 'recrutement',
    title: 'Mercato',
    subtitle: 'Annonces & candidatures',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    accent: '#0A0A0A',
  },
  {
    id: 'matchs',
    title: 'Matchs',
    subtitle: 'Amicaux & convocations',
    image: SHOWCASE_IMAGES.friendlyMatch,
    icon: 'handshake',
    accent: '#262626',
  },
  {
    id: 'smart_tactics',
    title: 'Tactique IA',
    subtitle: 'Board · readiness · IA',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'football',
    accent: '#1B5E20',
  },
  {
    id: 'sponsors',
    title: 'Sponsors',
    subtitle: 'Sponsors & financement',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star',
    accent: '#737373',
  },
];
