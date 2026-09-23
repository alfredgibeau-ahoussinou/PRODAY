/**
 * Identité visuelle Pôle Club — **palette mesurée sur la charte de référence**
 * (captures du 15/09/2026), décision D-011.
 *
 * Valeurs relevées au pixel, identiques dans les quatre captures fournies :
 * `bg #000000` · `surface #191E23` rgb(25,30,35) · `raised #262E33`
 * rgb(38,46,51) · tons de bord `#373D42` / `#414A51` · accent `#F8D548`
 * rgb(248,213,72) · contenu sur accent `#000000` · texte `#FFFFFF`.
 *
 * Les surfaces de la référence sont des **gris bleutés froids** (`B > G > R`),
 * pas des gris neutres ; les bordures restent des blancs alpha (DESIGN.md §2.2),
 * car posées sur `#191E23` un blanc à 0,08 reproduit exactement le ton de bord
 * mesuré (`#2B3035`, entre `#262E33` et `#373D42`).
 *
 * Les jetons **sémantiques** (`success`, `warning`, `danger`, `pitch`) restent
 * verts/rouges : « conforme », « en retard », « payé » ne se déduisent pas de la
 * couleur d'identité.
 */

import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../../../theme/prodayBrand';

/** Overlay shell — émeraude produit, pas la couleur d’équipe. */
export const CLUB_BG_WASH_HEX = '#F8D548';
export const CLUB_BG_WASH_TOP = 'rgba(248, 213, 72, 0.05)';
export const CLUB_BG_WASH_MID = 'rgba(248, 213, 72, 0.025)';

export type ClubThemeTokens = {
  bg: string;
  /**
   * Conteneur de niveau 1 (fonds internes, dégradés) — DESIGN.md §2.1
   * `bgElevated #0A0A0F`. La référence ne montre pas de niveau intermédiaire
   * entre le canvas noir et les cartes : on **conserve** donc la valeur du
   * socle plutôt que d'en inventer une (D-011).
   */
  bgElevated: string;
  /** Surface principale (cartes) — **mesurée** `#191E23`. */
  surface: string;
  /** Surface secondaire / chips — **mesurée** `#262E33`. */
  elevated: string;
  /**
   * Surface encore plus haute (modales, sheets, cartes pressées).
   * DESIGN.md §2.1 ne définit qu'une seule surface élevée : alias de `elevated`.
   */
  raised: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  /** Couleur secondaire (logo / club). */
  secondary: string;
  /** Texte / icônes sur fond accent. */
  onAccent: string;
  glow: string;
  /** Lavage header — noir (pas de teinte). */
  headerWash: string;
  /** Overlay émeraude très léger (haut du shell). */
  bgWash: string;
  bgWashMid: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  pitch: string;
  pitchSoft: string;
  scrim: string;
  isLight: boolean;
};

const CLUB = PRODAY_POLE_ACCENTS.club;

/** Tokens Club — palette mesurée sur la charte de référence (D-011). */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#000000',
  bgElevated: '#0A0A0F',
  surface: '#191E23',
  elevated: '#262E33',
  raised: '#262E33',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  foreground: '#FFFFFF',
  muted: '#8B8B9A',
  faint: 'rgba(139, 139, 154, 0.72)',
  accent: CLUB,
  accentSoft: poleAccentSoft('club', 0.22),
  /** Or assombri — relevé sur l'antialiasing du FAB or/noir de la référence. */
  accentDeep: '#9F8629',
  /** Or éclairci, pour les accents secondaires sur fond sombre. */
  secondary: '#FAE076',
  /** Contenu posé sur l'or : **noir**, mesuré dans les trois captures. */
  onAccent: '#000000',
  glow: poleAccentSoft('club', 0.5),
  headerWash: '#000000',
  bgWash: CLUB_BG_WASH_TOP,
  bgWashMid: CLUB_BG_WASH_MID,
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.16)',
  pitch: '#059669',
  /** Apparié à `pitch` (vert terrain), pas à l'accent d'identité. */
  pitchSoft: 'rgba(5, 150, 105, 0.28)',
  scrim: 'rgba(0, 0, 0, 0.78)',
  isLight: false,
};

/** Chrome site/legacy — noir + accents or de la référence (pas de wash fond). */
export const CLUB_SITE_LEGACY = {
  accent: CLUB,
  deep: '#9F8629',
  soft: poleAccentSoft('club', 0.22),
  glow: poleAccentSoft('club', 0.35),
  bg: '#000000',
  bgElevated: '#0A0A0F',
  band: '#000000',
  surface: '#191E23',
  elevated: '#262E33',
  border: 'rgba(255, 255, 255, 0.08)',
  foreground: '#FFFFFF',
  muted: '#8B8B9A',
  pitchDeep: '#064E3B',
  pitch: CLUB_TOKENS.pitch,
  pitchLight: '#34D399',
} as const;
