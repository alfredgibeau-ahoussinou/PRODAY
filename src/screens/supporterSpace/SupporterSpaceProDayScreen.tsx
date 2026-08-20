import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import { MatchCard, SpaceScreen, SpaceSection } from '../../features/supporterSpace/components';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../../features/supporterSpace/theme/supporterSpaceTheme';
import { supporterVideoService } from '../../services/supporterVideo.service';
import type { SupporterVideo } from '../../models/SupporterVideo';
import type { UnifiedMatch } from '../../services/supporterFootball';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';

const EMPTY: never[] = [];

export const SupporterSpaceProDayScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const feed = useSupporterFootballFeed({
    calendarEvents: events ?? EMPTY,
    tournaments: tournaments ?? EMPTY,
    follows: [],
  });
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadVideos = useCallback(async () => {
    try {
      const list = await supporterVideoService.listAvailable({
        prodayEvents: events ?? [],
        max: 12,
      });
      setVideos(Array.isArray(list) ? list : []);
    } catch {
      setVideos([]);
    }
  }, [events]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([feed.refresh({ silent: true }), loadVideos()]);
    setRefreshing(false);
  };

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
    <SpaceScreen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SUPPORTER_SPACE.bright} />
      }
    >
      <ProDayText variant="brand" style={styles.brand}>
        PRODAY
      </ProDayText>
      <ProDayText variant="title" style={styles.title}>
        Univers ProDay
      </ProDayText>
      <ProDayText variant="body" style={styles.sub}>
        Matchs et vidéos avec droits de diffusion uniquement.
      </ProDayText>

      <SpaceSection title="Matchs ProDay">
        {feed.loading ? <ActivityIndicator color={SUPPORTER_SPACE.bright} /> : null}
        {feed.proday.length ? (
          feed.proday.map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
          ))
        ) : (
          <ProDayText variant="body" style={styles.sub}>
            {SUPPORTER_SPACE_COPY.emptyProday}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Vidéos">
        {videos.length ? (
          videos.map((v) => (
            <Pressable
              key={v.id}
              style={styles.videoRow}
              onPress={() => {
                if (v.watchUrl) void Linking.openURL(v.watchUrl);
              }}
            >
              <ProDayText variant="body" style={styles.videoTitle} numberOfLines={2}>
                {v.title}
              </ProDayText>
              <ProDayText variant="caption" style={styles.sub}>
                Droits OK
              </ProDayText>
            </Pressable>
          ))
        ) : (
          <ProDayText variant="body" style={styles.sub}>
            Aucune vidéo disponible avec droits.
          </ProDayText>
        )}
      </SpaceSection>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  brand: { color: SUPPORTER_SPACE.bright, marginBottom: 4 },
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 22, marginBottom: 6 },
  sub: { color: SUPPORTER_SPACE.muted, marginBottom: 8 },
  videoRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    marginBottom: 8,
  },
  videoTitle: { color: SUPPORTER_SPACE.foreground },
});
