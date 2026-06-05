import type { IconName } from '../components/ui/Icon';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { UserRole } from '../models/User';

export const MEDICAL_THEME = {
  primary: '#0F766E',
  primarySoft: '#CCFBF1',
  primaryBg: '#F0FDFA',
  primaryBorder: '#99F6E4',
  warning: '#B45309',
  warningBg: '#FFFBEB',
} as const;

export function isMedicalPractitionerRole(role?: UserRole | null): boolean {
  return role === 'physio';
}

/** Onglets barre du bas — expérience praticien (type Doctolib). */
export const PHYSIO_MAIN_TABS: MainTabId[] = ['home', 'matchs', 'messages', 'profil'];

export function getPhysioTabLabel(tab: MainTabId): string {
  switch (tab) {
    case 'home':
      return 'Accueil';
    case 'matchs':
      return 'Agenda';
    case 'messages':
      return 'Patients';
    case 'profil':
      return 'Cabinet';
    default:
      return tab;
  }
}

export function getPhysioTabIcon(tab: MainTabId): IconName {
  switch (tab) {
    case 'home':
      return 'home';
    case 'matchs':
      return 'calendar';
    case 'messages':
      return 'chat';
    case 'profil':
      return 'heart';
    default:
      return 'home';
  }
}
