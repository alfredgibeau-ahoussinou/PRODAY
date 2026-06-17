import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';

export function getMercatoTabLabel(line: ProductLineId, role?: UserRole | null): string {
  if (line === 'woman') return 'Mercato F';
  if (line === 'sante') return 'Annuaire santé';
  if (line === 'pro') return 'Mercato Pro';
  if (role === 'player') return 'Candidater';
  return 'Mercato';
}
