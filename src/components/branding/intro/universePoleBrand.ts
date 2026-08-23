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
    case 'evenements':
      return 'club';
    case 'president':
      return 'president';
    case 'parent':
      return 'parent';
    case 'supporter':
      return 'supporter';
    case 'sponsor':
      return 'sponsor';
    case 'sante':
      return 'master';
    default:
      return 'master';
  }
}

/** Icône rôle (planche brand) — Icon existants, pas d’emoji device. */
export function universePoleIcon(pole: CarouselPoleId): IconName {
  switch (pole) {
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

/** CTA « Entrer dans l’univers X ». */
export function universeEnterCtaLabel(pole: CarouselPoleId): string {
  return `Entrer dans l’univers ${universePoleDisplayName(pole)}`;
}
