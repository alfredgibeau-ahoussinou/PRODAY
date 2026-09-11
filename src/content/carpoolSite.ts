import { typography, FLASH_CYAN, FLASH_CYAN_DIM } from '../theme/designTokens';
import { fontFamily } from '../theme/typography';

/**
 * Covoiturage — cockpit clair & interactif (jour / mobilité).
 * Cyan FLASH, surfaces blanches, cibles tactiles larges.
 */
export const CARPOOL_SITE = {
  sky: '#000000',
  asphalt: '#FFFFFF',
  asphaltRaised: '#14141A',
  asphaltLane: '#22222E',
  surface: '#14141A',
  surfaceMuted: '#1C1D26',
  fog: 'rgba(255, 255, 255, 0.08)',
  lane: '#22222E',
  laneDash: 'rgba(255, 255, 255, 0.2)',
  signal: FLASH_CYAN,
  signalSoft: 'rgba(34, 211, 238, 0.16)',
  signalDeep: FLASH_CYAN_DIM,
  signalMuted: 'rgba(34, 211, 238, 0.35)',
  ink: '#FFFFFF',
  inkMuted: '#A1A1AA',
  inkDim: '#71717A',
  live: '#EF4444',
  wash: ['#14141A', '#000000', '#000000'] as [string, string, string],
  heroWash: ['#14141A', '#000000'] as [string, string],
  horizon: ['rgba(34,211,238,0)', 'rgba(34,211,238,0.22)', 'rgba(34,211,238,0)'] as [
    string,
    string,
    string,
  ],
  display: fontFamily.extrabold,
  body: fontFamily.regular,
} as const;
