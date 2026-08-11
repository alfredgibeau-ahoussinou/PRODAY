import type { IconName } from '../components/ui/Icon';

export type ParentPageId =
  | 'home'
  | 'profil'
  | 'messages'
  | 'agenda'
  | 'trajet'
  | 'reglages';

export type ParentPageIdentity = {
  id: ParentPageId;
  eyebrow: string;
  title: string;
  support: string;
  icon: IconName;
  wash: readonly [string, string, string];
};

export const PARENT_SITE = {
  bg: '#041f1e',
  accent: '#14B8A6',
  accentSoft: 'rgba(20, 184, 166, 0.16)',
  glow: 'rgba(45, 212, 191, 0.22)',
  ink: '#F0FDFA',
  muted: 'rgba(204, 251, 241, 0.72)',
} as const;

const WASH: readonly [string, string, string] = ['#042f2e', '#0a1f1e', '#041f1e'];

export const PARENT_PAGES: Record<ParentPageId, ParentPageIdentity> = {
  home: {
    id: 'home',
    eyebrow: 'Cockpit famille',
    title: 'À faire maintenant',
    support: 'Déblocages, retards, messages et contrôles — en un geste.',
    icon: 'home',
    wash: WASH,
  },
  profil: {
    id: 'profil',
    eyebrow: 'Enfant lié',
    title: 'Profil supervisé',
    support: 'Identité sportive en lecture seule · contrôles parentaux actifs.',
    icon: 'person',
    wash: WASH,
  },
  messages: {
    id: 'messages',
    eyebrow: 'Messagerie',
    title: 'Contacts & fils',
    support: 'Approuver, bloquer, lire — vous restez le filtre.',
    icon: 'chat',
    wash: WASH,
  },
  agenda: {
    id: 'agenda',
    eyebrow: 'Planning',
    title: 'Agenda & retards',
    support: 'Prévenir le coach si l’enfant ou vous êtes en retard.',
    icon: 'calendar',
    wash: WASH,
  },
  trajet: {
    id: 'trajet',
    eyebrow: 'Mobilité',
    title: 'Trajet live',
    support: 'Suivre la position si le partage est activé.',
    icon: 'car',
    wash: WASH,
  },
  reglages: {
    id: 'reglages',
    eyebrow: 'Contrôles',
    title: 'Réglages parentaux',
    support: 'Temps d’écran, vie privée, urgences et liaisons.',
    icon: 'settings',
    wash: WASH,
  },
};
