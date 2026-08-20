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
  StatsBars,
} from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
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
  composition: 'Composition',
  statistiques: 'Statistiques',
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
    return match.score.minute != null ? `Live ${match.score.minute}'` : 'Live';
  }
  if (match.status === 'halftime') return 'Mi-temps';
  if (match.status === 'finished') {
    return match.score.period || 'FT';
  }
  if (match.status === 'scheduled') {
    return `Coup d’envoi ${match.date.toLocaleString('fr-FR')}`;
  }
  return match.status;
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.back}>
          <Icon name="arrow-back" size={22} color={SUPPORTER_SPACE.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProDayText variant="caption" style={styles.comp} numberOfLines={1}>
            {match?.competition.name ?? 'Match'}
            {match?.score.period ? ` · ${match.score.period}` : ''}
          </ProDayText>
          {match ? (
            <View style={styles.scoreboardRow}>
              {match.homeTeam.logoUrl ? (
                <Image source={{ uri: match.homeTeam.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPh]} />
              )}
              <ProDayText variant="title" style={styles.scoreboard}>
                {match.homeTeam.shortName || match.homeTeam.name}
                {'  '}
                {showScore ? `${match.score.home ?? '–'} – ${match.score.away ?? '–'}` : 'vs'}
                {'  '}
                {match.awayTeam.shortName || match.awayTeam.name}
              </ProDayText>
              {match.awayTeam.logoUrl ? (
                <Image source={{ uri: match.awayTeam.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPh]} />
              )}
            </View>
          ) : null}
          {match?.venue ? (
            <ProDayText variant="caption" style={styles.venue} numberOfLines={1}>
              {match.venue}
            </ProDayText>
          ) : null}
        </View>
        <Pressable onPress={() => setShowDebate(true)} style={styles.debateBtn}>
          <ProDayText variant="caption" style={styles.debateText}>
            {SUPPORTER_SPACE_COPY.debateCta}
          </ProDayText>
        </Pressable>
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
          <ActivityIndicator color={SUPPORTER_SPACE.bright} />
        ) : null}

        {match && tab === 'resume' ? (
          <View style={styles.block}>
            <ProDayText variant="body" style={styles.muted}>
              Statut : {statusFr(match)}
            </ProDayText>
            {showScore ? (
              <ProDayText variant="body" style={styles.eventLine}>
                Score FT : {match.score.home ?? '–'} – {match.score.away ?? '–'}
              </ProDayText>
            ) : null}
            {htAvailable ? (
              <ProDayText variant="body" style={styles.muted}>
                Score HT : {match.score.halfTimeHome ?? '–'} – {match.score.halfTimeAway ?? '–'}
              </ProDayText>
            ) : null}
            {match.venue ? (
              <ProDayText variant="body" style={styles.muted}>
                Lieu : {match.venue}
              </ProDayText>
            ) : null}
            <ProDayText variant="caption" style={styles.source}>
              Source : {match.source}
            </ProDayText>
            {(match.events ?? []).length ? (
              (match.events ?? []).slice(0, 8).map((ev) => (
                <ProDayText key={ev.id} variant="body" style={styles.eventLine}>
                  {ev.minute != null ? `${ev.minute}' ` : ''}
                  {EVENT_FR[ev.type]} — {ev.playerName || '—'}
                </ProDayText>
              ))
            ) : (
              <ProDayText variant="body" style={styles.muted}>
                Pas encore d’événements publiés.
              </ProDayText>
            )}
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
          <View style={styles.block}>
            <StatsBars
              statistics={match.statistics}
              homeLabel={match.homeTeam.shortName || match.homeTeam.name}
              awayLabel={match.awayTeam.shortName || match.awayTeam.name}
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
                Pas encore d’événements publiés.
              </ProDayText>
            )}
          </View>
        ) : null}

        {match && tab === 'video' ? (
          <View style={styles.block}>
            {match.video?.rightsOk && match.video.url ? (
              <Pressable
                onPress={() => void Linking.openURL(match.video!.url)}
                style={styles.videoBtn}
              >
                <ProDayText variant="body" style={styles.videoBtnText}>
                  {match.video.label || 'Ouvrir la diffusion'}
                </ProDayText>
              </Pressable>
            ) : (
              <ProDayText variant="body" style={styles.muted}>
                Aucune vidéo avec droits de diffusion.
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
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {selectedPlayer ? (
              <>
                <View style={styles.sheetHead}>
                  {selectedPlayer.photoUrl ? (
                    <Image source={{ uri: selectedPlayer.photoUrl }} style={styles.sheetPhoto} />
                  ) : (
                    <View style={[styles.sheetPhoto, styles.logoPh]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="title" style={styles.scoreboard}>
                      {selectedPlayer.captain
                        ? `(C) ${selectedPlayer.name}`
                        : selectedPlayer.name}
                    </ProDayText>
                    {selectedPlayer.number != null ? (
                      <ProDayText variant="caption" style={styles.muted}>
                        N° {selectedPlayer.number}
                        {selectedPlayer.role === 'bench' ? ' · Remplaçant' : ' · Titulaire'}
                      </ProDayText>
                    ) : null}
                  </View>
                  <Pressable onPress={() => setSelectedPlayer(null)} hitSlop={12}>
                    <Icon name="close" size={22} color={SUPPORTER_SPACE.foreground} />
                  </Pressable>
                </View>
                <View style={styles.sheetStats}>
                  {selectedPlayer.rating != null ? (
                    <SheetStat label="Note" value={String(selectedPlayer.rating)} />
                  ) : null}
                  {selectedPlayer.minutes != null ? (
                    <SheetStat label="Minutes" value={`${selectedPlayer.minutes}'`} />
                  ) : null}
                  {selectedPlayer.goals != null ? (
                    <SheetStat label="Buts" value={String(selectedPlayer.goals)} />
                  ) : null}
                  {selectedPlayer.shots != null ? (
                    <SheetStat label="Tirs" value={String(selectedPlayer.shots)} />
                  ) : null}
                  {selectedPlayer.xg != null ? (
                    <SheetStat label="xG" value={String(selectedPlayer.xg)} />
                  ) : null}
                  {selectedPlayer.rating == null &&
                  selectedPlayer.minutes == null &&
                  selectedPlayer.goals == null &&
                  selectedPlayer.shots == null &&
                  selectedPlayer.xg == null ? (
                    <ProDayText variant="body" style={styles.muted}>
                      Aucune statistique joueur publiée pour ce match.
                    </ProDayText>
                  ) : null}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const SheetStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.sheetStat}>
    <ProDayText variant="caption" style={styles.muted}>
      {label}
    </ProDayText>
    <ProDayText variant="title" style={styles.scoreboard}>
      {value}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SUPPORTER_SPACE.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SPACE.border,
  },
  back: { padding: 4 },
  comp: { color: SUPPORTER_SPACE.muted },
  venue: { color: SUPPORTER_SPACE.muted, marginTop: 2 },
  scoreboardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreboard: { color: SUPPORTER_SPACE.foreground, fontSize: 16, flexShrink: 1 },
  logo: { width: 22, height: 22, borderRadius: 11 },
  logoPh: { backgroundColor: SUPPORTER_SPACE.elevated },
  debateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: SUPPORTER_SPACE.soft,
  },
  debateText: { color: SUPPORTER_SPACE.bright },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    marginRight: 8,
  },
  tabActive: { borderColor: SUPPORTER_SPACE.accent, backgroundColor: SUPPORTER_SPACE.soft },
  tabLabel: { color: SUPPORTER_SPACE.muted },
  tabLabelActive: { color: SUPPORTER_SPACE.foreground },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  block: { gap: 10 },
  muted: { color: SUPPORTER_SPACE.muted },
  source: { color: SUPPORTER_SPACE.proday, marginTop: 8 },
  eventLine: { color: SUPPORTER_SPACE.foreground },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  minute: { color: SUPPORTER_SPACE.bright, width: 36 },
  videoBtn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.accent,
    alignItems: 'center',
  },
  videoBtnText: { color: '#fff' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SUPPORTER_SPACE.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    gap: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetPhoto: { width: 56, height: 56, borderRadius: 28 },
  sheetStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sheetStat: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: SUPPORTER_SPACE.elevated,
  },
});
