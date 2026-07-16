import type { MainTabId } from '../mainTabConfig';

export const AMATEUR_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // Équipe
  'covoiturage', // Déplacements
  'recrutement', // Club
  'profil', // Moi
];

/** Onglets accessibles via le menu overflow (doc §4.1). */
export const AMATEUR_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'matchs',
  'messages',
  'reels',
  'sante',
  'feed',
  'shop',
];

export const AMATEUR_COACH_SHELL_TABS: MainTabId[] = [
  'home', // Équipe
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
  'recrutement', // Recrutement
  'matchs', // Calendrier
  'messages', // Communication
  'shop',
  'profil', // Vitrine
];

export const PRO_PLAYER_SHELL_TABS: MainTabId[] = [
  'home', // Carrière
  'reels', // Réels
  'matchs', // Groupe
  'profil', // Moi
];

/** Onglets joueur pro accessibles via le menu (RDV santé, messages…). */
export const PRO_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'sante',
  'messages',
  'recrutement',
  'shop',
];

export const PRO_COACH_SHELL_TABS: MainTabId[] = [
  'home',
  'matchs',
  'recrutement',
  'covoiturage',
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
  'matchs',
  'recrutement',
  'feed',
  'messages',
  'shop',
  'profil',
];

