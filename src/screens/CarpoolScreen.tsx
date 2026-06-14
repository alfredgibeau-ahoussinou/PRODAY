import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import type { CarpoolChapterId } from '../content/carpoolChapters';
import { useTeamEvents } from '../hooks/useAppData';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { CarpoolHomeScreen } from '../components/carpool/CarpoolHomeScreen';
import { CarpoolEventDetailScreen } from '../components/carpool/CarpoolEventDetailScreen';
import { CarpoolGuestPrompt } from '../components/carpool/CarpoolGuestPrompt';

export const CarpoolScreen: React.FC = () => {
  const { profile } = useAuth();
  const { pendingCarpoolLink, clearPendingCarpool, openAuth } = useTabNavigation();
  const clubId = profile?.profile.club_id;
  const { events, loading, refresh } = useTeamEvents(profile?.uid, clubId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialChapter, setInitialChapter] = useState<CarpoolChapterId>('evenements');

  useEffect(() => {
    if (!pendingCarpoolLink) return;
    if (pendingCarpoolLink.chapter) setInitialChapter(pendingCarpoolLink.chapter);
    if (pendingCarpoolLink.eventId) setSelectedEventId(pendingCarpoolLink.eventId);
    clearPendingCarpool();
  }, [pendingCarpoolLink, clearPendingCarpool]);

  if (selectedEventId && profile) {
    return (
      <CarpoolEventDetailScreen
        eventId={selectedEventId}
        profile={profile}
        onBack={() => {
          setSelectedEventId(null);
          void refresh();
        }}
      />
    );
  }

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
        loading={loading}
        initialChapter={initialChapter}
        onOpenEvent={setSelectedEventId}
        onRefresh={refresh}
        onLoginRequired={() => openAuth('login')}
      />
    </ProDayScreenCanvas>
  );
};
