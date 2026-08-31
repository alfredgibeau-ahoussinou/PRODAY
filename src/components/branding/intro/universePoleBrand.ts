import type { CarouselPoleId } from '../../../models/CarouselPole';
import type { ProDayBrandVariant } from '../../../theme/prodayBrand';
import type { IconName } from '../../ui/iconNames';
import { UNIVERSE_SHORT } from './universeIntroAccents';

/** Variante brand officielle pour un pôle carousel. */
export function brandVariantForCarouselPole(pole: CarouselPoleId): ProDayBrandVariant {
  switch (pole) {
    case 'joueur':
    case 'amateur':
    case 'pro_player':
      return 'player';
    case 'coach':
    case 'pro_staff':
      return 'coach';
    case 'pro_club':
      return 'club';
    case 'evenements':
      return 'events';
    case 'president':
      return 'president';
    case 'parent':
      return 'parent';
    case 'supporter':
      return 'supporter';
    case 'sponsor':
      return 'sponsor';
    case 'admin':
      return 'admin';
    case 'sante':
      return 'master';
    default:
      return 'master';
  }
}

/** Icône rôle (planche brand) — Icon existants, pas d’emoji device. */
export function universePoleIcon(pole: CarouselPoleId): IconName {
  switch (pole) {
    case 'admin':
      return 'shield';
    case 'joueur':
    case 'amateur':
    case 'pro_player':
      return 'person';
    case 'coach':
    case 'pro_staff':
      return 'school';
    case 'pro_club':
    case 'evenements':
      return 'shield';
    case 'president':
      return 'star';
    case 'parent':
      return 'people';
    case 'supporter':
      return 'flag';
    case 'sponsor':
      return 'handshake';
    case 'sante':
      return 'heart';
    default:
      return 'football';
  }
}

export function universePoleDisplayName(pole: CarouselPoleId): string {
  return UNIVERSE_SHORT[pole];
}

/** Micro-tagline planche — une ligne courte sous le nom du pôle (≤ ~60 car.). */
const UNIVERSE_POLE_TAGLINE: Record<CarouselPoleId, string> = {
  joueur: 'Performance · Développement',
  amateur: 'Performance · Développement',
  pro_player: 'Performance · Développement',
  coach: 'Transmettre · Guider',
  pro_staff: 'Transmettre · Guider',
  pro_club: 'Structurer · Grandir ensemble',
  evenements: 'Structurer · Grandir ensemble',
  president: 'Piloter · Décider',
  parent: 'Accompagner · Soutenir',
  supporter: 'Vivre · Encourager',
  sponsor: 'Visibilité · Impact local',
  sante: 'Prévention · Suivi médical',
  admin: 'Pilotage exécutif · Décision & Contrôle',
};

export function universePoleTagline(pole: CarouselPoleId): string {
  return UNIVERSE_POLE_TAGLINE[pole];
}

/** CTA « Entrer dans Coach / Club / … ». */
export function universeEnterCtaLabel(pole: CarouselPoleId): string {
  if (pole === 'admin') return 'Ouvrir le Cockpit Admin';
  return `Entrer dans ${universePoleDisplayName(pole)}`;
}
