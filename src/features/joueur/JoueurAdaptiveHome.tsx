import React, { useCallback } from 'react';
import type { User } from '../../models/User';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ElitePlayerCockpitScreen } from './ElitePlayerCockpitScreen';

type Props = {
  profile: User;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Point d'entrée Pôle Joueur — délègue au cockpit ProDay Élite.
 */
export function JoueurAdaptiveHome({ profile, onRefresh, refreshing }: Props) {
  const nav = useTabNavigationActions();

  const onOpenPass = useCallback(() => {
    nav.openDashboard('tactics_coach');
  }, [nav]);

  const onOpenMatchs = useCallback(
    () => nav.openMatchs({ homeTab: 'convocations' }),
    [nav],
  );

  return (
    <ElitePlayerCockpitScreen
      profile={profile}
      onOpenCoachAi={onOpenPass}
      onOpenMatchs={onOpenMatchs}
      onOpenCarpool={(eventId) =>
        nav.openCarpool(eventId ? { eventId, chapter: 'reserver' } : undefined)
      }
    />
  );
}

