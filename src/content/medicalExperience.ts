import type { UserRole } from '../models/User';

/** Couleurs legacy (plans / thèmes). Pôle Santé retiré. */
export const MEDICAL_THEME = {
  primary: '#0F766E',
  primarySoft: '#CCFBF1',
  primaryBg: '#F0FDFA',
  primaryBorder: '#99F6E4',
  warning: '#B45309',
  warningBg: '#FFFBEB',
} as const;

export function isMedicalPractitionerRole(_role?: UserRole | null): boolean {
  return false;
}
