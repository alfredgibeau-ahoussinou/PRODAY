import type { CarouselPoleId } from '../../../models/CarouselPole';
import { santeColorOverrides } from '../../../theme/prodaySanteTheme';
import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../../../theme/prodayBrand';

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

/** Soft pour glows / surfaces — dérivé des accents brand. */
export const UNIVERSE_ACCENT_SOFT: Record<CarouselPoleId, string> = {
  joueur: poleAccentSoft('player', 0.22),
  amateur: poleAccentSoft('player', 0.22),
  supporter: poleAccentSoft('supporter', 0.22),
  pro_player: poleAccentSoft('player', 0.22),
  pro_club: poleAccentSoft('club', 0.22),
  president: poleAccentSoft('president', 0.22),
  coach: poleAccentSoft('coach', 0.22),
  pro_staff: poleAccentSoft('coach', 0.22),
  parent: poleAccentSoft('parent', 0.22),
  evenements: poleAccentSoft('events', 0.22),
  sponsor: poleAccentSoft('sponsor', 0.22),
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
  evenements: 'Événements',
  sponsor: 'Sponsor',
  sante: 'Santé',
};
