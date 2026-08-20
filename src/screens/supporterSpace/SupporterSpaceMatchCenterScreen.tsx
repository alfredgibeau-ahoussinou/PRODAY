import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import {
  LineupPitch,
  MatchDetailsCard,
  MatchPlayerSheet,
  PlayerRatingsList,
  StatsBars,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE_COPY,
  SUPPORTER_SPACE_MATCH,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type {
  MatchCenterTabId,
  MergedSupporterFootballFacade,
  UnifiedLineupPlayer,
  UnifiedMatch,
  UnifiedMatchEvent,
} from '../../services/supporterFootball';
import { resolveMatchCenterTabs } from '../../services/supporterFootball';
import { SupporterSpaceMatchDebateScreen } from './SupporterSpaceMatchDebateScreen';

const TAB_LABELS: Record<MatchCenterTabId, string> = {
  resume: 'Résumé',
  composition: 'Compo',
  statistiques: 'Stats',
  evenements: 'Événements',
  video: 'Vidéo',
};

const EVENT_FR: Record<UnifiedMatchEvent['type'], string> = {
  goal: 'But',
  own_goal: 'CSC',
  penalty: 'Pénalty',
  yellow_card: 'Carton jaune',
  red_card: 'Carton rouge',
  substitution: 'Remplacement',
  var: 'VAR',
  other: 'Événement',
};

function statusFr(match: UnifiedMatch): string {
  if (match.status === 'live') {
    return match.score.minute != null ? `${match.score.minute}'` : 'Live';
  }
  if (match.status === 'halftime') return 'MT';
  if (match.status === 'finished') {
    if (match.score.minute != null && match.score.minute >= 90) return '90:00';
    return match.score.period || 'FT';
  }
  if (match.status === 'scheduled') {
    return match.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return match.status;
}

function hasRealHighlights(match: UnifiedMatch): boolean {
  return Boolean(match.video?.rightsOk && match.video.url);
}

type Props = {
  matchId: string;
  seed?: UnifiedMatch | null;
  onClose: () => void;
  facade: MergedSupporterFootballFacade;
};

export const SupporterSpaceMatchCenterScreen: React.FC<Props> = ({
  matchId,
  seed,
  onClose,
  facade,
}) => {
  const [match, setMatch] = useState<UnifiedMatch | null>(seed ?? null);
  const [tab, setTab] = useState<MatchCenterTabId>('resume');
  const [loading, setLoading] = useState(!seed);
  const [showDebate, setShowDebate] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<UnifiedLineupPlayer | null>(null);

  const load = useCallback(async () => {
    try {
      const payload = await facade.getMatchCenter(matchId);
      if (payload?.match) setMatch(payload.match);
    } finally {
      setLoading(false);
    }
  }, [facade, matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      void load();
    }, 45_000);
    return () => clearInterval(id);
  }, [load]);

  const tabs = useMemo(
    () => (match ? resolveMatchCenterTabs(match) : (['resume'] as MatchCenterTabId[])),
    [match],
  );

  useEffect(() => {
    if (!tabs.includes(tab)) setTab(tabs[0] ?? 'resume');
  }, [tabs, tab]);

  if (showDebate && match) {
    return (
      <SupporterSpaceMatchDebateScreen
        matchId={match.id}
        matchLabel={`${match.homeTeam.name} – ${match.awayTeam.name}`}
        onBack={() => setShowDebate(false)}
      />
    );
  }

  const showScore =
    match &&
    (match.status === 'live' || match.status === 'halftime' || match.status === 'finished');

  const htAvailable =
    match &&
    (match.score.halfTimeHome != null || match.score.halfTimeAway != null);

  const highlightsOk = match ? hasRealHighlights(match) : false;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.headerTop}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.back}>
            <Icon name="arrow-back" size={22} color={SUPPORTER_SPACE_MATCH.foreground} />
          </Pressable>
          <ProDayText variant="caption" style={styles.compTitle} numberOfLines={1}>
            {match?.competition.name || 'Match'}
            {match?.round ? ` · J${match.round}` : ''}
          </ProDayText>
          <Pressable onPress={() => setShowDebate(true)} style={styles.debateBtn}>
            <ProDayText variant="caption" style={styles.debateText}>
              {SUPPORTER_SPACE_COPY.debateCta}
            </ProDayText>
          </Pressable>
        </View>

        {match ? (
          <View style={styles.scoreboard}>
            <View style={styles.teamBlock}>
              {match.homeTeam.logoUrl ? (
                <Image source={{ uri: match.homeTeam.logoUrl }} style={styles.logoLg} />
              ) : (
                <View style={[styles.logoLg, styles.logoPh]} />
              )}
              <ProDayText variant="caption" style={styles.teamLabel} numberOfLines={2}>
                {match.homeTeam.shortName || match.homeTeam.name}
              </ProDayText>
            </View>

            <View style={styles.scoreMid}>
              <ProDayText variant="hero" style={styles.scoreBig}>
                {showScore
                  ? `${match.score.home ?? '–'} - ${match.score.away ?? '–'}`
                  : 'vs'}
              </ProDayText>
              <View style={styles.timePill}>
                <ProDayText variant="caption" style={styles.timePillText}>
                  {statusFr(match)}
                </ProDayText>
              </View>
            </View>

            <View style={styles.teamBlock}>
              {match.awayTeam.logoUrl ? (
                <Image source={{ uri: match.awayTeam.logoUrl }} style={styles.logoLg} />
              ) : (
                <View style={[styles.logoLg, styles.logoPh]} />
              )}
              <ProDayText variant="caption" style={styles.teamLabel} numberOfLines={2}>
                {match.awayTeam.shortName || match.awayTeam.name}
              </ProDayText>
            </View>
          </View>
        ) : null}

        {highlightsOk && match?.video?.url ? (
          <Pressable
            onPress={() => void Linking.openURL(match.video!.url)}
            style={styles.highlightsBtn}
          >
            <Icon name="play" size={18} color={SUPPORTER_SPACE_MATCH.onAccent} />
            <ProDayText variant="body" style={styles.highlightsText}>
              {match.video.label || SUPPORTER_SPACE_COPY.watchHighlights}
            </ProDayText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
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
              {TAB_LABELS[id]}
            </ProDayText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !match ? (
          <ActivityIndicator color={SUPPORTER_SPACE_MATCH.accent} />
        ) : null}

        {match && tab === 'resume' ? (
          <View style={styles.block}>
            {htAvailable ? (
              <ProDayText variant="caption" style={styles.mutedCenter}>
                Mi-temps {match.score.halfTimeHome ?? '–'} – {match.score.halfTimeAway ?? '–'}
                {match.venue ? ` · ${match.venue}` : ''}
              </ProDayText>
            ) : match.venue ? (
              <ProDayText variant="caption" style={styles.mutedCenter}>
                {match.venue}
              </ProDayText>
            ) : null}

            <MatchDetailsCard statistics={match.statistics} />

            <PlayerRatingsList
              lineup={match.lineup}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              onPlayerPress={setSelectedPlayer}
            />

            {(match.events ?? []).length ? (
              <View style={styles.eventsPreview}>
                {(match.events ?? []).slice(0, 6).map((ev) => (
                  <ProDayText key={ev.id} variant="body" style={styles.eventLine}>
                    {ev.minute != null ? `${ev.minute}' ` : ''}
                    {EVENT_FR[ev.type]} — {ev.playerName || '—'}
                  </ProDayText>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {match && tab === 'composition' ? (
          <View style={styles.block}>
            <LineupPitch
              side={match.lineup?.home}
              title={match.homeTeam.name}
              onPlayerPress={setSelectedPlayer}
            />
            <LineupPitch
              side={match.lineup?.away}
              title={match.awayTeam.name}
              onPlayerPress={setSelectedPlayer}
            />
          </View>
        ) : null}

        {match && tab === 'statistiques' ? (
          <View style={[styles.block, styles.statsCard]}>
            <StatsBars
              statistics={match.statistics}
              homeLabel={match.homeTeam.shortName || match.homeTeam.name}
              awayLabel={match.awayTeam.shortName || match.awayTeam.name}
              variant="dark"
            />
          </View>
        ) : null}

        {match && tab === 'evenements' ? (
          <View style={styles.block}>
            {(match.events ?? []).length ? (
              (match.events ?? []).map((ev) => (
                <View key={ev.id} style={styles.timelineRow}>
                  <ProDayText variant="caption" style={styles.minute}>
                    {ev.minute != null ? `${ev.minute}'` : '—'}
                  </ProDayText>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="body" style={styles.eventLine}>
                      {EVENT_FR[ev.type]} · {ev.playerName || '—'}
                    </ProDayText>
                    {ev.detail ? (
                      <ProDayText variant="caption" style={styles.muted}>
                        {ev.detail}
                      </ProDayText>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <ProDayText variant="body" style={styles.muted}>
                {SUPPORTER_SPACE_COPY.noEventsYet}
              </ProDayText>
            )}
          </View>
        ) : null}

        {match && tab === 'video' ? (
          <View style={styles.block}>
            {hasRealHighlights(match) ? (
              <Pressable
                onPress={() => void Linking.openURL(match.video!.url)}
                style={styles.highlightsBtn}
              >
                <Icon name="play" size={18} color={SUPPORTER_SPACE_MATCH.onAccent} />
                <ProDayText variant="body" style={styles.highlightsText}>
                  {match.video?.label || SUPPORTER_SPACE_COPY.watchHighlights}
                </ProDayText>
              </Pressable>
            ) : (
              <ProDayText variant="body" style={styles.muted}>
                {SUPPORTER_SPACE_COPY.noVideoRights}
              </ProDayText>
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={selectedPlayer != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelectedPlayer(null)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedPlayer ? (
              <MatchPlayerSheet
                player={selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SPACE_MATCH.bg },
  hero: {
    backgroundColor: SUPPORTER_SPACE_MATCH.elevated,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  back: { padding: 4 },
  compTitle: {
    flex: 1,
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '600',
    textAlign: 'center',
  },
  debateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE_MATCH.accentSoft,
  },
  debateText: { color: SUPPORTER_SPACE_MATCH.foreground, fontWeight: '600' },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  teamBlock: { width: 96, alignItems: 'center', gap: 8 },
  teamLabel: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    textAlign: 'center',
    fontWeight: '600',
  },
  scoreMid: { alignItems: 'center', gap: 10, flexShrink: 0 },
  scoreBig: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timePill: {
    backgroundColor: SUPPORTER_SPACE_MATCH.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timePillText: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  logoLg: { width: 56, height: 56, borderRadius: 28 },
  logoPh: { backgroundColor: SUPPORTER_SPACE_MATCH.surface },
  highlightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE_MATCH.accent,
  },
  highlightsText: {
    color: SUPPORTER_SPACE_MATCH.onAccent,
    fontWeight: '700',
  },
  tabs: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    marginRight: 8,
  },
  tabActive: { backgroundColor: SUPPORTER_SPACE_MATCH.accent },
  tabLabel: { color: SUPPORTER_SPACE_MATCH.muted, fontWeight: '600' },
  tabLabelActive: { color: SUPPORTER_SPACE_MATCH.onAccent },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  block: { gap: 16 },
  muted: { color: SUPPORTER_SPACE_MATCH.muted },
  mutedCenter: {
    color: SUPPORTER_SPACE_MATCH.muted,
    textAlign: 'center',
  },
  eventLine: { color: SUPPORTER_SPACE_MATCH.foreground },
  eventsPreview: { gap: 8 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  minute: {
    color: SUPPORTER_SPACE_MATCH.accent,
    width: 36,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    borderRadius: 20,
    padding: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
});
