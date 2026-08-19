import type { ProDayCardTier } from '../models/ProDayCard';

/** Palette FUT 18 Color Premium — dégradés riches, jamais blanc plat. */
export const FUT18_TIER_THEME: Record<
  ProDayCardTier,
  {
    frame: [string, string, string];
    face: [string, string, string];
    ink: string;
    inkMuted: string;
    plate: string;
    rim: string;
  }
> = {
  bronze: {
    frame: ['#E8C4A0', '#A67C52', '#5C3820'],
    face: ['#8B5A2B', '#6B4423', '#3D2814'],
    ink: '#FFF4E6',
    inkMuted: 'rgba(255,244,230,0.72)',
    plate: 'rgba(28,16,8,0.55)',
    rim: 'rgba(232,196,160,0.45)',
  },
  silver: {
    frame: ['#E8EEF5', '#9AABB8', '#5A6A78'],
    face: ['#4A5A68', '#3A4854', '#1E2830'],
    ink: '#F0F4F8',
    inkMuted: 'rgba(240,244,248,0.72)',
    plate: 'rgba(20,28,36,0.55)',
    rim: 'rgba(200,210,220,0.4)',
  },
  gold: {
    frame: ['#FFF0A8', '#E8C040', '#A07818'],
    face: ['#C9A018', '#9A7810', '#5C4808'],
    ink: '#FFF8E0',
    inkMuted: 'rgba(255,248,224,0.75)',
    plate: 'rgba(40,28,4,0.58)',
    rim: 'rgba(255,240,168,0.5)',
  },
  elite: {
    frame: ['#6EE7D8', '#14B8A6', '#0D6B5E'],
    face: ['#0F766E', '#115E59', '#042F2E'],
    ink: '#ECFDF5',
    inkMuted: 'rgba(236,253,245,0.75)',
    plate: 'rgba(0,0,0,0.45)',
    rim: 'rgba(110,231,216,0.42)',
  },
  legend: {
    frame: ['#E9B8FF', '#A855F7', '#581C87'],
    face: ['#6B21A8', '#4C1D95', '#2E1065'],
    ink: '#FAF5FF',
    inkMuted: 'rgba(250,245,255,0.75)',
    plate: 'rgba(0,0,0,0.5)',
    rim: 'rgba(233,184,255,0.42)',
  },
};

/** Accents dock / surfaces pool joueur. */
export const FUT18_PREMIUM = {
  pitchGreen: '#22C55E',
  pitchGreenSoft: 'rgba(34,197,94,0.18)',
  nightBlue: '#0E1A2E',
  nightDeep: '#070B14',
  goldAccent: '#E8C872',
  goldSoft: 'rgba(232,200,114,0.22)',
  cardShadow: 'rgba(0,0,0,0.35)',
  dockBorder: 'rgba(255,255,255,0.12)',
  panelBg: 'rgba(10,16,28,0.92)',
  panelBorder: 'rgba(255,255,255,0.08)',
} as const;
