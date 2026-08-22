/**
 * Helpers purs Communication Club — tuiles hub, priorités (testables).
 */
export type ClubCommTileId =
  | 'inbox'
  | 'notifications'
  | 'announce'
  | 'teams'
  | 'coaches'
  | 'players';

export type ClubCommTile = {
  id: ClubCommTileId;
  label: string;
  hint: string;
  icon: 'chat' | 'notifications' | 'people' | 'school' | 'checkmark-circle';
  primary?: boolean;
};

export function buildClubCommHubTiles(input: {
  pendingMemberships: number;
  unreadNotifications: number;
}): ClubCommTile[] {
  const inboxHint =
    input.unreadNotifications > 0
      ? `${input.unreadNotifications} alerte${input.unreadNotifications > 1 ? 's' : ''} · ouvrir la messagerie`
      : 'Fils staff, effectif et parents';

  const membershipHint =
    input.pendingMemberships > 0
      ? `${input.pendingMemberships} adhésion${input.pendingMemberships > 1 ? 's' : ''} à valider`
      : 'Licenciés et rattachements';

  return [
    {
      id: 'inbox',
      label: 'Messagerie',
      hint: inboxHint,
      icon: 'chat',
      primary: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      hint:
        input.unreadNotifications > 0
          ? `${input.unreadNotifications} non lue${input.unreadNotifications > 1 ? 's' : ''}`
          : 'Alertes club et rappels',
      icon: 'notifications',
    },
    {
      id: 'announce',
      label: 'Annonces club',
      hint: 'Info officielle via la messagerie ProDay',
      icon: 'notifications',
    },
    {
      id: 'teams',
      label: 'Équipes',
      hint: 'Annonces par catégorie',
      icon: 'people',
    },
    {
      id: 'coaches',
      label: 'Coachs',
      hint: 'Coordination staff',
      icon: 'school',
    },
    {
      id: 'players',
      label: 'Joueurs',
      hint: membershipHint,
      icon: 'checkmark-circle',
    },
  ];
}

export function resolveClubCommSubtitle(input: {
  pendingMemberships: number;
  unreadNotifications: number;
}): string {
  if (input.unreadNotifications > 0 && input.pendingMemberships > 0) {
    return `${input.unreadNotifications} alerte${input.unreadNotifications > 1 ? 's' : ''} · ${input.pendingMemberships} adhésion${input.pendingMemberships > 1 ? 's' : ''}`;
  }
  if (input.unreadNotifications > 0) {
    return `${input.unreadNotifications} notification${input.unreadNotifications > 1 ? 's' : ''} à traiter`;
  }
  if (input.pendingMemberships > 0) {
    return `${input.pendingMemberships} adhésion${input.pendingMemberships > 1 ? 's' : ''} en attente`;
  }
  return 'Messagerie · notifications · annonces';
}
