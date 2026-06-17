import type { User } from '../models/User';
import { isMinorUser } from './minor';

export function minorCarpoolBookingWarning(profile: User | null): string | null {
  if (!profile || !isMinorUser(profile)) return null;
  const settings = profile.parental_settings;
  if (!settings?.guardian_email && !settings?.guardian_name) {
    return 'Votre tuteur n’est pas enregistré. Demandez à un parent de valider votre compte avant de réserver un trajet.';
  }
  if (settings.supervision_enabled) {
    return 'Votre tuteur sera informé de cette réservation (compte mineur supervisé).';
  }
  return null;
}

export function canMinorBookCarpool(profile: User | null): boolean {
  if (!profile || !isMinorUser(profile)) return true;
  const settings = profile.parental_settings;
  return Boolean(settings?.guardian_email || settings?.guardian_name);
}
