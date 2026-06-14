import type { ProductLineId } from '../../models/ProductLine';
import { nextBaseColors, type NextColorPalette } from './tokens';

const MAN: NextColorPalette = {
  ...nextBaseColors,
  accent: '#00FF9C',
  accentSoft: 'rgba(0, 255, 156, 0.14)',
  accentGlow: 'rgba(0, 255, 156, 0.4)',
  gradientHero: ['#0A0B0F', '#0D1A14', '#06070A'],
  gradientSignal: ['#00FF9C', '#00C878'],
  voice: 'Performance · discipline · progression',
};

const WOMAN: NextColorPalette = {
  ...nextBaseColors,
  accent: '#FF6B9D',
  accentSoft: 'rgba(255, 107, 157, 0.14)',
  accentGlow: 'rgba(255, 107, 157, 0.4)',
  gradientHero: ['#0A0B0F', '#1A0D14', '#06070A'],
  gradientSignal: ['#FF6B9D', '#FF8FB3'],
  voice: 'Bien-être · santé · adaptation féminine',
};

const PRO: NextColorPalette = {
  ...nextBaseColors,
  accent: '#FFD166',
  accentSoft: 'rgba(255, 209, 102, 0.14)',
  accentGlow: 'rgba(255, 209, 102, 0.4)',
  gradientHero: ['#0A0B0F', '#1A1608', '#06070A'],
  gradientSignal: ['#FFD166', '#FFB020'],
  voice: 'Football pro · clubs · mercato · carrière',
};

const SANTE: NextColorPalette = {
  ...nextBaseColors,
  accent: '#5EEAD4',
  accentSoft: 'rgba(94, 234, 212, 0.14)',
  accentGlow: 'rgba(94, 234, 212, 0.35)',
  gradientHero: ['#0A0B0F', '#0A1618', '#06070A'],
  gradientSignal: ['#5EEAD4', '#2DD4BF'],
  voice: 'Soins · prévention · performance',
};

const THEMES: Record<ProductLineId, NextColorPalette> = {
  homme: MAN,
  woman: WOMAN,
  pro: PRO,
  sante: SANTE,
};

export function nextThemeForLine(line: ProductLineId): NextColorPalette {
  return THEMES[line] ?? MAN;
}

export function nextBrandName(line: ProductLineId): string {
  if (line === 'woman') return 'ProDay Women';
  if (line === 'pro') return 'ProDay Pro';
  if (line === 'sante') return 'ProDay Santé';
  return 'ProDay Man';
}
