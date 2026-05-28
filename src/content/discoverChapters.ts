import type { IconName } from '../components/ui/Icon';
import { SHOWCASE_IMAGES } from './showcaseAssets';

export type DiscoverChapterId =
  | 'welcome'
  | 'live'
  | 'universe'
  | 'journey'
  | 'experience';

export interface DiscoverChapter {
  id: DiscoverChapterId;
  label: string;
  short: string;
}

export const DISCOVER_CHAPTERS: DiscoverChapter[] = [
  { id: 'welcome', label: 'Accueil', short: '01' },
  { id: 'live', label: 'Live', short: '02' },
  { id: 'universe', label: 'Univers', short: '03' },
  { id: 'journey', label: 'Parcours', short: '04' },
  { id: 'experience', label: 'Expérience', short: '05' },
];

export type IntroSlideAction = 'signup' | 'live' | 'modules' | 'arena' | 'sponsors';

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
    kicker: 'PRODAY',
    title: 'Une saison.\nUne app.',
    body: 'Joueurs, clubs, coachs et sponsors — connectés sur le terrain et en dehors.',
    image: SHOWCASE_IMAGES.discoverHero,
    icon: 'home',
    cta: 'Explorer',
    action: 'live',
  },
  {
    id: 'community',
    kicker: 'COMMUNAUTÉ LIVE',
    title: 'Des chiffres\nréels.',
    body: 'Stats Firebase, annonces Mercato et tournois Arena — rien n’est inventé.',
    image: SHOWCASE_IMAGES.expPulse,
    icon: 'star-four-points',
    cta: 'Voir le live',
    action: 'live',
  },
  {
    id: 'mercato',
    kicker: 'MERCATO',
    title: 'Recrute.\nProgresse.',
    body: 'Annonces, candidatures, détections — le mercato amateur enfin structuré.',
    image: SHOWCASE_IMAGES.mercatoDetection,
    icon: 'search',
    cta: 'Découvrir',
    action: 'modules',
  },
  {
    id: 'arena',
    kicker: 'ARENA',
    title: 'Tournois\n& palmarès.',
    body: 'Inscriptions club, statuts live et récompenses publiées par l’organisateur.',
    image: SHOWCASE_IMAGES.arenaTournament,
    icon: 'trophy',
    cta: 'Aperçu Arena',
    action: 'arena',
  },
  {
    id: 'join',
    kicker: 'REJOINDRE',
    title: 'Crée ton\ncompte.',
    body: 'Gratuit. Unique. Pensé pour ceux qui vivent le sport pour de vrai.',
    image: SHOWCASE_IMAGES.playerProfile,
    icon: 'person',
    cta: 'Commencer',
    action: 'signup',
  },
];

export interface DiscoverUniverseCard {
  id: 'recrutement' | 'matchs' | 'arena' | 'sponsors';
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
    id: 'arena',
    title: 'Arena',
    subtitle: 'Tournois locaux',
    image: SHOWCASE_IMAGES.arenaTournament,
    icon: 'trophy',
    accent: '#525252',
  },
  {
    id: 'sponsors',
    title: 'Sponsors',
    subtitle: 'Partenaires & financement',
    image: SHOWCASE_IMAGES.coachFounder,
    icon: 'star',
    accent: '#737373',
  },
];
