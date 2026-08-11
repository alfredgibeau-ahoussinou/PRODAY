/**
 * Navigation Football Operations Center — Admin ProDay.
 * Menu plat (1 clic = 1 page). Les sous-vues sont dans la page.
 */

import type { IconName } from '../components/ui/iconNames';

export type AdminFocSectionId =
  | 'dashboard'
  | 'adherents'
  | 'clubs'
  | 'matchs'
  | 'competitions'
  | 'recrutement'
  | 'performance'
  | 'communication'
  | 'finances'
  | 'video'
  | 'parametres';

export type AdminFocNavItem = {
  id: AdminFocSectionId;
  label: string;
  short: string;
  icon: IconName;
};

export const ADMIN_FOC_NAV: AdminFocNavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', short: 'Accueil', icon: 'home' },
  { id: 'adherents', label: 'Adhérents', short: 'Adhérents', icon: 'people' },
  { id: 'clubs', label: 'Clubs & équipes', short: 'Clubs', icon: 'business' },
  { id: 'matchs', label: 'Matchs', short: 'Matchs', icon: 'football' },
  { id: 'competitions', label: 'Compétitions', short: 'Compét.', icon: 'trophy' },
  { id: 'recrutement', label: 'Recrutement', short: 'Recrut.', icon: 'handshake' },
  { id: 'performance', label: 'Performance', short: 'Perf.', icon: 'star-four-points' },
  { id: 'communication', label: 'Communication', short: 'Com.', icon: 'chat' },
  { id: 'finances', label: 'Finances', short: 'Finance', icon: 'bag' },
  { id: 'video', label: 'Caméras & vidéo', short: 'Vidéo', icon: 'videocam' },
  { id: 'parametres', label: 'Paramètres', short: 'Réglages', icon: 'settings' },
];

/** Sous-onglets par section (affichés dans la page, pas dans le menu). */
export const ADMIN_FOC_TABS: Record<
  AdminFocSectionId,
  { id: string; label: string }[]
> = {
  dashboard: [{ id: 'overview', label: 'Vue d’ensemble' }],
  adherents: [
    { id: 'all', label: 'Tous' },
    { id: 'player', label: 'Joueurs' },
    { id: 'youth', label: 'Monde -13' },
    { id: 'teen', label: '13–17' },
    { id: 'adult', label: '18+' },
    { id: 'parent', label: 'Parents' },
    { id: 'coach', label: 'Coachs' },
    { id: 'club', label: 'Dirigeants' },
    { id: 'decisions', label: 'À valider' },
  ],
  clubs: [
    { id: 'clubs', label: 'Clubs' },
    { id: 'teams', label: 'Équipes' },
  ],
  matchs: [
    { id: 'all', label: 'Calendrier' },
    { id: 'upcoming', label: 'À venir' },
    { id: 'done', label: 'Résultats' },
    { id: 'invites', label: 'Invitations' },
  ],
  competitions: [
    { id: 'events', label: 'Événements' },
    { id: 'tournaments', label: 'Tournois' },
  ],
  recrutement: [
    { id: 'bassin', label: 'Bassin' },
    { id: 'posts', label: 'Annonces' },
    { id: 'apps', label: 'Candidatures' },
    { id: 'players', label: 'Joueurs' },
  ],
  performance: [
    { id: 'stats', label: 'Statistiques' },
    { id: 'traffic', label: 'Trafic' },
  ],
  communication: [
    { id: 'decisions', label: 'Décisions' },
    { id: 'messages', label: 'Messages' },
    { id: 'annonces', label: 'Annonces' },
    { id: 'fil', label: 'Fil plateforme' },
    { id: 'questions', label: 'Question semaine' },
  ],
  finances: [
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'paiements', label: 'Paiements club' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'boutique', label: 'Boutique' },
  ],
  video: [
    { id: 'cameras', label: 'Caméras' },
    { id: 'videos', label: 'Vidéos' },
  ],
  parametres: [
    { id: 'personnaliser', label: 'Personnaliser' },
    { id: 'systeme', label: 'Système' },
    { id: 'audit', label: 'Audit' },
    { id: 'beta', label: 'Bêta' },
  ],
};

export const ADMIN_FOC_SIDEBAR_WIDTH = 248;
export const ADMIN_FOC_SIDEBAR_COLLAPSED = 72;
export const ADMIN_FOC_TOPBAR_HEIGHT = 56;

export const DEFAULT_FOC_DASHBOARD_ORDER = [
  'kpis',
  'activity',
  'matchs',
  'decisions',
  'recrutement',
] as const;

export type FocDashboardBlockId = (typeof DEFAULT_FOC_DASHBOARD_ORDER)[number];

/** @deprecated — anciens ids feuille (compat prefs / tests) */
export type AdminFocLeafId = AdminFocSectionId;
