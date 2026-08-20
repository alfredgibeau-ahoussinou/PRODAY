import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { HubClubChip, HubMatchRow, HubScreen, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { followsService } from '../../services/follows.service';
import type { SupporterMatchFilters } from '../../services/supporterPreferences.service';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';
import { FootballHubSearchScreen } from './FootballHubSearchScreen';
import { FootballHubDebateFeedScreen } from './FootballHubDebateFeedScreen';

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];
const FAVORITES_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'all',
  scope: 'follows',
  competition: 'all',
};

export const FootballHubFavoritesScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTribune, setShowTribune] = useState(false);

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) {
      setFollows([]);
      return;
    }
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows(Array.isArray(list) ? list : []);
    } catch {
      setFollows([]);
    }
  }, [profile?.uid]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const hub = useSupporterMatchHub({
    calendarEvents: events ?? EMPTY_EVENTS,
    tournaments: tournaments ?? EMPTY_TOURNAMENTS,
    follows,
    filters: FAVORITES_FILTERS,
    pollLive: true,
  });

  const clubs = follows.filter((f) => f.target_type === 'club');
  const comps = follows.filter((f) => f.target_type === 'tournament');
  const feed = hub.sections.follows.length > 0 ? hub.sections.follows : hub.sections.upcoming.slice(0, 8);

  if (selected) {
    return (
      <FootballHubMatchCenterScreen item={selected} onBack={() => setSelected(null)} />
    );
  }

  if (showSearch) {
    return <FootballHubSearchScreen onBack={() => setShowSearch(false)} />;
  }

  if (showTribune) {
    return <FootballHubDebateFeedScreen onBack={() => setShowTribune(false)} />;
  }

  return (
    <HubScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([loadFollows(), hub.refresh({ silent: true })]);
            setRefreshing(false);
          }}
          tintColor={FOOTBALL_HUB.bright}
        />
      }
    >
      <View style={styles.titleRow}>
        <ProDayText variant="hero" style={styles.title}>
          Favoris
        </ProDayText>
        <View style={styles.actions}>
          <Pressable style={styles.linkBtn} onPress={() => setShowSearch(true)}>
            <ProDayText variant="caption" style={styles.linkLabel}>
              {FOOTBALL_HUB_COPY.searchCta}
            </ProDayText>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => setShowTribune(true)}>
            <ProDayText variant="caption" style={styles.linkLabel}>
              {FOOTBALL_HUB_COPY.tribuneCta}
            </ProDayText>
          </Pressable>
        </View>
      </View>
      <ProDayText variant="body" style={styles.sub}>
        Clubs, compétitions et fil personnalisé.
      </ProDayText>

      <HubSection
        title="Clubs suivis"
        emptyLabel={clubs.length === 0 ? FOOTBALL_HUB_COPY.emptyFavorites : undefined}
      >
        <View style={styles.row}>
          {clubs.map((f) => (
            <HubClubChip
              key={f.id}
              label={f.target_label || f.target_id}
              active
              onPress={() => setShowSearch(true)}
            />
          ))}
        </View>
      </HubSection>

      <HubSection
        title="Compétitions suivies"
        emptyLabel={comps.length === 0 ? 'Aucune compétition suivie.' : undefined}
      >
        <View style={styles.row}>
          {comps.map((f) => (
            <HubClubChip
              key={f.id}
              label={f.target_label || f.target_id}
              onPress={() => undefined}
            />
          ))}
        </View>
      </HubSection>

      <HubSection
        title="Fil personnalisé"
        emptyLabel={!hub.loading && feed.length === 0 ? FOOTBALL_HUB_COPY.emptyUpcoming : undefined}
        loading={hub.loading && feed.length === 0}
      >
        {feed.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { color: FOOTBALL_HUB.foreground, fontSize: 28, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  linkBtn: {
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  linkLabel: { color: FOOTBALL_HUB.bright, fontWeight: '700' },
  sub: { color: FOOTBALL_HUB.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
