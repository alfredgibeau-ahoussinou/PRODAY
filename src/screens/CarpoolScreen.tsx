import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { CarpoolChapterId } from '../content/carpoolChapters';
import { useTeamEvents } from '../hooks/useAppData';
import { useCarpoolOffers } from '../hooks/useCarpoolOffers';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { CarpoolHomeScreen } from '../components/carpool/CarpoolHomeScreen';
import { CarpoolEventDetailScreen } from '../components/carpool/CarpoolEventDetailScreen';
import { CarpoolGuestPrompt } from '../components/carpool/CarpoolGuestPrompt';
import { PushScreenTransition } from '../components/motion';

export const CarpoolScreen: React.FC = () => {
  const { profile } = useAuth();
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
      <ProDayScreenCanvas flat>
        <CarpoolGuestPrompt
          onLogin={() => openAuth('login')}
          onSignup={() => openAuth('signup')}
        />
      </ProDayScreenCanvas>
    );
  }

  return (
    <ProDayScreenCanvas flat>
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
    </ProDayScreenCanvas>
  );
};
