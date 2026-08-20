import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterFootballFeed } from '../../hooks/supporterFootball';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  LiveMatchCard,
  MatchCard,
  SpaceHero,
  SpaceScreen,
  SpaceSection,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import { followsService } from '../../services/follows.service';
import type { Follow } from '../../models/Follow';
import type { UnifiedMatch } from '../../services/supporterFootball';
import { ymd } from '../../services/supporterFootball/mappers';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';
import { SupporterSpaceSearchScreen } from './SupporterSpaceSearchScreen';

const EMPTY_EVENTS: never[] = [];
const EMPTY_TOURNAMENTS: never[] = [];

function matchOnDate(m: UnifiedMatch, dateKey: string): boolean {
  return ymd(m.date) === dateKey;
}

/** Accueil Supporter Space — Live Score kit, dual rails ProDay | Ligues. */
export const SupporterSpaceHomeScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [selected, setSelected] = useState<UnifiedMatch | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() => ymd(new Date()));

  const calendarEvents = events ?? EMPTY_EVENTS;
  const tournamentList = tournaments ?? EMPTY_TOURNAMENTS;

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

  const feed = useSupporterFootballFeed({
    calendarEvents,
    tournaments: tournamentList,
    follows,
    pollLive: true,
  });

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feed.refresh({ silent: true }), loadFollows()]);
    setRefreshing(false);
  }, [feed, loadFollows]);

  const liveForHero = useMemo(() => {
    const pool = [...feed.liveLeagues, ...feed.liveProday];
    return pool.find((m) => matchOnDate(m, selectedDateKey)) ?? pool[0] ?? null;
  }, [feed.liveLeagues, feed.liveProday, selectedDateKey]);

  const heroMatch = useMemo(() => {
    if (liveForHero) return liveForHero;
    const fav = feed.favorites.find((m) => matchOnDate(m, selectedDateKey));
    if (fav) return fav;
    const dayProday = feed.proday.find((m) => matchOnDate(m, selectedDateKey));
    if (dayProday) return dayProday;
    const dayLeague = feed.leagues.find((m) => matchOnDate(m, selectedDateKey));
    return dayLeague ?? null;
  }, [liveForHero, feed.favorites, feed.proday, feed.leagues, selectedDateKey]);

  const prodayRail = useMemo(() => {
    const dated = feed.proday.filter((m) => matchOnDate(m, selectedDateKey));
    return dated.length ? dated : feed.proday.slice(0, 8);
  }, [feed.proday, selectedDateKey]);

  const leaguesRail = useMemo(() => {
    const dated = feed.leagues.filter((m) => matchOnDate(m, selectedDateKey));
    const week = dated.length ? dated : feed.upcomingLeagues.slice(0, 10);
    return week.length ? week : feed.leagues.slice(0, 10);
  }, [feed.leagues, feed.upcomingLeagues, selectedDateKey]);

  const greetingName = profile?.display_name || profile?.email?.split('@')[0] || null;

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

  if (showSearch) {
    return (
      <SupporterSpaceSearchScreen
        facade={feed.facade}
        onClose={() => setShowSearch(false)}
        onOpenMatch={(m) => {
          setShowSearch(false);
          setSelected(m);
        }}
      />
    );
  }

  return (
    <SpaceScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={SUPPORTER_SPACE.accent}
        />
      }
    >
      <SpaceHero
        greetingName={greetingName}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
        heroMatch={heroMatch}
        onOpenMatch={setSelected}
        onSearch={() => setShowSearch(true)}
        onNotif={() => Alert.alert('Notifications', SUPPORTER_SPACE_COPY.notifStub)}
      />

      {feed.health?.mode === 'demo' ? (
        <View style={styles.banner}>
          <ProDayText variant="caption" style={styles.bannerText}>
            {SUPPORTER_SPACE_COPY.demoBanner}
          </ProDayText>
        </View>
      ) : null}

      {feed.health?.mode === 'empty' ? (
        <View style={styles.bannerMuted}>
          <ProDayText variant="caption" style={styles.bannerMutedText}>
            {SUPPORTER_SPACE_COPY.configureSportmonks}
          </ProDayText>
        </View>
      ) : null}

      {feed.loading && !feed.live.length && !feed.proday.length && !feed.leagues.length ? (
        <ActivityIndicator color={SUPPORTER_SPACE.accent} style={{ marginVertical: 24 }} />
      ) : null}

      <SpaceSection title="En direct" actionLabel="Matchs" onAction={() => nav.setActiveTab('matchs')}>
        {feed.liveLeagues.length || feed.liveProday.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...feed.liveLeagues, ...feed.liveProday].map((m) => (
              <LiveMatchCard key={m.id} match={m} onPress={() => setSelected(m)} />
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyLive}
          </ProDayText>
        )}
      </SpaceSection>

      <View style={styles.dualRails}>
        <View style={styles.rail}>
          <SpaceSection title={SUPPORTER_SPACE_COPY.sectionProday} actionLabel="ProDay" onAction={() => nav.setActiveTab('feed')}>
            {prodayRail.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {prodayRail.map((m) => (
                  <MatchCard key={m.id} match={m} compact onPress={() => setSelected(m)} />
                ))}
              </ScrollView>
            ) : (
              <ProDayText variant="body" style={styles.empty}>
                {SUPPORTER_SPACE_COPY.emptyProday}
              </ProDayText>
            )}
          </SpaceSection>
        </View>

        <View style={styles.rail}>
          <SpaceSection
            title={SUPPORTER_SPACE_COPY.sectionLeagues}
            actionLabel="Matchs"
            onAction={() => nav.setActiveTab('matchs')}
          >
            {leaguesRail.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {leaguesRail.map((m) => (
                  <MatchCard key={m.id} match={m} compact onPress={() => setSelected(m)} />
                ))}
              </ScrollView>
            ) : (
              <ProDayText variant="body" style={styles.empty}>
                {feed.health?.mode === 'empty'
                  ? SUPPORTER_SPACE_COPY.configureSportmonks
                  : SUPPORTER_SPACE_COPY.emptyLeagues}
              </ProDayText>
            )}
          </SpaceSection>
        </View>
      </View>

      <SpaceSection title={SUPPORTER_SPACE_COPY.matchThisWeek}>
        {feed.upcomingLeagues.length || feed.upcomingProday.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...feed.upcomingProday, ...feed.upcomingLeagues].slice(0, 12).map((m) => (
              <MatchCard key={m.id} match={m} compact onPress={() => setSelected(m)} />
            ))}
          </ScrollView>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyUpcoming}
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Vos clubs" actionLabel="Clubs" onAction={() => nav.setActiveTab('plus')}>
        {follows.length ? (
          <View style={styles.chips}>
            {follows.slice(0, 12).map((f) => (
              <Pressable
                key={f.id}
                style={styles.clubChip}
                onPress={() => nav.setActiveTab('plus')}
              >
                <ProDayText variant="caption" style={styles.clubChipText}>
                  {f.target_label || f.target_id}
                </ProDayText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            {SUPPORTER_SPACE_COPY.emptyClubs}
          </ProDayText>
        )}
      </SpaceSection>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bannerText: { color: SUPPORTER_SPACE.demo },
  bannerMuted: {
    backgroundColor: SUPPORTER_SPACE.band,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bannerMutedText: { color: SUPPORTER_SPACE.muted },
  empty: { color: SUPPORTER_SPACE.muted, marginBottom: 4 },
  dualRails: { gap: 4 },
  rail: {},
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clubChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
  },
  clubChipText: { color: SUPPORTER_SPACE.foreground },
});
