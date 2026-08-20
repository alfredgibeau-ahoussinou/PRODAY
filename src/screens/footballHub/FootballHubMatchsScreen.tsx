import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { HubMatchRow, HubScreen, HubSearchBar, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { followsService } from '../../services/follows.service';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';
import { useEffect } from 'react';

type Chapter = 'live' | 'today' | 'upcoming' | 'world';

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'world', label: 'Monde' },
];

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
    calendarEvents: events ?? [],
    tournaments: tournaments ?? [],
    follows,
    filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    pollLive: chapter === 'live',
  });

  const items = useMemo(() => {
    const now = new Date();
    switch (chapter) {
      case 'live':
        return hub.sections.live;
      case 'today':
        return [...hub.sections.live, ...hub.sections.upcoming, ...hub.sections.world].filter(
          (i) => isSameDay(i.startsAt, now),
        );
      case 'upcoming':
        return hub.sections.upcoming;
      case 'world':
        return hub.sections.world;
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
            await hub.refresh();
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
});
