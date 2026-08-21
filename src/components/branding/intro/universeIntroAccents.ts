import type { CarouselPoleId } from '../../../models/CarouselPole';
import { santeColorOverrides } from '../../../theme/prodaySanteTheme';

/** Accents lisibles sur fond FLASH sombre (intro univers). */
export const UNIVERSE_ACCENT: Record<CarouselPoleId, string> = {
  joueur: '#1D4ED8',
  amateur: '#1D4ED8',
  supporter: '#7C3AED',
  pro_player: '#1D4ED8',
  pro_club: '#0369A1',
  president: '#D4B880',
  coach: '#4338CA',
  pro_staff: '#4338CA',
  parent: '#0F766E',
  evenements: '#0891B2',
  sponsor: '#D4AF37',
  /** Teal clair — pas MEDICAL #0F766E (illisible sur noir). */
  sante: santeColorOverrides.accent,
};

export const UNIVERSE_ACCENT_SOFT: Record<CarouselPoleId, string> = {
  joueur: '#DBEAFE',
  amateur: '#DBEAFE',
  supporter: '#EDE9FE',
  pro_player: '#DBEAFE',
  pro_club: '#E0F2FE',
  president: '#F2E6C8',
  coach: '#E0E7FF',
  pro_staff: '#E0E7FF',
  parent: '#CCFBF1',
  evenements: '#CFFAFE',
  sponsor: '#FEF3C7',
  sante: santeColorOverrides.accentSoft,
};

export const UNIVERSE_SHORT: Record<CarouselPoleId, string> = {
  joueur: 'Joueur',
  amateur: 'Joueur',
  supporter: 'Supporter',
  pro_player: 'Joueur',
  pro_club: 'Club',
  president: 'Président',
  coach: 'Coach',
  pro_staff: 'Coach',
  parent: 'Parent',
  evenements: 'Club',
  sponsor: 'Sponsor',
  sante: 'Santé',
};
