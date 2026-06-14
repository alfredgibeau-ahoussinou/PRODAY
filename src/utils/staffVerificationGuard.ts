import { Alert } from 'react-native';
import type { User } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { profileService } from '../services/profile.service';

const VERIFICATION_MESSAGE =
  'Validez votre diplôme ou licence depuis l’onglet Profil pour accéder à cette action.';

export function isStaffVerificationPending(profile: User | null | undefined): boolean {
  if (!profile) return false;
  return (
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile)
  );
}

/** Retourne false si l’action staff sensible doit être bloquée. */
export function guardStaffVerification(profile: User | null | undefined): profile is User {
  if (!profile) return false;
  if (!isStaffVerificationPending(profile)) return true;
  Alert.alert('Vérification requise', VERIFICATION_MESSAGE);
  return false;
}
