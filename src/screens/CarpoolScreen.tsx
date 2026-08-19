import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { CarpoolChapterId } from '../content/carpoolChapters';
import { useTeamEvents } from '../hooks/useAppData';
import { useCarpoolOffers } from '../hooks/useCarpoolOffers';
import { CarpoolHomeScreen } from '../components/carpool/CarpoolHomeScreen';
import { CarpoolUiProvider } from '../components/carpool/CarpoolUiContext';
import { CarpoolEventDetailScreen } from '../components/carpool/CarpoolEventDetailScreen';
import { CarpoolGuestPrompt } from '../components/carpool/CarpoolGuestPrompt';
import { PushScreenTransition } from '../components/motion';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { useCoachTokens } from '../features/coach/shell/CoachThemeContext';

export const CarpoolScreen: React.FC = () => {
  const { profile } = useAuth();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const coachShell = Boolean(useCoachShellNav());
  const coachTokens = useCoachTokens();
  const screenBg = coachShell ? coachTokens.bg : joueurLive ? JOUEUR_SITE.bg : '#E8F4F8';
  const { pendingCarpoolLink, clearPendingCarpool, openAuth } = useTabNavigation();
  const clubId = profile?.profile.club_id;
  const { events, loading, refresh } = useTeamEvents(profile?.uid, clubId);
  const {
    offers: standaloneOffers,
    allOffers: standaloneAllOffers,
    loading: standaloneLoading,
    refresh: refreshOffers,
  } = useCarpoolOffers(profile?.uid, profile?.profile?.club_id);

  const refreshAll = () => {
    void refresh();
    void refreshOffers();
  };
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialChapter, setInitialChapter] = useState<CarpoolChapterId>('evenements');

  useEffect(() => {
    if (!pendingCarpoolLink) return;
    if (pendingCarpoolLink.chapter) setInitialChapter(pendingCarpoolLink.chapter);
    if (pendingCarpoolLink.eventId) setSelectedEventId(pendingCarpoolLink.eventId);
    clearPendingCarpool();
  }, [pendingCarpoolLink, clearPendingCarpool]);

  if (!profile) {
    return (
      <CarpoolUiProvider coachShell={coachShell} joueurShell={joueurLive && !coachShell}>
        <View style={{ flex: 1, backgroundColor: screenBg }}>
          <CarpoolGuestPrompt
            onLogin={() => openAuth('login')}
            onSignup={() => openAuth('signup')}
          />
        </View>
      </CarpoolUiProvider>
    );
  }

  return (
    <CarpoolUiProvider coachShell={coachShell}>
      <View style={{ flex: 1, backgroundColor: screenBg }}>
        <CarpoolHomeScreen
          profile={profile}
          events={events}
          standaloneOffers={standaloneOffers}
          standaloneAllOffers={standaloneAllOffers}
          standaloneLoading={standaloneLoading}
          loading={loading || standaloneLoading}
          initialChapter={initialChapter}
          onOpenEvent={setSelectedEventId}
          onRefresh={refreshAll}
          onLoginRequired={() => openAuth('login')}
        />
        <PushScreenTransition active={selectedEventId != null}>
          {selectedEventId ? (
            <CarpoolEventDetailScreen
              eventId={selectedEventId}
              profile={profile}
              onBack={() => {
                setSelectedEventId(null);
                void refreshAll();
              }}
            />
          ) : null}
        </PushScreenTransition>
      </View>
    </CarpoolUiProvider>
  );
};
