export type AdminUserSubPage =
  | 'profil'
  | 'roles'
  | 'clubs'
  | 'verification'
  | 'abonnement'
  | 'activite'
  | 'danger';

export const ADMIN_USER_SUBPAGES: AdminUserSubPage[] = [
  'profil',
  'roles',
  'clubs',
  'verification',
  'abonnement',
  'activite',
  'danger',
];

export const ADMIN_USER_SUBPAGE_LABELS: { id: AdminUserSubPage; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'roles', label: 'Rôles' },
  { id: 'clubs', label: 'Clubs' },
  { id: 'verification', label: 'Vérif.' },
  { id: 'abonnement', label: 'Abo' },
  { id: 'activite', label: 'Audit' },
  { id: 'danger', label: 'Danger' },
];
