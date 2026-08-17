import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CoachAiHubChapter } from '../../components/coach/CoachAiHubChapter';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { teamEventsService } from '../../services/teamEvents.service';
import { usersService } from '../../services/users.service';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';

type Props = {
  /** Stats saison visibles sous l’hub (false si déjà affichées ailleurs). */
  showSeasonStats?: boolean;
};

/** Écran hub IA coach — charge effectif et événements. */
export function CoachAiHubScreen({ showSeasonStats = true }: Props) {
  const profile = useSessionProfile();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const clubId = profile.profile.club_id;
    const [ev, mem] = await Promise.all([
      clubId ? teamEventsService.listForClub(clubId).catch(() => [] as TeamEvent[]) : [],
      clubId ? usersService.listMembersByClubId(clubId).catch(() => [] as User[]) : [],
    ]);
    setEvents(ev);
    setMembers(mem);
  }, [profile]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  if (!profile) return null;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={COACH_SITE.accent} />
      </View>
    );
  }

  return (
    <CoachAiHubChapter
      profile={profile}
      members={members}
      events={events}
      onRefresh={() => void load()}
      onOpenChapter={() => {}}
      showSeasonStats={showSeasonStats}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.bg,
  },
});
