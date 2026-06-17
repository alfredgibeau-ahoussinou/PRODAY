import type { User } from '../models/User';
import {
  ROLES_REQUIRING_VERIFICATION,
  computePlayerVerificationStatus,
} from '../models/User';

/** Compte en attente de revue admin (staff ou joueur). */
export function userNeedsAdminVerificationReview(user: User): boolean {
  if (user.role === 'player') {
    if (user.verification_status === 'PENDING') return true;
    if (user.player_verification) {
      return computePlayerVerificationStatus(user.player_verification) === 'PENDING';
    }
    return false;
  }
  if (!ROLES_REQUIRING_VERIFICATION.includes(user.role)) return false;
  return user.verification_status === 'PENDING';
}
