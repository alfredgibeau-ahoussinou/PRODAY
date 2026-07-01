import type { CarouselPoleId } from '../../../models/CarouselPole';

export const UNIVERSE_ACCENT: Record<CarouselPoleId, string> = {
  amateur: '#EA580C',
  supporter: '#7C3AED',
  pro_player: '#1D4ED8',
  pro_club: '#0369A1',
  pro_staff: '#4338CA',
  sante: '#0F766E',
};

export const UNIVERSE_ACCENT_SOFT: Record<CarouselPoleId, string> = {
  amateur: '#FFEDD5',
  supporter: '#EDE9FE',
  pro_player: '#DBEAFE',
  pro_club: '#E0F2FE',
  pro_staff: '#E0E7FF',
  sante: '#CCFBF1',
};

export const UNIVERSE_SHORT: Record<CarouselPoleId, string> = {
  amateur: 'Amateur',
  supporter: 'Supporter',
  pro_player: 'Pro Joueur',
  pro_club: 'Pro Club',
  pro_staff: 'Pro Staff',
  sante: 'Santé',
};
