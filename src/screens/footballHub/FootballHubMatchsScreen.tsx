import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { HubMatchRow, HubScreen, HubSearchBar, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { followsService } from '../../services/follows.service';
import { DEFAULT_SUPPORTER_MATCH_FILTERS } from '../../services/supporterPreferences.service';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';

type Chapter = 'live' | 'today' | 'upcoming' | 'world';

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'world', label: 'Monde' },
];

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const FootballHubMatchsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [chapter, setChapter] = useState<Chapter>('upcoming');
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService.listByFollower(profile.uid).then((list) => {
      setFollows(Array.isArray(list) ? list : []);
    }).catch(() => setFollows([]));
  }, [profile?.uid]);

  const hub = useSupporterMatchHub({
    calendarEvents: events ?? EMPTY_EVENTS,
    tournaments: tournaments ?? EMPTY_TOURNAMENTS,
    follows,
    filters: DEFAULT_SUPPORTER_MATCH_FILTERS,
    pollLive: chapter === 'live',
  });

  const items = useMemo(() => {
    const now = new Date();
    const live = hub.sections.live ?? [];
    const upcoming = hub.sections.upcoming ?? [];
    const world = hub.sections.world ?? [];
    switch (chapter) {
      case 'live':
        return live;
      case 'today':
        return [...live, ...upcoming, ...world].filter((i) => isSameDay(i.startsAt, now));
      case 'upcoming':
        return upcoming.length > 0 ? upcoming : world;
      case 'world':
        return world;
      default:
        return [];
    }
  }, [chapter, hub.sections]);

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
      <ProDayText variant="hero" style={styles.title}>
        Matchs
      </ProDayText>
      <View style={styles.chips}>
        {CHAPTERS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setChapter(c.id)}
            style={[styles.chip, chapter === c.id && styles.chipActive]}
          >
            <ProDayText
              variant="caption"
              style={[styles.chipLabel, chapter === c.id && styles.chipLabelActive]}
            >
              {c.label}
            </ProDayText>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => setShowSearch((v) => !v)} style={styles.searchToggle}>
        <ProDayText variant="caption" style={styles.searchToggleLabel}>
          {showSearch ? 'Masquer la recherche' : 'Rechercher'}
        </ProDayText>
      </Pressable>
      {showSearch ? <HubSearchBar /> : null}

      {hub.providerState?.healthy === false ? (
        <View style={styles.banner}>
          <ProDayText variant="caption" style={styles.bannerText}>
            {hub.providerState.message ?? FOOTBALL_HUB_COPY.apiBanner}
          </ProDayText>
          <Pressable style={styles.retryBtn} onPress={() => void hub.refresh({ silent: false })}>
            <ProDayText variant="caption" style={styles.retryLabel}>
              Réessayer
            </ProDayText>
          </Pressable>
        </View>
      ) : null}

      <HubSection
        title={CHAPTERS.find((c) => c.id === chapter)?.label ?? 'Matchs'}
        emptyLabel={
          !hub.loading && items.length === 0
            ? chapter === 'live'
              ? FOOTBALL_HUB_COPY.emptyLive
              : FOOTBALL_HUB_COPY.emptyUpcoming
            : undefined
        }
        loading={hub.loading && items.length === 0}
      >
        {items.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  title: { color: FOOTBALL_HUB.foreground, fontSize: 28 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: FOOTBALL_HUB.surface,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  chipActive: { backgroundColor: FOOTBALL_HUB.soft, borderColor: FOOTBALL_HUB.accent },
  chipLabel: { color: FOOTBALL_HUB.muted },
  chipLabelActive: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  searchToggle: { alignSelf: 'flex-start' },
  searchToggleLabel: { color: FOOTBALL_HUB.bright },
  banner: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    gap: 10,
  },
  bannerText: { color: FOOTBALL_HUB.danger },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  retryLabel: { color: FOOTBALL_HUB.bright, fontWeight: '700' },
});
