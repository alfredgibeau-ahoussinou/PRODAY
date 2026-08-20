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
import { ProDayText } from '../../components/ui/ProDayText';
import { useFootballHubAgent } from '../../agents/footballHubAgent';
import {
  fetchMatchCenterData,
  type MatchCenterData,
  type MatchCenterTabId,
} from '../../services/footballData';
import { LIVE_ACTION_LABELS } from '../../models/TeamEvent';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { formatKickoffClock } from '../../utils/supporterMatchFilters';
import { syntheticEventFromLineup } from '../../utils/supporterMatchDetail';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { spacing } from '../../theme/designTokens';
import { FootballHubMatchDebateScreen } from './FootballHubMatchDebateScreen';

/** Poll score / events pendant un match live — silencieux, max ~45s. */
const LIVE_POLL_MS = 45_000;

const TAB_LABELS: Partial<Record<MatchCenterTabId, string>> = {
  resume: 'Résumé',
  stats: 'Statistiques',
  compositions: 'Compositions',
  events: 'Événements',
  video: 'Vidéo',
  analyse: 'Analyse',
};

function formatMatchDate(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function statusCaption(item: SupporterMatchViewItem): string {
  if (item.status === 'live') {
    return item.minute != null ? `LIVE ${item.minute}'` : 'LIVE';
  }
  if (item.status === 'finished') return 'Terminé';
  return 'À venir';
}

function scoreboardCenter(item: SupporterMatchViewItem): string {
  if (item.scoreHome != null && item.scoreAway != null) {
    return `${item.scoreHome} – ${item.scoreAway}`;
  }
  if (item.status === 'live') return '–';
  return formatKickoffClock(item.startsAt);
}

export type FootballHubMatchCenterScreenProps = {
  item: SupporterMatchViewItem;
  onBack: () => void;
};

export const FootballHubMatchCenterScreen: React.FC<FootballHubMatchCenterScreenProps> = ({
  item,
  onBack,
}) => {
  const agent = useFootballHubAgent();
  const [center, setCenter] = useState<MatchCenterData | null>(null);
  const [tab, setTab] = useState<MatchCenterTabId>('resume');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liveItem, setLiveItem] = useState(item);
  const [iaOpen, setIaOpen] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const itemRef = useRef(item);
  itemRef.current = item;

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const seed = itemRef.current;
      const data = await fetchMatchCenterData(seed.id, { seedItem: seed });
      if (data) {
        setCenter(data);
        setLiveItem(data.item);
        setError(false);
        setTab((current) =>
          data.availableTabs.includes(current) ? current : data.availableTabs[0] ?? 'resume',
        );
      } else if (!opts?.silent) {
        setCenter(null);
        setError(true);
      }
    } catch {
      if (!opts?.silent) {
        setCenter(null);
        setError(true);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLiveItem(item);
    void load();
  }, [item.id, load]);

  useEffect(() => {
    if (liveItem.status !== 'live') return undefined;
    const timer = setInterval(() => void load({ silent: true }), LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [liveItem.status, load]);

  const lineupRows = center?.lineups ?? [];
  const events = center?.events ?? [];
  const tabs = center?.availableTabs ?? ['resume', 'stats', 'compositions', 'events'];
  const dateLabel = useMemo(() => formatMatchDate(liveItem.startsAt), [liveItem.startsAt]);

  const askIa = async () => {
    if (!center) return;
    setIaOpen(true);
    await agent.ask('résume ce match', center);
  };

  if (showDebate) {
    return (
      <FootballHubMatchDebateScreen
        matchId={liveItem.id}
        matchLabel={`${liveItem.homeLabel} vs ${liveItem.awayLabel}`}
        onBack={() => setShowDebate(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ProDayText variant="body" style={styles.back}>
            ← Retour
          </ProDayText>
        </Pressable>
        <View style={styles.topActions}>
          {liveItem.source === 'proday' ? (
            <View style={styles.prodayBadge}>
              <ProDayText variant="caption" style={styles.prodayBadgeText}>
                PRODAY MATCH
              </ProDayText>
            </View>
          ) : null}
          <Pressable style={styles.debateBtn} onPress={() => setShowDebate(true)}>
            <ProDayText variant="caption" style={styles.debateBtnText}>
              Débattre
            </ProDayText>
          </Pressable>
        </View>
      </View>

      <View style={styles.scoreboard}>
        <View style={styles.teamCol}>
          <ProDayText variant="section" style={styles.team} numberOfLines={2}>
            {liveItem.homeLabel}
          </ProDayText>
        </View>
        <View style={styles.scoreMid}>
          <ProDayText variant="hero" style={styles.score}>
            {scoreboardCenter(liveItem)}
          </ProDayText>
          <ProDayText variant="caption" style={styles.status}>
            {statusCaption(liveItem)}
          </ProDayText>
        </View>
        <View style={styles.teamCol}>
          <ProDayText variant="section" style={styles.team} numberOfLines={2}>
            {liveItem.awayLabel}
          </ProDayText>
        </View>
      </View>

      <View style={styles.metaRow}>
        {liveItem.competitionLabel ? (
          <ProDayText variant="caption" style={styles.metaText} numberOfLines={1}>
            {liveItem.competitionLabel}
          </ProDayText>
        ) : null}
        {dateLabel ? (
          <ProDayText variant="caption" style={styles.metaText}>
            {dateLabel}
            {liveItem.status === 'upcoming' ? ` · ${formatKickoffClock(liveItem.startsAt)}` : ''}
          </ProDayText>
        ) : null}
        {liveItem.meta ? (
          <ProDayText variant="caption" style={styles.metaMuted} numberOfLines={1}>
            {liveItem.meta}
          </ProDayText>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={FOOTBALL_HUB.bright} style={{ marginTop: 40 }} />
      ) : error && !center ? (
        <View style={styles.banner}>
          <ProDayText variant="body" style={styles.bannerText}>
            Impossible de charger le détail du match.
          </ProDayText>
          <Pressable style={styles.retryBtn} onPress={() => void load({ silent: false })}>
            <ProDayText variant="caption" style={styles.retryLabel}>
              Réessayer
            </ProDayText>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabs}
          >
            {tabs.map((id) => (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={[styles.tab, tab === id && styles.tabActive]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.tabLabel, tab === id && styles.tabLabelActive]}
                >
                  {TAB_LABELS[id] ?? id}
                </ProDayText>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'resume' ? (
              <View style={styles.block}>
                <View style={styles.card}>
                  <ProDayText variant="body" style={styles.cardTitle}>
                    {liveItem.homeLabel} vs {liveItem.awayLabel}
                  </ProDayText>
                  {liveItem.competitionLabel ? (
                    <ProDayText variant="caption" style={styles.muted}>
                      {liveItem.competitionLabel}
                    </ProDayText>
                  ) : null}
                  {liveItem.meta ? (
                    <ProDayText variant="caption" style={styles.muted}>
                      {liveItem.meta}
                    </ProDayText>
                  ) : null}
                  <ProDayText variant="caption" style={styles.muted}>
                    {statusCaption(liveItem)}
                    {dateLabel ? ` · ${dateLabel}` : ''}
                    {liveItem.status === 'upcoming'
                      ? ` · ${formatKickoffClock(liveItem.startsAt)}`
                      : ''}
                  </ProDayText>
                </View>

                <ProDayText variant="section" style={styles.sectionTitle}>
                  Moments clés
                </ProDayText>
                {events.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ProDayText variant="body" style={styles.muted}>
                      Pas encore d’événements
                    </ProDayText>
                  </View>
                ) : (
                  events.map((ev, idx) => (
                    <View key={`${ev.type}-${idx}`} style={styles.eventRow}>
                      <ProDayText variant="caption" style={styles.eventMin}>
                        {ev.minute != null ? `${ev.minute}'` : '—'}
                      </ProDayText>
                      <ProDayText variant="body" style={styles.eventText}>
                        {LIVE_ACTION_LABELS[ev.type] ?? ev.type}
                        {ev.player_name ? ` · ${ev.player_name}` : ''}
                      </ProDayText>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {tab === 'stats' ? (
              <View style={styles.block}>
                {center?.statistics ? (
                  Object.keys(center.statistics.home).map((key) => (
                    <View key={key} style={styles.statRow}>
                      <ProDayText variant="caption" style={styles.statVal}>
                        {String(center.statistics!.home[key] ?? '—')}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.statKey}>
                        {key}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.statVal}>
                        {String(center.statistics!.away[key] ?? '—')}
                      </ProDayText>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <ProDayText variant="body" style={styles.muted}>
                      Statistiques non disponibles pour ce match.
                    </ProDayText>
                  </View>
                )}
              </View>
            ) : null}

            {tab === 'compositions' ? (
              lineupRows.length > 0 ? (
                lineupRows.map((row) => (
                  <MatchHubLineupTab
                    key={row.teamName}
                    event={syntheticEventFromLineup(
                      liveItem,
                      row.teamName,
                      row.lineup,
                      center?.events ?? [],
                    )}
                    canEdit={false}
                    onEditLineup={() => undefined}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <ProDayText variant="body" style={styles.muted}>
                    Composition non disponible pour ce match.
                  </ProDayText>
                </View>
              )
            ) : null}

            {tab === 'events' ? (
              <View style={styles.block}>
                {events.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ProDayText variant="body" style={styles.muted}>
                      Pas encore d’événements
                    </ProDayText>
                  </View>
                ) : (
                  events.map((ev, idx) => (
                    <ProDayText key={`${ev.type}-${idx}`} variant="body" style={styles.event}>
                      {LIVE_ACTION_LABELS[ev.type] ?? ev.type}
                      {ev.player_name ? ` · ${ev.player_name}` : ''}
                      {ev.minute != null ? ` (${ev.minute}')` : ''}
                    </ProDayText>
                  ))
                )}
              </View>
            ) : null}

            {tab === 'video' ? (
              <View style={styles.block}>
                {center?.prodayEvent?.public_watch_url ? (
                  <Pressable
                    onPress={() =>
                      void Linking.openURL(center.prodayEvent!.public_watch_url!.trim())
                    }
                  >
                    <ProDayText variant="body" style={styles.link}>
                      Ouvrir la vidéo ProDay
                    </ProDayText>
                  </Pressable>
                ) : (
                  <View style={styles.emptyCard}>
                    <ProDayText variant="body" style={styles.muted}>
                      Aucune vidéo disponible.
                    </ProDayText>
                  </View>
                )}
              </View>
            ) : null}

            {tab === 'analyse' ? (
              <View style={styles.block}>
                <ProDayText variant="body" style={styles.muted}>
                  Analyse IA basée uniquement sur les données du match. Aucune statistique inventée.
                </ProDayText>
                <Pressable onPress={() => void askIa()} style={styles.iaBtn}>
                  <ProDayText variant="body" style={styles.iaBtnText}>
                    Générer un résumé
                  </ProDayText>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}

      <Pressable style={styles.iaFab} onPress={() => void askIa()}>
        <ProDayText variant="caption" style={styles.iaFabText}>
          ProDay IA
        </ProDayText>
      </Pressable>

      {iaOpen && agent.lastReply ? (
        <View style={styles.iaPanel}>
          <ProDayText variant="body" style={styles.iaText}>
            {agent.lastReply.text}
          </ProDayText>
          <ProDayText variant="caption" style={styles.iaDisc}>
            {FOOTBALL_HUB_COPY.iaDisclaimer}
          </ProDayText>
          <Pressable onPress={() => setIaOpen(false)}>
            <ProDayText variant="caption" style={styles.link}>
              Fermer
            </ProDayText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FOOTBALL_HUB.bg },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: FOOTBALL_HUB.bright },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prodayBadge: {
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prodayBadgeText: { color: FOOTBALL_HUB.bright, fontWeight: '700', letterSpacing: 1 },
  debateBtn: {
    backgroundColor: FOOTBALL_HUB.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  debateBtnText: { color: '#fff', fontWeight: '700' },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderBottomWidth: 1,
    borderBottomColor: FOOTBALL_HUB.border,
  },
  teamCol: { flex: 1 },
  team: {
    color: FOOTBALL_HUB.foreground,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  scoreMid: { alignItems: 'center', minWidth: 108, paddingHorizontal: 4 },
  score: { color: FOOTBALL_HUB.score, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  status: { color: FOOTBALL_HUB.live, marginTop: 4, fontWeight: '700' },
  metaRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOOTBALL_HUB.border,
  },
  metaText: { color: FOOTBALL_HUB.foreground, textAlign: 'center' },
  metaMuted: { color: FOOTBALL_HUB.muted, textAlign: 'center' },
  tabsScroll: { flexGrow: 0 },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: FOOTBALL_HUB.surface,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  tabActive: { backgroundColor: FOOTBALL_HUB.soft, borderColor: FOOTBALL_HUB.accent },
  tabLabel: { color: FOOTBALL_HUB.muted },
  tabLabelActive: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  bodyScroll: { flex: 1 },
  body: { padding: 16, paddingBottom: 120, gap: spacing.md },
  block: { gap: 12 },
  card: {
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    gap: 6,
  },
  cardTitle: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  sectionTitle: {
    color: FOOTBALL_HUB.foreground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
    marginTop: 4,
  },
  muted: { color: FOOTBALL_HUB.muted },
  emptyCard: {
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  banner: {
    margin: 16,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 12,
    padding: 14,
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
  event: { color: FOOTBALL_HUB.foreground, marginBottom: 6 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  eventMin: { color: FOOTBALL_HUB.bright, fontWeight: '700', minWidth: 36 },
  eventText: { color: FOOTBALL_HUB.foreground, flex: 1 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FOOTBALL_HUB.border,
  },
  statKey: { color: FOOTBALL_HUB.muted, flex: 1, textAlign: 'center' },
  statVal: { color: FOOTBALL_HUB.foreground, width: 48, textAlign: 'center' },
  link: { color: FOOTBALL_HUB.bright },
  iaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: FOOTBALL_HUB.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  iaBtnText: { color: '#fff', fontWeight: '700' },
  iaFab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: FOOTBALL_HUB.deep,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  iaFabText: { color: FOOTBALL_HUB.bright, fontWeight: '700' },
  iaPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 72,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    gap: 8,
  },
  iaText: { color: FOOTBALL_HUB.foreground },
  iaDisc: { color: FOOTBALL_HUB.muted },
});
