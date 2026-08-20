import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { MatchHubLineupTab } from '../../components/matchs/hub/MatchHubLineupTab';
import { MatchLiveScoreboard } from '../../components/matchs/hub/MatchLiveScoreboard';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { useTranslation } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { LIVE_ACTION_LABELS, type LiveMatchAction } from '../../models/TeamEvent';
import { spacing } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import {
  liveStateFromMatchItem,
  syntheticEventFromLineup,
  type ExternalFixtureLineup,
} from '../../utils/supporterMatchDetail';
import {
  fetchMatchCenterData,
  type MatchCenterData,
  type MatchCenterTabId,
} from '../../services/footballData';
import { SupporterMatchCommunityPanel } from '../../features/supporter/components/SupporterMatchCommunityPanel';
import { SupporterReplayPlayer } from '../../features/supporter/components/SupporterReplayPlayer';
import { useSupporterAgent } from '../../agents/supporterAgent/useSupporterAgent';
import { canPlaySupporterVideo, type SupporterVideo } from '../../models/SupporterVideo';
import { supporterVideoService } from '../../services/supporterVideo.service';
import { supporterWatchHistoryService } from '../../services/supporterWatchHistory.service';
import {
  supporterMatchSummaryService,
  type SupporterMatchSummary,
} from '../../services/supporterMatchSummary.service';
import { loadSupporterNotificationPrefs } from '../../services/supporterPreferences.service';
import { supporterNotificationPlanner } from '../../services/supporterNotificationPlanner';

const POLL_MS = 40_000;

const TAB_LABELS: Record<MatchCenterTabId, string> = {
  resume: 'Résumé',
  live: 'Live',
  stats: 'Stats',
  compositions: 'Compositions',
  events: 'Événements',
  video: 'Vidéo',
  analyse: 'Analyse',
  moments: 'Moments',
};

export type SupporterMatchDetailScreenProps = {
  item: SupporterMatchViewItem;
  onBack: () => void;
  isFollowedClub?: (clubId: string) => boolean;
  onToggleClub?: (clubId: string, label: string) => void;
};

export const SupporterMatchDetailScreen: React.FC<SupporterMatchDetailScreenProps> = ({
  item,
  onBack,
  isFollowedClub,
  onToggleClub,
}) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const agent = useSupporterAgent();
  const [center, setCenter] = useState<MatchCenterData | null>(null);
  const [tab, setTab] = useState<MatchCenterTabId>('resume');
  const [loading, setLoading] = useState(true);
  const [liveItem, setLiveItem] = useState(item);
  const [matchVideo, setMatchVideo] = useState<SupporterVideo | null>(null);
  const [summary, setSummary] = useState<SupporterMatchSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const prevScoreRef = useRef<{ home?: number; away?: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMatchCenterData(item.id, { seedItem: item });
      if (data) {
        setCenter(data);
        setLiveItem(data.item);
        setTab((current) =>
          data.availableTabs.includes(current) ? current : data.availableTabs[0] ?? 'resume',
        );
        const video = await supporterVideoService.videoForMatch(
          data.prodayEvent,
          data.events ?? [],
          data.item.watchUrl,
        );
        setMatchVideo(video);
      }
    } catch {
      setCenter(null);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (item.status !== 'live') return undefined;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [item.status, load]);

  useEffect(() => {
    if (!profile?.uid || !center) return;
    void supporterWatchHistoryService.record(profile.uid, {
      matchId: item.id,
      source: liveItem.source,
      title: liveItem.competitionLabel ?? liveItem.homeLabel,
      teams: `${liveItem.homeLabel} vs ${liveItem.awayLabel}`,
    });
  }, [profile?.uid, center, item.id, liveItem]);

  useEffect(() => {
    void (async () => {
      const cached = await supporterMatchSummaryService.getCached(item.id);
      if (cached) setSummary(cached);
    })();
  }, [item.id]);

  useEffect(() => {
    if (!profile?.uid || liveItem.status !== 'live') return;
    const prev = prevScoreRef.current;
    const next = { home: liveItem.scoreHome, away: liveItem.scoreAway };
    const teamKey =
      liveItem.homeFollowTarget?.id ?? liveItem.awayFollowTarget?.id ?? liveItem.id;
    const notif = supporterNotificationPlanner.detectGoalNotification(
      prev,
      next,
      `${liveItem.homeLabel} vs ${liveItem.awayLabel}`,
      liveItem.id,
      teamKey,
    );
    prevScoreRef.current = next;
    if (!notif) return;
    void (async () => {
      const prefs = await loadSupporterNotificationPrefs(profile.uid);
      const [allowed] = supporterNotificationPlanner.filterPlannableNotifications(prefs, [notif]);
      if (allowed) {
        await supporterNotificationPlanner.fireImmediate(notif.title, notif.body, {
          matchId: notif.matchId,
        });
      }
    })();
  }, [liveItem, profile?.uid]);

  const liveState = liveStateFromMatchItem({
    ...liveItem,
    scoreHome: center?.prodayEvent?.live_state?.home_score ?? liveItem.scoreHome,
    scoreAway: center?.prodayEvent?.live_state?.away_score ?? liveItem.scoreAway,
    minute: center?.prodayEvent?.live_state?.minute ?? liveItem.minute,
    status:
      center?.prodayEvent?.live_state?.status === 'live' ||
      center?.prodayEvent?.live_state?.status === 'halftime'
        ? 'live'
        : liveItem.status,
  });

  const lineups: ExternalFixtureLineup[] = center?.lineups ?? [];
  const actions: LiveMatchAction[] = center?.events ?? [];
  const statistics = center?.statistics;
  const statKeys = statistics
    ? Array.from(
        new Set([
          ...Object.keys(statistics.home ?? {}),
          ...Object.keys(statistics.away ?? {}),
        ]),
      )
    : [];

  const lineupEvents = useMemo(() => {
    if (center?.prodayEvent?.lineup) {
      return [
        {
          teamName: center.prodayEvent.club_name ?? liveItem.homeLabel,
          lineup: center.prodayEvent.lineup,
        },
      ];
    }
    return lineups;
  }, [center?.prodayEvent, lineups, liveItem.homeLabel]);

  const timeline = useMemo(
    () => [...actions].sort((a, b) => a.minute - b.minute),
    [actions],
  );

  const tabs = center?.availableTabs ?? ['resume'];
  const playableVideo = matchVideo && canPlaySupporterVideo(matchVideo) ? matchVideo : null;

  const generateSummary = async () => {
    if (!center) return;
    setSummaryLoading(true);
    try {
      const payload = {
        matchId: item.id,
        homeLabel: liveItem.homeLabel,
        awayLabel: liveItem.awayLabel,
        scoreHome: liveItem.scoreHome,
        scoreAway: liveItem.scoreAway,
        status: liveItem.status,
        competitionLabel: liveItem.competitionLabel,
        events: timeline.map((e) => ({
          type: e.type,
          minute: e.minute,
          player: e.player_name,
        })),
        statistics,
      };
      const result = await supporterMatchSummaryService.generate(payload);
      setSummary(result);
      if (profile?.uid && liveItem.status === 'finished') {
        const prefs = await loadSupporterNotificationPrefs(profile.uid);
        const notif = supporterNotificationPlanner.buildSummaryAvailableNotif(
          item.id,
          `${liveItem.homeLabel} vs ${liveItem.awayLabel}`,
          liveItem.homeFollowTarget?.id ?? item.id,
        );
        const [allowed] = supporterNotificationPlanner.filterPlannableNotifications(prefs, [notif]);
        if (allowed) {
          await supporterNotificationPlanner.fireImmediate(notif.title, notif.body, {
            matchId: item.id,
          });
        }
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const renderSummary = () => {
    if (summary) {
      return (
        <>
          {summary.happened.map((line) => (
            <ProDayText key={line} variant="body" style={styles.muted}>
              · {line}
            </ProDayText>
          ))}
          {summary.keyMoment ? (
            <ProDayText variant="section" style={styles.actionTitle}>
              Moment clé : {summary.keyMoment}
            </ProDayText>
          ) : null}
          {summary.conclusion ? (
            <ProDayText variant="body" style={styles.muted}>
              {summary.conclusion}
            </ProDayText>
          ) : null}
          <ProDayText variant="caption" style={styles.disclaimer}>
            {summary.disclaimer}
          </ProDayText>
        </>
      );
    }
    const finished = liveItem.status === 'finished';
    return (
      <>
        <ProDayText variant="caption" style={styles.muted}>
          {liveItem.meta ?? t('supporter.detail.scoreHint')}
        </ProDayText>
        {timeline.slice(0, 5).map((action) => (
          <View key={action.id} style={styles.actionRow}>
            <ProDayText variant="caption" style={styles.minute}>
              {action.minute}'
            </ProDayText>
            <ProDayText variant="caption" style={styles.muted}>
              {LIVE_ACTION_LABELS[action.type] ?? action.type} — {action.player_name ?? ''}
            </ProDayText>
          </View>
        ))}
        {finished ? (
          <PressableSpring style={styles.iaCta} onPress={() => void generateSummary()} scaleTo={0.98}>
            <ProDayText variant="caption" style={styles.iaCtaText}>
              {summaryLoading ? 'Génération…' : 'Générer le résumé IA'}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </>
    );
  };

  const renderVideoTab = () => {
    if (playableVideo?.watchUrl && canPlaySupporterVideo(playableVideo)) {
      return (
        <SupporterReplayPlayer
          watchUrl={playableVideo.watchUrl}
          chapters={playableVideo.chapters}
          title={playableVideo.title}
          onProgress={(ms) => {
            if (!profile?.uid) return;
            void supporterWatchHistoryService.record(profile.uid, {
              matchId: item.id,
              source: liveItem.source,
              title: playableVideo.title,
              teams: `${liveItem.homeLabel} vs ${liveItem.awayLabel}`,
              progressMs: ms,
            });
          }}
        />
      );
    }
    const url = liveItem.watchUrl;
    if (url) {
      return (
        <PressableSpring onPress={() => void Linking.openURL(url)} scaleTo={0.98}>
          <ProDayText variant="section" style={styles.link}>
            {t('supporter.broadcast.open')}
          </ProDayText>
        </PressableSpring>
      );
    }
    return (
      <ProDayText variant="body" style={styles.muted}>
        Vidéo non disponible pour ce match.
      </ProDayText>
    );
  };

  const renderMomentsTab = () => {
    if (playableVideo?.watchUrl && canPlaySupporterVideo(playableVideo)) {
      return (
        <>
          <SupporterReplayPlayer
            watchUrl={playableVideo.watchUrl}
            chapters={playableVideo.chapters ?? []}
            title="Moments forts"
          />
          {timeline.map((action) => (
            <View key={action.id} style={styles.actionRow}>
              <ProDayText variant="caption" style={styles.minute}>
                {action.minute}'
              </ProDayText>
              <ProDayText variant="section" style={styles.actionTitle}>
                {LIVE_ACTION_LABELS[action.type] ?? action.type} — {action.player_name ?? ''}
              </ProDayText>
            </View>
          ))}
        </>
      );
    }
    if (timeline.length === 0) {
      return (
        <ProDayText variant="body" style={styles.muted}>
          Aucun moment enregistré.
        </ProDayText>
      );
    }
    return timeline.map((action) => (
      <Pressable key={action.id} style={styles.actionRow}>
        <ProDayText variant="caption" style={styles.minute}>
          {action.minute}'
        </ProDayText>
                    <ProDayText variant="section" style={styles.actionTitle}>
                      {LIVE_ACTION_LABELS[action.type] ?? action.type}
                    </ProDayText>
      </Pressable>
    ));
  };

  const renderTabBody = () => {
    if (loading) {
      return <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />;
    }
    switch (tab) {
      case 'resume':
        return renderSummary();
      case 'live':
        return (
          <>
            {timeline.length === 0 ? (
              <ProDayText variant="body" style={styles.muted}>
                {t('supporter.detail.actionsEmpty')}
              </ProDayText>
            ) : (
              timeline.map((action) => (
                <View key={action.id} style={styles.actionRow}>
                  <ProDayText variant="caption" style={styles.minute}>
                    {action.minute}'
                  </ProDayText>
                  <View style={styles.actionCopy}>
                    <ProDayText variant="section" style={styles.actionTitle}>
                      {LIVE_ACTION_LABELS[action.type] ?? action.type}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.muted}>
                      {action.player_name ?? ''}
                    </ProDayText>
                  </View>
                </View>
              ))
            )}
            <SupporterMatchCommunityPanel
              matchId={item.id}
              homeScore={liveItem.scoreHome}
              awayScore={liveItem.scoreAway}
              matchStatus={liveItem.status}
              kickoffAt={
                liveItem.startsAt instanceof Date
                  ? liveItem.startsAt
                  : liveItem.startsAt
                    ? new Date(liveItem.startsAt)
                    : undefined
              }
            />
          </>
        );
      case 'stats':
        if (!statistics || statKeys.length === 0) {
          return (
            <ProDayText variant="body" style={styles.muted}>
              Statistique non disponible
            </ProDayText>
          );
        }
        return statKeys.map((key) => (
          <View key={key} style={styles.statRow}>
            <ProDayText variant="caption" style={styles.statVal}>
              {String(statistics.home?.[key] ?? '—')}
            </ProDayText>
            <ProDayText variant="caption" style={styles.statKey}>
              {key}
            </ProDayText>
            <ProDayText variant="caption" style={styles.statVal}>
              {String(statistics.away?.[key] ?? '—')}
            </ProDayText>
          </View>
        ));
      case 'video':
        return renderVideoTab();
      case 'analyse':
        return (
          <>
            <PressableSpring
              style={styles.iaCta}
              onPress={() => {
                if (!center) return;
                void agent.ask('Résume le match', center, summary);
              }}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" style={styles.iaCtaText}>
                Résumer avec l'IA
              </ProDayText>
            </PressableSpring>
            {agent.lastReply ? (
              <View style={styles.iaBox}>
                <ProDayText variant="body" style={styles.muted}>
                  {agent.lastReply.text}
                </ProDayText>
                <ProDayText variant="caption" style={styles.disclaimer}>
                  {agent.lastReply.disclaimer}
                </ProDayText>
              </View>
            ) : null}
          </>
        );
      case 'moments':
        return renderMomentsTab();
      default:
        return null;
    }
  };

  const officialWatch = playableVideo?.watchUrl ?? liveItem.watchUrl;

  return (
    <View style={styles.root}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <ProDayText variant="caption" style={styles.backText}>
          {t('supporter.detail.back')}
        </ProDayText>
      </Pressable>

      <ProDayText variant="caption" style={styles.comp}>
        {liveItem.competitionLabel ?? (liveItem.source === 'proday' ? 'ProDay' : '')}
      </ProDayText>

      {liveItem.meta || liveItem.startsAt ? (
        <ProDayText variant="caption" style={styles.metaLine}>
          {[
            liveItem.meta,
            liveItem.startsAt
              ? new Intl.DateTimeFormat('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(
                  liveItem.startsAt instanceof Date
                    ? liveItem.startsAt
                    : new Date(liveItem.startsAt),
                )
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </ProDayText>
      ) : null}

      <MatchLiveScoreboard state={liveState} />

      {officialWatch ? (
        <View style={styles.broadcastRow}>
          <ProDayText variant="caption" style={styles.broadcastChip}>
            {t('supporter.broadcast.watchFree')}
          </ProDayText>
          {!playableVideo ? (
            <PressableSpring onPress={() => void Linking.openURL(officialWatch)} scaleTo={0.98}>
              <ProDayText variant="caption" style={styles.broadcastLink}>
                {t('supporter.broadcast.open')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : null}

      {onToggleClub && liveItem.source === 'world' ? (
        <View style={styles.followRow}>
          {[liveItem.homeFollowTarget, liveItem.awayFollowTarget].map((target) =>
            target ? (
              <Pressable
                key={target.id}
                onPress={() => onToggleClub(target.id, target.label)}
                hitSlop={8}
              >
                <ProDayText variant="caption" style={styles.followText}>
                  {isFollowedClub?.(target.id)
                    ? t('supporter.match.action.following')
                    : t('supporter.match.action.follow')}{' '}
                  {target.label}
                </ProDayText>
              </Pressable>
            ) : null,
          )}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((entry) => (
          <Pressable key={entry} onPress={() => setTab(entry)} style={styles.tab}>
            <ProDayText
              variant="caption"
              style={[styles.tabLabel, tab === entry && styles.tabLabelOn]}
            >
              {TAB_LABELS[entry]}
            </ProDayText>
            <View style={[styles.tabRule, tab === entry && styles.tabRuleOn]} />
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {renderTabBody()}
        {tab === 'resume' && lineupEvents.length > 0 ? (
          lineupEvents.map((row) => (
            <View key={row.teamName} style={styles.lineupBlock}>
              <ProDayText variant="caption" style={styles.comp}>
                {row.teamName}
              </ProDayText>
              <MatchHubLineupTab
                event={syntheticEventFromLineup(liveItem, row.teamName, row.lineup, timeline)}
                canEdit={false}
                onEditLineup={() => undefined}
              />
            </View>
          ))
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SITE.bg, paddingTop: spacing.sm },
  back: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backText: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.4,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  comp: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.8,
    fontSize: 10,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaLine: {
    color: SUPPORTER_SITE.muted,
    fontSize: 12,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  broadcastChip: {
    color: SUPPORTER_SITE.bright,
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  broadcastLink: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  followRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 6 },
  followText: { color: SUPPORTER_SITE.muted, fontSize: 12 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  tab: { gap: 8 },
  tabLabel: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.2,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tabLabelOn: { color: SUPPORTER_SITE.foreground },
  tabRule: { height: 1, backgroundColor: 'transparent' },
  tabRuleOn: { backgroundColor: SUPPORTER_SITE.accent },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  muted: { color: SUPPORTER_SITE.muted, lineHeight: 20 },
  link: { color: SUPPORTER_SITE.accent },
  lineupBlock: { gap: spacing.sm, marginBottom: spacing.lg },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
  },
  minute: { color: SUPPORTER_SITE.accent, width: 36, fontVariant: ['tabular-nums'] },
  actionCopy: { flex: 1, gap: 2 },
  actionTitle: { color: SUPPORTER_SITE.foreground, fontSize: 14 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.sm,
  },
  statKey: { flex: 1, color: SUPPORTER_SITE.muted, textAlign: 'center', fontSize: 10 },
  statVal: { width: 40, color: SUPPORTER_SITE.foreground, textAlign: 'center', fontVariant: ['tabular-nums'] },
  iaCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SITE.soft,
    borderWidth: 1,
    borderColor: SUPPORTER_SITE.border,
  },
  iaCtaText: { color: SUPPORTER_SITE.accent, letterSpacing: 0.8 },
  iaBox: { gap: spacing.sm, marginTop: spacing.md },
  disclaimer: { color: SUPPORTER_SITE.muted, fontSize: 10, fontStyle: 'italic' },
});
