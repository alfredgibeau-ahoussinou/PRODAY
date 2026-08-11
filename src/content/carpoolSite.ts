import { typography, FLASH_CYAN, FLASH_CYAN_DIM } from '../theme/designTokens';
import { fontFamily } from '../theme/typography';

/**
 * Covoiturage — cockpit clair & interactif (jour / mobilité).
 * Cyan FLASH, surfaces blanches, cibles tactiles larges.
 */
export const CARPOOL_SITE = {
  sky: '#E8F4F8',
  asphalt: '#0B1220',
  asphaltRaised: '#FFFFFF',
  asphaltLane: '#D7E8EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F9FB',
  fog: 'rgba(11, 18, 32, 0.08)',
  lane: 'rgba(11, 18, 32, 0.14)',
  laneDash: 'rgba(8, 145, 178, 0.45)',
  signal: FLASH_CYAN,
  signalSoft: 'rgba(34, 211, 238, 0.16)',
  signalDeep: FLASH_CYAN_DIM,
  signalMuted: 'rgba(34, 211, 238, 0.35)',
  ink: '#0B1220',
  inkMuted: '#5B6B7C',
  inkDim: '#8A9AAB',
  live: '#EF4444',
  wash: ['#D9F0F6', '#E8F4F8', '#F4FAFC'] as [string, string, string],
  heroWash: ['#CFF0F8', '#E8F4F8'] as [string, string],
  horizon: ['rgba(34,211,238,0)', 'rgba(34,211,238,0.22)', 'rgba(34,211,238,0)'] as [
    string,
    string,
    string,
  ],
  display: fontFamily.displayBold,
  body: typography.fontFamily,
} as const;
