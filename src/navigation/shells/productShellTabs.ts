import type { MainTabId } from '../mainTabConfig';

/**
 * Menus joueur type Instagram : 5 onglets primaires + overflow (⋯).
 * Autres rôles : shells métier inchangés.
 */

/** Accueil · Équipe · Matchs · Performance · Profil (+ overflow) */
export const AMATEUR_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // Accueil
  'recrutement', // Équipe (club)
  'matchs', // Matchs
  'feed', // Performance
  'profil', // Moi
];

/** Secondaires joueur amateur — menu ⋯ */
export const AMATEUR_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'reels',
  'messages',
  'covoiturage',
  'shop',
];

export const AMATEUR_COACH_SHELL_TABS: MainTabId[] = [
  'home', // Équipe (portail coach)
  'matchs', // Matchs
  'feed', // Performance (Smart Tactics)
  'messages',
  'profil', // Moi
];

export const AMATEUR_COACH_OVERFLOW_TABS: MainTabId[] = [
  'covoiturage',
  'recrutement',
  'shop',
];

/** Dirigeants club amateur — Accueil · Recrut. · Matchs · Comm. · Vitrine */
export const AMATEUR_CLUB_SHELL_TABS: MainTabId[] = [
  'home',
  'recrutement',
  'matchs',
  'messages',
  'profil',
];

export const AMATEUR_CLUB_OVERFLOW_TABS: MainTabId[] = [
  'feed',
  'covoiturage',
  'shop',
];

export const SUPPORTER_SHELL_TABS: MainTabId[] = [
  'home', // Tribune
  'matchs',
  'feed', // Suivis
  'messages', // Fil
  'profil', // Compte
];

/** Secondaires tribune — accessibles depuis Tribune / Compte. */
export const SUPPORTER_OVERFLOW_TABS: MainTabId[] = ['reels', 'shop'];

export const PRO_CLUB_SHELL_TABS: MainTabId[] = [
  'home', // Accueil cockpit A→Z
  'recrutement', // Pipeline + annonces
  'matchs', // Match Center
  'messages', // Communication
  'profil', // Vitrine
];

export const PRO_CLUB_OVERFLOW_TABS: MainTabId[] = [
  'covoiturage',
  'shop',
];

export const PRO_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // PLAY
  'recrutement', // SQUAD / opportunités
  'matchs', // MATCH
  'feed', // PERF / Smart Tactics
  'profil', // CARD
];

/** Secondaires joueur pro — menu PAUSE */
export const PRO_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'reels',
  'messages',
  'covoiturage',
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
