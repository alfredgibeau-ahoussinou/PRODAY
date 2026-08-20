import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  HubClubChip,
  HubCompetitionCard,
  HubLiveScoreCard,
  HubMatchRow,
  HubScreen,
  HubSearchBar,
  HubSection,
} from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import { supporterVideoService } from '../../services/supporterVideo.service';
import { footballDataFacade } from '../../services/footballData';
import type { Follow } from '../../models/Follow';
import type { SupporterVideo } from '../../models/SupporterVideo';
import type { FootballCompetitionEntry } from '../../services/footballData/types';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';

/** Accueil PRODAY Football Hub. */
export const FootballHubHomeScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [comps, setComps] = useState<FootballCompetitionEntry[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);

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

  const hub = useSupporterMatchHub({
    calendarEvents: events ?? [],
    tournaments: tournaments ?? [],
    follows,
    filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    pollLive: true,
  });

  const loadExtras = useCallback(async () => {
    try {
      const [vids, catalog] = await Promise.all([
        supporterVideoService.listAvailable({ prodayEvents: events ?? [], max: 8 }),
        footballDataFacade.listCompetitionsByCountry('FR'),
      ]);
      setVideos(Array.isArray(vids) ? vids : []);
      setComps((catalog ?? []).slice(0, 12));
    } catch {
      setVideos([]);
      setComps([]);
    }
  }, [events]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([hub.refresh(), loadFollows(), loadExtras()]);
    setRefreshing(false);
  }, [hub, loadFollows, loadExtras]);

  const live = hub.sections.live;
  /** Suivis en priorité ; sinon calendrier monde pour ne pas laisser l’Accueil vide. */
  const upcoming =
    hub.sections.upcoming.length > 0
      ? hub.sections.upcoming.slice(0, 12)
      : hub.sections.world.slice(0, 12);
  const proday = hub.sections.proday.slice(0, 8);
  const clubFollows = follows.filter((f) => f.target_type === 'club');
  const apiUnhealthy = hub.providerState && hub.providerState.healthy === false;

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
          onRefresh={() => void onRefresh()}
          tintColor={FOOTBALL_HUB.bright}
        />
      }
    >
      <View style={styles.hero}>
        <ProDayText variant="caption" style={styles.eyebrow}>
          PRODAY FOOTBALL HUB
        </ProDayText>
        <ProDayText variant="hero" style={styles.heroTitle}>
          {FOOTBALL_HUB_COPY.heroTitle}
        </ProDayText>
        <ProDayText variant="body" style={styles.heroSub}>
          {FOOTBALL_HUB_COPY.heroSubtitle}
        </ProDayText>
      </View>

      {apiUnhealthy ? (
        <View style={styles.banner}>
          <ProDayText variant="caption" style={styles.bannerText}>
            {hub.providerState.message ?? FOOTBALL_HUB_COPY.apiBanner}
          </ProDayText>
        </View>
      ) : null}

      {hub.loading && live.length === 0 && upcoming.length === 0 ? (
        <ActivityIndicator color={FOOTBALL_HUB.bright} />
      ) : null}

      <HubSection
        title="Matchs en direct"
        actionLabel="Voir tout"
        onAction={() => nav.openMatchs?.({ supporterChapter: 'live' })}
        emptyLabel={!hub.loading && live.length === 0 ? FOOTBALL_HUB_COPY.emptyLive : undefined}
        loading={hub.loading && live.length === 0}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {live.map((item) => (
            <HubLiveScoreCard key={item.id} item={item} onPress={() => setSelected(item)} />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection
        title="Prochains matchs"
        actionLabel="Calendrier"
        onAction={() => nav.setActiveTab?.('matchs')}
        emptyLabel={!hub.loading && upcoming.length === 0 ? FOOTBALL_HUB_COPY.emptyUpcoming : undefined}
      >
        {upcoming.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="Mes clubs"
        actionLabel="Favoris"
        onAction={() => nav.setActiveTab?.('plus')}
        emptyLabel={clubFollows.length === 0 ? FOOTBALL_HUB_COPY.emptyFavorites : undefined}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {clubFollows.map((f) => (
            <HubClubChip
              key={f.id}
              label={f.target_label || f.target_id}
              onPress={() => nav.setActiveTab?.('plus')}
            />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection
        title="Matchs ProDay"
        actionLabel="ProDay"
        onAction={() => nav.setActiveTab?.('feed')}
        emptyLabel={!hub.loading && proday.length === 0 ? FOOTBALL_HUB_COPY.emptyProday : undefined}
      >
        {proday.map((item) => (
          <HubMatchRow key={item.id} item={item} onPress={() => setSelected(item)} />
        ))}
      </HubSection>

      <HubSection
        title="À revoir"
        emptyLabel={videos.length === 0 ? FOOTBALL_HUB_COPY.emptyVideos : undefined}
      >
        {videos.map((v) => (
          <Pressable key={v.id} style={styles.videoRow} onPress={() => undefined}>
            <ProDayText variant="body" style={styles.videoTitle} numberOfLines={1}>
              {v.title || 'Replay ProDay'}
            </ProDayText>
            <ProDayText variant="caption" style={styles.muted}>
              Droits OK
            </ProDayText>
          </Pressable>
        ))}
      </HubSection>

      <HubSection title="Compétitions">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {comps.map((c) => (
            <HubCompetitionCard
              key={c.id}
              label={c.label}
              country={c.country}
              onPress={() => nav.setActiveTab?.('matchs')}
            />
          ))}
        </ScrollView>
      </HubSection>

      <HubSection title="Découvrir">
        <Pressable
          style={styles.discoverBtn}
          onPress={() => setShowDiscover((v) => !v)}
        >
          <ProDayText variant="body" style={styles.discoverLabel}>
            {showDiscover ? 'Masquer la recherche' : 'Chercher clubs & compétitions'}
          </ProDayText>
        </Pressable>
        {showDiscover ? (
          <HubSearchBar
            onSelectClub={() => nav.setActiveTab?.('plus')}
            onSelectCompetition={() => nav.setActiveTab?.('matchs')}
          />
        ) : null}
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  hero: { gap: 8, paddingTop: 4 },
  eyebrow: {
    color: FOOTBALL_HUB.bright,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  heroTitle: {
    color: FOOTBALL_HUB.foreground,
    fontSize: 28,
    lineHeight: 34,
  },
  heroSub: { color: FOOTBALL_HUB.muted },
  banner: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  bannerText: { color: FOOTBALL_HUB.danger },
  videoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  videoTitle: { color: FOOTBALL_HUB.foreground, flex: 1, marginRight: 8 },
  muted: { color: FOOTBALL_HUB.muted },
  discoverBtn: {
    backgroundColor: FOOTBALL_HUB.soft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginBottom: 10,
  },
  discoverLabel: { color: FOOTBALL_HUB.bright, fontWeight: '600' },
});
