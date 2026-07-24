import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { PlayerSegment } from '../utils/playerSegment';
import { isFemalePlayerPresentation } from '../utils/playerSegment';

export function getMercatoTabLabel(
  line: ProductLineId,
  role?: UserRole | null,
  playerSegment?: PlayerSegment | null,
): string {
  if (isFemalePlayerPresentation(playerSegment, line)) return 'Mercato F';
  if (line === 'sante') return 'Annuaire santé';
  if (line === 'amateur') return 'Mercato Amateur';
  if (line === 'pro' || line === 'pro_club' || line === 'pro_staff') return 'Mercato Pro';
  if (line === 'pro_player' || line === 'homme') {
    return role === 'player' ? 'Candidater' : 'Mercato Pro';
  }
  if (role === 'player') return 'Candidater';
  return 'Mercato';
}
