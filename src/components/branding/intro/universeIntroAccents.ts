import type { CarouselPoleId } from '../../../models/CarouselPole';
import { santeColorOverrides } from '../../../theme/prodaySanteTheme';
import { PRODAY_POLE_ACCENTS } from '../../../theme/prodayBrand';

/** Accents officiels pôle (intro univers) — planche brand. */
export const UNIVERSE_ACCENT: Record<CarouselPoleId, string> = {
  joueur: PRODAY_POLE_ACCENTS.player,
  amateur: PRODAY_POLE_ACCENTS.player,
  supporter: PRODAY_POLE_ACCENTS.supporter,
  pro_player: PRODAY_POLE_ACCENTS.player,
  pro_club: PRODAY_POLE_ACCENTS.club,
  president: PRODAY_POLE_ACCENTS.president,
  coach: PRODAY_POLE_ACCENTS.coach,
  pro_staff: PRODAY_POLE_ACCENTS.coach,
  parent: PRODAY_POLE_ACCENTS.parent,
  evenements: PRODAY_POLE_ACCENTS.events,
  sponsor: PRODAY_POLE_ACCENTS.sponsor,
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
