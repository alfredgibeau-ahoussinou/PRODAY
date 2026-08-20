import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { SupporterSpaceBackBar } from '../../components/supporterSpace/SupporterSpaceBackBar';
import { MatchCard } from '../../features/supporterSpace/components';
import { SUPPORTER_SPACE } from '../../features/supporterSpace/theme/supporterSpaceTheme';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import type { UnifiedMatch } from '../../services/supporterFootball';
import { SupporterSpaceMatchCenterScreen } from '../supporterSpace/SupporterSpaceMatchCenterScreen';

const EMPTY: never[] = [];

/** Legacy live overlay — pointe vers Supporter Space V3. */
export const SupporterLiveNowScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const feed = useSupporterFootballFeed({
    calendarEvents: events ?? EMPTY,
    tournaments: tournaments ?? EMPTY,
    follows: [],
    pollLive: true,
  });
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);

  if (selected) {
    return (
      <SupporterSpaceMatchCenterScreen
        matchId={selected.id}
        seed={selected}
        onClose={() => setSelected(null)}
        facade={feed.facade}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SupporterSpaceBackBar />
      <ProDayText variant="title" style={styles.title}>
        En direct
      </ProDayText>
      {feed.loading ? <ActivityIndicator color={SUPPORTER_SPACE.bright} /> : null}
      {feed.live.map((m) => (
        <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
      ))}
      {!feed.loading && !feed.live.length ? (
        <ProDayText variant="body" style={styles.muted}>
          Aucun match en direct.
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SPACE.bg, padding: 16 },
  title: { color: SUPPORTER_SPACE.foreground, marginBottom: 12 },
  muted: { color: SUPPORTER_SPACE.muted },
});
