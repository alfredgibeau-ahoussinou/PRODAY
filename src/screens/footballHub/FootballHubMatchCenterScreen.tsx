import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const scoreLabel =
    liveItem.scoreHome != null && liveItem.scoreAway != null
      ? `${liveItem.scoreHome} – ${liveItem.scoreAway}`
      : formatKickoffClock(liveItem.startsAt);

  const askIa = async () => {
    if (!center) return;
    setIaOpen(true);
    await agent.ask('résume ce match', center);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ProDayText variant="body" style={styles.back}>
            ← Retour
          </ProDayText>
        </Pressable>
        {liveItem.source === 'proday' ? (
          <View style={styles.prodayBadge}>
            <ProDayText variant="caption" style={styles.prodayBadgeText}>
              PRODAY MATCH
            </ProDayText>
          </View>
        ) : null}
      </View>

      <View style={styles.scoreboard}>
        <ProDayText variant="body" style={styles.team} numberOfLines={1}>
          {liveItem.homeLabel}
        </ProDayText>
        <View style={styles.scoreMid}>
          <ProDayText variant="hero" style={styles.score}>
            {scoreLabel}
          </ProDayText>
          <ProDayText variant="caption" style={styles.status}>
            {liveItem.status === 'live'
              ? `LIVE${liveItem.minute != null ? ` ${liveItem.minute}'` : ''}`
              : liveItem.status === 'finished'
                ? 'Terminé'
                : formatKickoffClock(liveItem.startsAt)}
          </ProDayText>
          {liveItem.competitionLabel ? (
            <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
              {liveItem.competitionLabel}
            </ProDayText>
          ) : null}
        </View>
        <ProDayText variant="body" style={styles.team} numberOfLines={1}>
          {liveItem.awayLabel}
        </ProDayText>
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
            contentContainerStyle={styles.tabs}
          >
            {(center?.availableTabs ?? ['resume', 'compositions']).map((id) => (
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

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {tab === 'resume' ? (
              <View style={styles.block}>
                <ProDayText variant="body" style={styles.muted}>
                  {liveItem.homeLabel} vs {liveItem.awayLabel}
                  {liveItem.competitionLabel ? ` · ${liveItem.competitionLabel}` : ''}
                </ProDayText>
                {liveItem.meta ? (
                  <ProDayText variant="caption" style={styles.muted}>
                    {liveItem.meta}
                  </ProDayText>
                ) : null}
                {!center ? (
                  <ProDayText variant="body" style={styles.muted}>
                    Détail indisponible pour ce match.
                  </ProDayText>
                ) : null}
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
                  <ProDayText variant="body" style={styles.muted}>
                    Statistiques non disponibles pour ce match.
                  </ProDayText>
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
                {(center?.events ?? []).length === 0 ? (
                  <ProDayText variant="body" style={styles.muted}>
                    Aucun événement enregistré.
                  </ProDayText>
                ) : (
                  (center?.events ?? []).map((ev, idx) => (
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
                  <ProDayText variant="body" style={styles.muted}>
                    Aucune vidéo disponible.
                  </ProDayText>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: FOOTBALL_HUB.bright },
  prodayBadge: {
    backgroundColor: FOOTBALL_HUB.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prodayBadgeText: { color: FOOTBALL_HUB.bright, fontWeight: '700', letterSpacing: 1 },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderBottomWidth: 1,
    borderBottomColor: FOOTBALL_HUB.border,
  },
  team: { flex: 1, color: FOOTBALL_HUB.foreground, textAlign: 'center', fontWeight: '600' },
  scoreMid: { alignItems: 'center', minWidth: 100 },
  score: { color: FOOTBALL_HUB.score, fontSize: 28 },
  status: { color: FOOTBALL_HUB.live, marginTop: 4, fontWeight: '700' },
  comp: { color: FOOTBALL_HUB.muted, marginTop: 2, maxWidth: 140 },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: FOOTBALL_HUB.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  tabActive: { backgroundColor: FOOTBALL_HUB.soft, borderColor: FOOTBALL_HUB.accent },
  tabLabel: { color: FOOTBALL_HUB.muted },
  tabLabelActive: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 120, gap: spacing.md },
  block: { gap: 10 },
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
