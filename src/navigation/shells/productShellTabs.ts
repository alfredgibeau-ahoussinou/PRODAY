import type { MainTabId } from '../mainTabConfig';

/**
 * Menus joueur type Instagram : 5 onglets primaires + overflow (⋯).
 * Autres rôles : shells métier inchangés.
 */

export const AMATEUR_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // Accueil
  'reels', // Reels
  'matchs', // Matchs
  'messages', // Messages
  'profil', // Moi
];

/** Secondaires joueur amateur — menu ⋯ */
export const AMATEUR_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'covoiturage',
  'recrutement', // Club
  'sante',
  'feed',
  'shop',
];

export const AMATEUR_COACH_SHELL_TABS: MainTabId[] = [
  'home', // Équipe
  'covoiturage',
  'matchs',
  'recrutement', // Club
  'messages',
  'shop',
  'profil', // Moi
];

export const SUPPORTER_SHELL_TABS: MainTabId[] = [
  'home', // Tribune
  'matchs',
  'feed', // Suivis
  'messages', // Communauté
  'reels', // Moments
  'shop',
  'profil', // Compte
];

export const PRO_CLUB_SHELL_TABS: MainTabId[] = [
  'home', // Structure
  'covoiturage',
  'recrutement', // Recrutement
  'matchs', // Calendrier
  'messages', // Communication
  'shop',
  'profil', // Vitrine
];

export const PRO_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // Carrière
  'reels', // Reels
  'matchs', // Matchs
  'messages', // Messages
  'profil', // Moi
];

/** Secondaires joueur pro — menu ⋯ */
export const PRO_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'covoiturage',
  'recrutement', // Opportunités
  'sante',
  'shop',
];

export const PRO_COACH_SHELL_TABS: MainTabId[] = [
  'home',
  'covoiturage',
  'matchs',
  'recrutement',
  'messages',
  'shop',
  'profil',
];

export const PRO_AGENT_SHELL_TABS: MainTabId[] = [
  'home',
  'recrutement',
  'matchs',
  'feed',
  'messages',
  'shop',
  'profil',
];

export const PRO_RECRUITER_SHELL_TABS: MainTabId[] = [
  'home',
  'recrutement',
  'matchs',
  'feed',
  'messages',
  'shop',
  'profil',
];

export const PRO_ORGANIZER_SHELL_TABS: MainTabId[] = [
  'home',
  'covoiturage',
  'matchs',
  'recrutement',
  'feed',
  'messages',
  'shop',
  'profil',
];
