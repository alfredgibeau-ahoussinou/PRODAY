import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { PressableSpring, StaggerReveal } from '../../motion';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import type { TeamEvent, LiveActionType, MatchLiveStatus } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { LIVE_ACTION_LABELS, getPresentInviteeUids } from '../../../models/TeamEvent';
import { teamEventsService } from '../../../services/teamEvents.service';
import { usersService } from '../../../services/users.service';
import { resolveLiveState } from '../../../utils/matchLive';
import { MatchLiveScoreboard } from './MatchLiveScoreboard';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { ProDayGradient } from '../../ui/ProDayGradient';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

const ACTION_TYPES: LiveActionType[] = [
  'goal',
  'assist',
  'yellow_card',
  'red_card',
  'sub_in',
  'sub_out',
];

const STATUS_OPTIONS: MatchLiveStatus[] = ['scheduled', 'live', 'halftime', 'finished'];

interface MatchHubLiveTabProps {
  event: TeamEvent;
  profile: User;
  canManage: boolean;
  reportLocked: boolean;
  onUpdated: () => void;
}

export const MatchHubLiveTab: React.FC<MatchHubLiveTabProps> = ({
  event,
  profile,
  canManage,
  reportLocked,
  onUpdated,
}) => {
  const actor = { user: profile };
  const { colors } = useAppTheme();
  const live = resolveLiveState(event);
  const [players, setPlayers] = useState<{ uid: string; name: string }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [minute, setMinute] = useState(String(live.minute ?? ''));
  const [opponent, setOpponent] = useState(live.opponent_name ?? '');
  const [saving, setSaving] = useState(false);
  const [loadedPlayers, setLoadedPlayers] = useState(false);

  React.useEffect(() => {
    void (async () => {
      const list: { uid: string; name: string }[] = [];
      for (const uid of getPresentInviteeUids(event)) {
        const u = await usersService.getPublicById(uid);
        if (u) list.push({ uid, name: u.display_name });
      }
      for (const s of event.lineup?.slots ?? []) {
        if (!list.find((p) => p.uid === s.uid)) {
          list.push({ uid: s.uid, name: s.display_name });
        }
      }
      setPlayers(list);
      if (list[0]) setSelectedPlayer(list[0].uid);
      setLoadedPlayers(true);
    })();
  }, [event.id, event.invitee_uids.length, event.lineup?.slots.length]);

  const timeline = useMemo(
    () =>
      [...(event.live_actions ?? [])].sort(
        (a, b) => a.minute - b.minute || a.created_at.getTime() - b.created_at.getTime()
      ),
    [event.live_actions]
  );

  const bumpScore = async (side: 'home' | 'away', delta: number) => {
    if (!canManage || reportLocked) return;
    setSaving(true);
    try {
      const key = side === 'home' ? 'home_score' : 'away_score';
      await teamEventsService.updateMatchLiveState(
        event.id,
        {
          [key]: Math.max(0, live[key] + delta),
          status: live.status === 'scheduled' ? 'live' : live.status,
        },
        actor,
      );
      if (delta > 0) prodayHaptics.matchGoal();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: MatchLiveStatus) => {
    if (!canManage || reportLocked) return;
    setSaving(true);
    try {
      await teamEventsService.updateMatchLiveState(event.id, { status }, actor);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const saveMeta = async () => {
    if (!canManage || reportLocked) return;
    setSaving(true);
    try {
      await teamEventsService.updateMatchLiveState(
        event.id,
        {
          minute: parseInt(minute, 10) || 0,
          opponent_name: opponent.trim() || 'Adversaire',
        },
        actor,
      );
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const addAction = async (type: LiveActionType) => {
    if (!canManage || reportLocked) return;
    if (!selectedPlayer) {
      Alert.alert('Joueur', 'Sélectionnez un joueur.');
      return;
    }
    const player = players.find((p) => p.uid === selectedPlayer);
    if (!player) return;
    setSaving(true);
    try {
      await teamEventsService.addLiveAction(
        event.id,
        {
          type,
          player_uid: player.uid,
          player_name: player.name,
          minute: parseInt(minute, 10) || 0,
        },
        actor,
      );
      onUpdated();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Ajout impossible.');
    } finally {
      setSaving(false);
    }
  };

  const applyStats = () => {
    Alert.alert('Stats saison', 'Appliquer buts et passes aux profils joueurs ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Appliquer',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await teamEventsService.applyLiveStatsToPlayers(event.id, actor);
              Alert.alert('OK', 'Stats saison mises à jour.');
              onUpdated();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <MatchLiveScoreboard state={live} />

      {canManage && !reportLocked ? (
        <ProDaySurface variant="module" style={[styles.panel, { borderColor: colors.border }]}>
          <ProDayText variant="section">Contrôle staff</ProDayText>
          <View style={styles.scoreCtrl}>
            <View style={styles.scoreSide}>
              <ProDayText variant="caption" muted>
                {live.home_label}
              </ProDayText>
              <View style={styles.scoreBtns}>
                <PressableSpring
                  style={[styles.scoreBtn, { borderColor: colors.border }]}
                  onPress={() => void bumpScore('home', -1)}
                  disabled={saving}
                  scaleTo={0.9}
                >
                  <ProDayText variant="section">−</ProDayText>
                </PressableSpring>
                <PressableSpring
                  style={[styles.scoreBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    prodayHaptics.press();
                    void bumpScore('home', 1);
                  }}
                  disabled={saving}
                  scaleTo={0.9}
                  haptic
                >
                  <ProDayText variant="section">+</ProDayText>
                </PressableSpring>
              </View>
            </View>
            <View style={styles.scoreSide}>
              <ProDayText variant="caption" muted>
                {live.opponent_name}
              </ProDayText>
              <View style={styles.scoreBtns}>
                <PressableSpring
                  style={[styles.scoreBtn, { borderColor: colors.border }]}
                  onPress={() => void bumpScore('away', -1)}
                  disabled={saving}
                  scaleTo={0.9}
                >
                  <ProDayText variant="section">−</ProDayText>
                </PressableSpring>
                <PressableSpring
                  style={[styles.scoreBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    prodayHaptics.press();
                    void bumpScore('away', 1);
                  }}
                  disabled={saving}
                  scaleTo={0.9}
                  haptic
                >
                  <ProDayText variant="section">+</ProDayText>
                </PressableSpring>
              </View>
            </View>
          </View>

          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((st) => (
              <PressableSpring
                key={st}
                style={[
                  styles.statusChip,
                  { borderColor: colors.border },
                  live.status === st && { backgroundColor: colors.accentSoft },
                ]}
                onPress={() => void setStatus(st)}
                disabled={saving}
                scaleTo={0.96}
                haptic={!saving}
              >
                <ProDayText variant="caption" accent={live.status === st}>
                  {st === 'live' ? 'Direct' : st === 'halftime' ? 'MT' : st === 'finished' ? 'Fin' : 'À venir'}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Adversaire"
            placeholderTextColor={colors.textMuted}
            value={opponent}
            onChangeText={setOpponent}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Minute"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={minute}
            onChangeText={setMinute}
          />
          <PressableSpring onPress={() => void saveMeta()} disabled={saving} scaleTo={0.97} haptic={!saving}>
            <ProDayGradient kind="cta" style={styles.saveBtn}>
              <ProDayText variant="caption" inverse style={styles.saveText}>
                Enregistrer minute / adversaire
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {canManage && !reportLocked && loadedPlayers ? (
        <ProDaySurface variant="module" style={[styles.panel, { borderColor: colors.border }]}>
          <ProDayText variant="section">Actions live</ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
            {players.map((p) => (
              <PressableSpring
                key={p.uid}
                style={[
                  styles.playerChip,
                  { borderColor: colors.border },
                  selectedPlayer === p.uid && { backgroundColor: colors.accentSoft },
                ]}
                onPress={() => setSelectedPlayer(p.uid)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" accent={selectedPlayer === p.uid}>
                  {p.name.split(' ')[0]}
                </ProDayText>
              </PressableSpring>
            ))}
          </ScrollView>
          <View style={styles.actionGrid}>
            {ACTION_TYPES.map((type) => (
              <PressableSpring
                key={type}
                style={[styles.actionBtn, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
                onPress={() => {
                  prodayHaptics.press();
                  void addAction(type);
                }}
                disabled={saving}
                scaleTo={0.95}
                haptic={!saving}
              >
                <ProDayText variant="caption" accent style={styles.actionText}>
                  {LIVE_ACTION_LABELS[type]}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>
        </ProDaySurface>
      ) : null}

      <ProDayText variant="section">Fil du match</ProDayText>
      {timeline.length === 0 ? (
        <ProDayText variant="body" muted>
          Aucune action. Les buts, cartons et remplacements apparaîtront ici.
        </ProDayText>
      ) : (
        timeline.map((a, index) => (
          <StaggerReveal key={a.id} index={index}>
            <View style={[styles.timelineRow, { borderBottomColor: colors.border }]}>
              <ProDayText variant="caption" accent style={styles.timelineMin}>
                {a.minute}'
              </ProDayText>
              <View style={styles.timelineBody}>
                <ProDayText variant="body">{LIVE_ACTION_LABELS[a.type]}</ProDayText>
                <ProDayText variant="caption" muted>
                  {a.player_name}
                </ProDayText>
              </View>
            </View>
          </StaggerReveal>
        ))
      )}

      {canManage &&
      timeline.length > 0 &&
      !event.stats_applied_at &&
      !reportLocked &&
      Boolean(event.match_report_finalized_at) ? (
        <PressableSpring onPress={applyStats} disabled={saving} scaleTo={0.97} haptic={!saving}>
          <ProDayGradient kind="cta" style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ProDayText variant="caption" inverse style={styles.saveText}>
                Appliquer aux stats saison
              </ProDayText>
            )}
          </ProDayGradient>
        </PressableSpring>
      ) : null}

      {canManage && timeline.length > 0 && !event.stats_applied_at && !event.match_report_finalized_at ? (
        <ProDayText variant="caption" muted style={styles.locked}>
          Validez le rapport de match pour appliquer les stats saison.
        </ProDayText>
      ) : null}

      {event.stats_applied_at ? (
        <ProDayText variant="caption" accent style={styles.applied}>
          Stats saison déjà appliquées pour ce match.
        </ProDayText>
      ) : null}

      {reportLocked ? (
        <ProDayText variant="caption" muted style={styles.locked}>
          Rapport validé. Édition verrouillée.
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  panel: { borderWidth: 1, gap: spacing.sm },
  scoreCtrl: { flexDirection: 'row', gap: spacing.md },
  scoreSide: { flex: 1, alignItems: 'center', gap: spacing.xs },
  scoreBtns: { flexDirection: 'row', gap: spacing.sm },
  scoreBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  saveBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  saveText: { fontWeight: '800' },
  playerScroll: { marginVertical: spacing.xs },
  playerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionText: { fontWeight: '800' },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timelineMin: { width: 36, fontWeight: '900' },
  timelineBody: { flex: 1 },
  applied: { fontWeight: '700', textAlign: 'center' },
  locked: { fontStyle: 'italic', textAlign: 'center' },
});
