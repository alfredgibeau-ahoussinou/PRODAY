import { CARPOOL_SITE } from '../content/carpoolSite';
import type { CoachThemeTokens } from './coachTeamTheme';

export type CarpoolUiPalette = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkMuted: string;
  inkDim: string;
  signal: string;
  signalSoft: string;
  signalDeep: string;
  lane: string;
  fog: string;
  onSignal: string;
};

export function carpoolPaletteDefault(): CarpoolUiPalette {
  return {
    bg: CARPOOL_SITE.sky,
    surface: CARPOOL_SITE.surface,
    surfaceMuted: CARPOOL_SITE.surfaceMuted,
    ink: CARPOOL_SITE.ink,
    inkMuted: CARPOOL_SITE.inkMuted,
    inkDim: CARPOOL_SITE.inkDim,
    signal: CARPOOL_SITE.signal,
    signalSoft: CARPOOL_SITE.signalSoft,
    signalDeep: CARPOOL_SITE.signalDeep,
    lane: CARPOOL_SITE.lane,
    fog: CARPOOL_SITE.fog,
    onSignal: CARPOOL_SITE.asphalt,
  };
}

export function carpoolPaletteFromCoach(tokens: CoachThemeTokens): CarpoolUiPalette {
  return {
    bg: tokens.bg,
    surface: tokens.surface,
    surfaceMuted: tokens.elevated,
    ink: tokens.foreground,
    inkMuted: tokens.muted,
    inkDim: tokens.muted,
    signal: tokens.accent,
    signalSoft: tokens.soft,
    signalDeep: tokens.deep,
    lane: tokens.border,
    fog: tokens.border,
    onSignal: tokens.onAccent,
  };
}
