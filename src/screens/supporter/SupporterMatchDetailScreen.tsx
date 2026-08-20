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
import { LIVE_ACTION_LABELS, type LiveMatchAction, type TeamEvent } from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { externalScoresService } from '../../services/externalScores.service';
import { spacing } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import {
  liveStateFromMatchItem,
  parseProdayEventId,
  parseWorldFixtureApiId,
  syntheticEventFromLineup,
  type ExternalFixtureLineup,
} from '../../utils/supporterMatchDetail';
import { extractProdayOfficialWatchUrl } from '../../utils/supporterBroadcast';

type DetailTab = 'score' | 'lineup' | 'actions';

const POLL_MS = 40_000;

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
  const [tab, setTab] = useState<DetailTab>('score');
  const [lineups, setLineups] = useState<ExternalFixtureLineup[]>([]);
  const [actions, setActions] = useState<LiveMatchAction[]>(() => []);
  const [prodayEvent, setProdayEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveItem, setLiveItem] = useState(item);

  const load = useCallback(async () => {
    const prodayId = parseProdayEventId(item.id);
    const apiId = parseWorldFixtureApiId(item.id);
    if (prodayId) {
      const event = await teamEventsService.getById(prodayId);
      setProdayEvent(event);
      setActions(event?.live_actions ?? []);
      setLoading(false);
      return;
    }
    if (apiId != null) {
      const fixtureKey = `api_${apiId}`;
      const [lineupRes, eventRes] = await Promise.all([
        externalScoresService.getFixtureLineups(fixtureKey),
        externalScoresService.getFixtureEvents(fixtureKey),
      ]);
      setLineups(lineupRes.lineups);
      setActions(eventRes.events);
      setLoading(false);
      return;
    }
    setLineups([]);
    setActions([]);
    setLoading(false);
  }, [item.id]);

  useEffect(() => {
    setLiveItem(item);
    setLoading(true);
    void load();
  }, [item, load]);

  useEffect(() => {
    if (item.status !== 'live') return undefined;
    const timer = setInterval(() => {
      void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [item.status, load]);

  const liveState = liveStateFromMatchItem({
    ...liveItem,
    scoreHome: prodayEvent?.live_state?.home_score ?? liveItem.scoreHome,
    scoreAway: prodayEvent?.live_state?.away_score ?? liveItem.scoreAway,
    minute: prodayEvent?.live_state?.minute ?? liveItem.minute,
    status:
      prodayEvent?.live_state?.status === 'live' || prodayEvent?.live_state?.status === 'halftime'
        ? 'live'
        : liveItem.status,
  });

  const officialWatch =
    liveItem.watchUrl ??
    (prodayEvent
      ? extractProdayOfficialWatchUrl({
          public_watch_url: prodayEvent.public_watch_url,
          description: prodayEvent.description,
        })
      : undefined);

  const lineupEvents = useMemo(() => {
    if (prodayEvent?.lineup) {
      return [
        {
          teamName: prodayEvent.club_name ?? liveItem.homeLabel,
          lineup: prodayEvent.lineup,
        },
      ];
    }
    return lineups;
  }, [prodayEvent, lineups, liveItem.homeLabel]);

  const timeline = useMemo(
    () => [...actions].sort((a, b) => a.minute - b.minute),
    [actions],
  );

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'score', label: t('supporter.detail.tab.score') },
    { id: 'lineup', label: t('supporter.detail.tab.lineup') },
    { id: 'actions', label: t('supporter.detail.tab.actions') },
  ];

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

      {liveItem.broadcastListed || officialWatch ? (
        <View style={styles.broadcastRow}>
          <ProDayText variant="caption" style={styles.broadcastChip}>
            {officialWatch
              ? t('supporter.broadcast.watchFree')
              : t('supporter.broadcast.listed', {
                  channel: liveItem.broadcastLabel ?? '—',
                })}
          </ProDayText>
          {officialWatch ? (
            <PressableSpring
              onPress={() => void Linking.openURL(officialWatch)}
              scaleTo={0.98}
            >
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

      <View style={styles.tabs}>
        {tabs.map((entry) => (
          <Pressable key={entry.id} onPress={() => setTab(entry.id)} style={styles.tab}>
            <ProDayText
              variant="caption"
              style={[styles.tabLabel, tab === entry.id && styles.tabLabelOn]}
            >
              {entry.label}
            </ProDayText>
            <View style={[styles.tabRule, tab === entry.id && styles.tabRuleOn]} />
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />
        ) : tab === 'score' ? (
          <ProDayText variant="caption" style={styles.muted}>
            {t('supporter.detail.scoreHint')}
          </ProDayText>
        ) : tab === 'lineup' ? (
          lineupEvents.length === 0 ? (
            <ProDayText variant="body" style={styles.muted}>
              {t('supporter.detail.lineupEmpty')}
            </ProDayText>
          ) : (
            lineupEvents.map((row) => (
              <View key={row.teamName} style={styles.lineupBlock}>
                <ProDayText variant="caption" style={styles.comp}>
                  {row.teamName}
                </ProDayText>
                <MatchHubLineupTab
                  event={syntheticEventFromLineup(
                    liveItem,
                    row.teamName,
                    row.lineup,
                    timeline,
                  )}
                  canEdit={false}
                  onEditLineup={() => undefined}
                />
              </View>
            ))
          )
        ) : timeline.length === 0 ? (
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
  followRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 6,
  },
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
});
