import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { HubMatchRow, HubScreen, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { followsService } from '../../services/follows.service';
import { supporterVideoService } from '../../services/supporterVideo.service';
import type { SupporterMatchFilters } from '../../services/supporterPreferences.service';
import type { Follow } from '../../models/Follow';
import type { SupporterVideo } from '../../models/SupporterVideo';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];
const PRODAY_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'proday',
  scope: 'all',
  competition: 'all',
};

export const FootballHubProDayScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService
      .listByFollower(profile.uid)
      .then((list) => setFollows(Array.isArray(list) ? list : []))
      .catch(() => setFollows([]));
  }, [profile?.uid]);

  useEffect(() => {
    void supporterVideoService
      .listAvailable({ prodayEvents: events ?? EMPTY_EVENTS, max: 10 })
      .then((list) => setVideos(Array.isArray(list) ? list : []))
      .catch(() => setVideos([]));
  }, [events]);

  const hub = useSupporterMatchHub({
    calendarEvents: events ?? EMPTY_EVENTS,
    tournaments: tournaments ?? EMPTY_TOURNAMENTS,
    follows,
    filters: PRODAY_FILTERS,
    pollLive: true,
  });

  const proday = hub.sections.proday;
  const liveProday = hub.sections.live.filter((i) => i.source === 'proday');

  if (selected) {
    return (
      <FootballHubMatchCenterScreen item={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <HubScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await hub.refresh({ silent: true });
            setRefreshing(false);
          }}
          tintColor={FOOTBALL_HUB.bright}
        />
      }
    >
      <View style={styles.hero}>
        <ProDayText variant="caption" style={styles.eyebrow}>
          PRODAY
        </ProDayText>
        <ProDayText variant="hero" style={styles.title}>
          Matchs & TV ProDay
        </ProDayText>
        <ProDayText variant="body" style={styles.sub}>
          Amateur, tournois et moments ProDay — pont avec le football réel.
        </ProDayText>
      </View>

      <HubSection
        title="En direct ProDay"
        emptyLabel={!hub.loading && liveProday.length === 0 ? FOOTBALL_HUB_COPY.emptyLive : undefined}
      >
        {liveProday.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="Calendrier ProDay"
        emptyLabel={!hub.loading && proday.length === 0 ? FOOTBALL_HUB_COPY.emptyProday : undefined}
        loading={hub.loading && proday.length === 0}
      >
        {proday.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="ProDay TV"
        emptyLabel={videos.length === 0 ? FOOTBALL_HUB_COPY.emptyVideos : undefined}
      >
        {videos.map((v) => (
          <View key={v.id} style={styles.tvRow}>
            <ProDayText variant="body" style={styles.tvTitle} numberOfLines={1}>
              {v.title || 'Moment ProDay'}
            </ProDayText>
          </View>
        ))}
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  hero: { gap: 8 },
  eyebrow: { color: FOOTBALL_HUB.bright, fontWeight: '700', letterSpacing: 1 },
  title: { color: FOOTBALL_HUB.foreground, fontSize: 26 },
  sub: { color: FOOTBALL_HUB.muted },
  tvRow: {
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  tvTitle: { color: FOOTBALL_HUB.foreground },
});
