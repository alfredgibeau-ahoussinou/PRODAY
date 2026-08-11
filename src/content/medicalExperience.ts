import type { IconName } from '../components/ui/iconNames';
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

/** Onglets barre du bas — expérience praticien (type Doctolib) + vidéos content. */
export const PHYSIO_MAIN_TABS: MainTabId[] = [
  'home',
  'matchs',
  'feed',
  'reels',
  'messages',
  'profil',
];

export function getPhysioTabLabel(tab: MainTabId): string {
  switch (tab) {
    case 'home':
      return 'Accueil';
    case 'matchs':
      return 'Agenda';
    case 'feed':
      return 'Demandes';
    case 'reels':
      return 'Vidéos';
    case 'messages':
      return 'Messages';
    case 'profil':
      return 'Cabinet';
    default:
      return tab;
  }
}

export function getPhysioTabLabelKey(tab: MainTabId): string {
  switch (tab) {
    case 'home':
      return 'medical.shell.home';
    case 'matchs':
      return 'medical.shell.agenda';
    case 'feed':
      return 'medical.shell.requests';
    case 'reels':
      return 'medical.shell.videos';
    case 'messages':
      return 'medical.shell.messages';
    case 'profil':
      return 'medical.shell.cabinet';
    default:
      return `tabs.${tab}`;
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
    case 'feed':
      return 'mail';
    case 'reels':
      return 'videocam';
    default:
      return 'home';
  }
}
