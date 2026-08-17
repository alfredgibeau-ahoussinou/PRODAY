import { useCallback } from 'react';
import type { ClubChannelId } from '../content/clubCommunityChannels';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';

export type ClubCommunityChannelHandlers = {
  onGeneral: () => void;
  onMercato: () => void;
  onCovoit: () => void;
  onConvocations: () => void;
};

export function navigateClubCommunityChannel(
  channel: ClubChannelId,
  handlers: ClubCommunityChannelHandlers,
): void {
  switch (channel) {
    case 'general':
      handlers.onGeneral();
      break;
    case 'mercato':
      handlers.onMercato();
      break;
    case 'covoit':
      handlers.onCovoit();
      break;
    case 'convocations':
      handlers.onConvocations();
      break;
  }
}

/** Navigation salons — shell coach natif si disponible. */
export function useClubCommunityChannelNav(handlers?: Partial<ClubCommunityChannelHandlers>) {
  const shellNav = useCoachShellNav();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();

  return useCallback(
    (channel: ClubChannelId) => {
      if (shellNav) {
        navigateClubCommunityChannel(channel, {
          onGeneral: handlers?.onGeneral ?? (() => shellNav.requestNav('messages')),
          onMercato:
            handlers?.onMercato ??
            (() => {
              tabNav.setActiveTab('recrutement');
              nav.openMercato();
            }),
          onCovoit: handlers?.onCovoit ?? (() => shellNav.requestNav('carpool')),
          onConvocations:
            handlers?.onConvocations ?? (() => shellNav.requestNav('planning')),
        });
        return true;
      }
      return false;
    },
    [handlers, nav, shellNav, tabNav],
  );
}
