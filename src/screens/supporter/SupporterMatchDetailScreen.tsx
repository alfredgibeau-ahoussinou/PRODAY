import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSupporterAgent } from '../../agents/supporterAgent/useSupporterAgent';
import { canPlaySupporterVideo } from '../../models/SupporterVideo';

const POLL_MS = 40_000;

const TAB_LABELS: Record<MatchCenterTabId, string> = {
  resume: 'Résumé',
  live: 'Live',
  stats: 'Stats',
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
  const agent = useSupporterAgent();
  const [center, setCenter] = useState<MatchCenterData | null>(null);
  const [tab, setTab] = useState<MatchCenterTabId>('resume');
  const [loading, setLoading] = useState(true);
  const [liveItem, setLiveItem] = useState(item);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMatchCenterData(item.id);
    if (data) {
      setCenter(data);
      setLiveItem(data.item);
      setTab(data.availableTabs[0] ?? 'resume');
    }
    setLoading(false);
  }, [item.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (item.status !== 'live') return undefined;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [item.status, load]);

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

  const officialWatch = liveItem.watchUrl;
  const lineups: ExternalFixtureLineup[] = center?.lineups ?? [];
  const actions: LiveMatchAction[] = center?.events ?? [];
  const statistics = center?.statistics;

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

  const renderStats = () => {
    if (!statistics) {
      return (
        <ProDayText variant="body" style={styles.muted}>
          Statistique non disponible
        </ProDayText>
      );
    }
    const keys = Object.keys(statistics.home);
    return keys.map((key) => (
      <View key={key} style={styles.statRow}>
        <ProDayText variant="caption" style={styles.statVal}>
          {String(statistics.home[key] ?? '—')}
        </ProDayText>
        <ProDayText variant="caption" style={styles.statKey}>
          {key}
        </ProDayText>
        <ProDayText variant="caption" style={styles.statVal}>
          {String(statistics.away[key] ?? '—')}
        </ProDayText>
      </View>
    ));
  };

  const renderTabBody = () => {
    if (loading) {
      return <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />;
    }
    switch (tab) {
      case 'resume':
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
                  {LIVE_ACTION_LABELS[action.type]} — {action.player_name}
                </ProDayText>
              </View>
            ))}
          </>
        );
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
                      {LIVE_ACTION_LABELS[action.type]}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.muted}>
                      {action.player_name}
                    </ProDayText>
                  </View>
                </View>
              ))
            )}
            <SupporterMatchCommunityPanel
              homeScore={liveItem.scoreHome}
              awayScore={liveItem.scoreAway}
            />
          </>
        );
      case 'stats':
        return renderStats();
      case 'video':
        return officialWatch && canPlaySupporterVideo({ id: 'x', kind: 'proday_full', rights: 'AVAILABLE', title: '', watchUrl: officialWatch }) ? (
          <PressableSpring onPress={() => void Linking.openURL(officialWatch)} scaleTo={0.98}>
            <ProDayText variant="section" style={styles.link}>
              {t('supporter.broadcast.open')}
            </ProDayText>
          </PressableSpring>
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            Vidéo non disponible pour ce match.
          </ProDayText>
        );
      case 'analyse':
        return (
          <>
            <PressableSpring
              style={styles.agentBtn}
              onPress={() => center && void agent.ask('Résume le match', center)}
              scaleTo={0.98}
            >
              <ProDayText variant="caption" style={styles.agentBtnText}>
                Résumer avec l'IA
              </ProDayText>
            </PressableSpring>
            {agent.lastReply ? (
              <View style={styles.agentBox}>
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
        return timeline.length === 0 ? (
          <ProDayText variant="body" style={styles.muted}>
            Aucun moment enregistré.
          </ProDayText>
        ) : (
          timeline.map((action) => (
            <Pressable key={action.id} style={styles.actionRow}>
              <ProDayText variant="caption" style={styles.minute}>
                {action.minute}'
              </ProDayText>
              <ProDayText variant="section" style={styles.actionTitle}>
                {LIVE_ACTION_LABELS[action.type]}
              </ProDayText>
            </Pressable>
          ))
        );
      default:
        return null;
    }
  };

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

      <MatchLiveScoreboard state={liveState} />

      {officialWatch ? (
        <View style={styles.broadcastRow}>
          <ProDayText variant="caption" style={styles.broadcastChip}>
            {t('supporter.broadcast.watchFree')}
          </ProDayText>
          <PressableSpring onPress={() => void Linking.openURL(officialWatch)} scaleTo={0.98}>
            <ProDayText variant="caption" style={styles.broadcastLink}>
              {t('supporter.broadcast.open')}
            </ProDayText>
          </PressableSpring>
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
        {tab === 'lineup' as MatchCenterTabId ? null : renderTabBody()}
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
  agentBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SITE.soft,
    borderWidth: 1,
    borderColor: SUPPORTER_SITE.border,
  },
  agentBtnText: { color: SUPPORTER_SITE.accent, letterSpacing: 0.8 },
  agentBox: { gap: spacing.sm, marginTop: spacing.md },
  disclaimer: { color: SUPPORTER_SITE.muted, fontSize: 10, fontStyle: 'italic' },
});
