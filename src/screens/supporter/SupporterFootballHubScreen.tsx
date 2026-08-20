import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { SupporterMatchCard } from '../../components/supporter/SupporterMatchCard';
import { SupporterClubSearch } from '../../components/supporter/SupporterClubSearch';
import { ProDayText } from '../../components/ui/ProDayText';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { SupporterHubSection } from '../../features/supporter/components/SupporterHubSection';
import { SupporterHeroLiveCard } from '../../features/supporter/components/SupporterHeroLiveCard';
import { SupporterMatchDuJourCard } from '../../features/supporter/components/SupporterMatchDuJourCard';
import { SupporterProDayBridgeCard } from '../../features/supporter/components/SupporterProDayBridgeCard';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import { loadSupporterMatchFilters } from '../../services/supporterPreferences.service';
import { supporterVideoService } from '../../services/supporterVideo.service';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { spacing, radius } from '../../theme/designTokens';
import { PushScreenTransition } from '../../components/motion';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';
import type { SupporterVideo } from '../../models/SupporterVideo';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useSupporterAgent } from '../../agents/supporterAgent/useSupporterAgent';

/** Accueil — Centre du football (hub V2). */
export const SupporterFootballHubScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const agent = useSupporterAgent();

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const list = await followsService.listByFollower(profile.uid);
    setFollows(list);
    setFollowedIds(new Set(list.map((f) => f.target_id)));
  }, [profile?.uid]);

  const toggleFollow = useCallback(
    async (id: string, label: string) => {
      if (!profile?.uid) return;
      await followsService.toggle(profile.uid, 'club', id, label);
      await loadFollows();
    },
    [profile?.uid, loadFollows],
  );

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const hub = useSupporterMatchHub({
    calendarEvents: events,
    tournaments,
    follows,
    filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    pollLive: true,
  });

  const loadVideos = useCallback(async () => {
    const list = await supporterVideoService.listAvailable({ prodayEvents: events, max: 8 });
    setVideos(list);
  }, [events]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  const firstName = profile?.display_name?.split(' ')[0]?.trim() || 'Supporter';
  const liveItems = hub.sections.live.slice(0, 4);
  const upcomingHero = hub.heroKickoffs[0] ?? hub.sections.upcoming[0];
  const prodayWeekend = hub.sections.proday.filter((m) => m.status === 'upcoming').length;

  const followedClubCount = useMemo(
    () => follows.filter((f) => f.target_type === 'club').length,
    [follows],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([hub.refresh(), loadFollows(), loadVideos()]);
    } finally {
      setRefreshing(false);
    }
  }, [hub, loadFollows, loadVideos]);

  if (selected) {
    return (
      <PushScreenTransition active={Boolean(selected)}>
        {selected ? (
          <SupporterMatchDetailScreen item={selected} onBack={() => setSelected(null)} />
        ) : null}
      </PushScreenTransition>
    );
  }

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('tribune')} showHero={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SUPPORTER_SITE.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <ProDayText variant="caption" style={styles.greetingEyebrow}>
            Centre du football
          </ProDayText>
          <ProDayText variant="hero" style={styles.greetingTitle}>
            Bonjour {firstName}
          </ProDayText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <View style={styles.chip}>
            <ProDayText variant="caption" style={styles.chipText}>
              {followedClubCount} club{followedClubCount !== 1 ? 's' : ''} suivi{followedClubCount !== 1 ? 's' : ''}
            </ProDayText>
          </View>
          {hub.liveCount > 0 ? (
            <Pressable onPress={() => nav.openMatchs({ supporterChapter: 'live' })} style={[styles.chip, styles.chipLive]}>
              <ProDayText variant="caption" style={styles.chipLiveText}>
                {hub.liveCount} en direct
              </ProDayText>
            </Pressable>
          ) : null}
          <Pressable onPress={() => nav.setActiveTab('messages')} style={styles.chip}>
            <ProDayText variant="caption" style={styles.chipText}>
              Fil communauté
            </ProDayText>
          </Pressable>
        </ScrollView>

        {hub.loading && liveItems.length === 0 ? (
          <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.lg }} />
        ) : null}

        {liveItems.length > 0 ? (
          <SupporterHubSection title="Matchs en direct" subtitle={`${hub.liveCount} match${hub.liveCount > 1 ? 's' : ''}`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveStrip}>
              {liveItems.map((item) => (
                <View key={item.id} style={styles.liveCardWrap}>
                  <SupporterHeroLiveCard item={item} onPress={() => setSelected(item)} />
                </View>
              ))}
            </ScrollView>
          </SupporterHubSection>
        ) : null}

        {upcomingHero ? (
          <SupporterHubSection title="À ne pas manquer">
            <SupporterMatchDuJourCard item={upcomingHero} onPress={() => setSelected(upcomingHero)} />
          </SupporterHubSection>
        ) : null}

        <SupporterHubSection title="ProDay">
          <SupporterProDayBridgeCard
            count={prodayWeekend}
            onPress={() => nav.openMatchs({ supporterChapter: 'proday' })}
          />
        </SupporterHubSection>

        {hub.sections.follows.length > 0 ? (
          <SupporterHubSection title="Pour toi" subtitle="Tes clubs et compétitions">
            {hub.sections.follows.slice(0, 3).map((item) => (
              <SupporterMatchCard key={item.id} item={item} compact onPress={() => setSelected(item)} />
            ))}
          </SupporterHubSection>
        ) : null}

        {videos.length > 0 ? (
          <SupporterHubSection
            title="Vidéos"
            action={
              <Pressable onPress={() => nav.setActiveTab('reels')}>
                <ProDayText variant="caption" style={styles.link}>
                  Tout voir
                </ProDayText>
              </Pressable>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoStrip}>
              {videos.map((v) => (
                <View key={v.id} style={styles.videoTile}>
                  <Icon name="videocam" size={18} color={SUPPORTER_SITE.accent} />
                  <ProDayText variant="caption" style={styles.videoTitle} numberOfLines={2}>
                    {v.title}
                  </ProDayText>
                </View>
              ))}
            </ScrollView>
          </SupporterHubSection>
        ) : null}

        <SupporterHubSection title="Rechercher un club">
          <View style={styles.searchWrap}>
            <SupporterClubSearch
              followedIds={followedIds}
              onToggle={toggleFollow}
              compact
            />
          </View>
        </SupporterHubSection>

        <PressableSpring
          style={styles.agentFab}
          onPress={() => {
            if (upcomingHero) setSelected(upcomingHero);
          }}
          scaleTo={0.97}
        >
          <Icon name="star-four-points" size={18} color={SUPPORTER_SITE.foreground} />
          <ProDayText variant="caption" style={styles.agentFabText}>
            IA Supporter
          </ProDayText>
        </PressableSpring>
        {agent.lastReply ? (
          <View style={styles.agentReply}>
            <ProDayText variant="caption" style={styles.agentReplyText}>
              {agent.lastReply.text}
            </ProDayText>
          </View>
        ) : null}
      </ScrollView>
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl * 2, paddingTop: spacing.md },
  greeting: { paddingHorizontal: spacing.lg, gap: 4, marginBottom: spacing.md },
  greetingEyebrow: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.6,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  greetingTitle: { color: SUPPORTER_SITE.foreground, fontSize: 26 },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  chipLive: { borderColor: SUPPORTER_SITE.live, backgroundColor: 'rgba(52,211,153,0.12)' },
  chipText: { color: SUPPORTER_SITE.muted, fontSize: 11 },
  chipLiveText: { color: SUPPORTER_SITE.live, fontSize: 11, fontWeight: '700' },
  liveStrip: { paddingLeft: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
  liveCardWrap: { width: 300 },
  link: { color: SUPPORTER_SITE.accent },
  videoStrip: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  videoTile: {
    width: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    gap: spacing.sm,
  },
  videoTitle: { color: SUPPORTER_SITE.foreground, fontSize: 11 },
  searchWrap: { paddingHorizontal: spacing.lg },
  agentFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: SUPPORTER_SITE.deep,
    borderWidth: 1,
    borderColor: SUPPORTER_SITE.border,
  },
  agentFabText: { color: SUPPORTER_SITE.foreground, letterSpacing: 0.5 },
  agentReply: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: SUPPORTER_SITE.elevated,
  },
  agentReplyText: { color: SUPPORTER_SITE.muted, lineHeight: 18 },
});
