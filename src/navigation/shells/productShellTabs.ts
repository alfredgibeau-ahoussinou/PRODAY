import type { MainTabId } from '../mainTabConfig';

/**
 * Pôle joueur — 5 onglets dock : Accueil · Matchs · Saison · Profil · Plus.
 * Secondaires (équipe, reels, messages, covoit, shop…) via hub Plus.
 */

export const AMATEUR_PLAYER_SHELL_TABS: MainTabId[] = [
  'home',
  'matchs',
  'feed',
  'profil',
  'plus',
];

export const AMATEUR_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'progression',
  'recrutement',
  'reels',
  'messages',
  'covoiturage',
  'shop',
];

export const AMATEUR_COACH_SHELL_TABS: MainTabId[] = [
  'home',
  'matchs',
  'feed',
  'messages',
  'profil',
];

export const AMATEUR_COACH_OVERFLOW_TABS: MainTabId[] = [
  'covoiturage',
  'recrutement',
  'shop',
];

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
  'home',
  'matchs',
  'feed',
  'reels',
  'profil',
];

export const SUPPORTER_OVERFLOW_TABS: MainTabId[] = ['messages', 'shop'];

export const PRO_CLUB_SHELL_TABS: MainTabId[] = [
  'home',
  'recrutement',
  'matchs',
  'messages',
  'profil',
];

export const PRO_CLUB_OVERFLOW_TABS: MainTabId[] = ['covoiturage', 'shop'];

export const PRO_PLAYER_SHELL_TABS: MainTabId[] = [
  'home',
  'matchs',
  'feed',
  'profil',
  'plus',
];

export const PRO_PLAYER_OVERFLOW_TABS: MainTabId[] = [
  'progression',
  'recrutement',
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
