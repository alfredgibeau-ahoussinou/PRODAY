import type { IconName } from '../components/ui/Icon';
import type { ParentTabId } from '../features/parent/navigation/parentNavConfig';

export type ParentPageIdentity = {
  id: ParentTabId;
  eyebrow: string;
  title: string;
  support: string;
  icon: IconName;
};

export const PARENT_SITE = {
  bg: '#0A0F0E',
  accent: '#14B8A6',
  accentSoft: 'rgba(20, 184, 166, 0.14)',
  ink: '#F0FDFA',
  muted: 'rgba(204, 251, 241, 0.65)',
} as const;

export const PARENT_PAGES: Record<ParentTabId, ParentPageIdentity> = {
  home: {
    id: 'home',
    eyebrow: 'Parent',
    title: 'Accueil',
    support: 'Présence samedi · alertes · contrôles.',
    icon: 'home',
  },
  enfant: {
    id: 'enfant',
    eyebrow: 'Enfant',
    title: 'Profil supervisé',
    support: 'Identité sportive en lecture seule · contrôles actifs.',
    icon: 'person',
  },
  guide: {
    id: 'guide',
    eyebrow: 'Guide IA',
    title: 'Suggestions',
    support: 'Pistes actionnables sur l’enfant, vous, et ce que vous pouvez faire.',
    icon: 'star-four-points',
  },
  plus: {
    id: 'plus',
    eyebrow: 'Menu',
    title: 'Outils famille',
    support: 'Messages, agenda et trajet — sans surcharger le dock.',
    icon: 'menu',
  },
  messages: {
    id: 'messages',
    eyebrow: 'Messagerie',
    title: 'Contacts & fils',
    support: 'Approuver, bloquer, lire — vous restez le filtre.',
    icon: 'chat',
  },
  agenda: {
    id: 'agenda',
    eyebrow: 'Planning',
    title: 'Agenda',
    support: 'Je viens / absent en un tap · retard si besoin.',
    icon: 'calendar',
  },
  trajet: {
    id: 'trajet',
    eyebrow: 'Mobilité',
    title: 'Trajet live',
    support: 'Suivre la position si le partage est activé.',
    icon: 'car',
  },
  reglages: {
    id: 'reglages',
    eyebrow: 'Profil',
    title: 'Réglages',
    support: 'Temps d’écran, vie privée, urgences et pôles.',
    icon: 'settings',
  },
};
