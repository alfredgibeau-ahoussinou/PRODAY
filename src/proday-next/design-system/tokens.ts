export interface NextColorPalette {
  canvas: string;
  void: string;
  surface: string;
  surfaceRaised: string;
  surfaceGlass: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  gradientHero: readonly [string, string, string];
  gradientSignal: readonly [string, string];
  voice: string;
  warning: string;
  danger: string;
  info: string;
}

export const nextBaseColors: Omit<
  NextColorPalette,
  'accent' | 'accentSoft' | 'accentGlow' | 'gradientHero' | 'gradientSignal' | 'voice'
> = {
  canvas: '#0A0B0F',
  void: '#06070A',
  surface: '#12141A',
  surfaceRaised: '#1A1D26',
  surfaceGlass: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  warning: '#FFB020',
  danger: '#FF4D6A',
  info: '#60A5FA',
};
