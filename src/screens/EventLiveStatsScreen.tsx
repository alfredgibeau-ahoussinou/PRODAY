import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TeamEvent, LiveActionType } from '../models/TeamEvent';
import {
  LIVE_ACTION_LABELS,
  getPresentInviteeUids,
} from '../models/TeamEvent';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { useAuth } from '../context/AuthContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

const ACTION_TYPES: LiveActionType[] = [
  'goal',
  'assist',
  'yellow_card',
  'red_card',
  'sub_in',
  'sub_out',
];

interface EventLiveStatsScreenProps {
  eventId: string;
  onBack: () => void;
}

export const EventLiveStatsScreen: React.FC<EventLiveStatsScreenProps> = ({
  eventId,
  onBack,
}) => {
  const { profile, isAdmin } = useAuth();
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [players, setPlayers] = useState<{ uid: string; name: string }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [minute, setMinute] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const ev = await teamEventsService.getById(eventId);
    setEvent(ev);
    if (ev) {
      const list: { uid: string; name: string }[] = [];
      for (const uid of getPresentInviteeUids(ev)) {
        const u = await usersService.getById(uid);
        if (u) list.push({ uid, name: u.display_name });
      }
      if (ev.lineup?.slots.length) {
        for (const s of ev.lineup.slots) {
          if (!list.find((p) => p.uid === s.uid)) {
            list.push({ uid: s.uid, name: s.display_name });
          }
        }
      }
      setPlayers(list);
      if (list[0]) setSelectedPlayer(list[0].uid);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManageFinalizedReport =
    Boolean(isAdmin) ||
    profile?.role === 'coach' ||
    profile?.role === 'organizer' ||
    profile?.role === 'agent' ||
    profile?.role === 'club';
  const reportLocked = Boolean(event?.match_report_finalized_at) && !canManageFinalizedReport;

  const addAction = async (type: LiveActionType) => {
    if (reportLocked) {
      Alert.alert('Rapport verrouillé', 'Ce rapport validé est en lecture seule.');
      return;
    }
    if (!selectedPlayer) {
      Alert.alert(
        isWoman ? 'Joueuse' : 'Joueur',
        isWoman ? 'Sélectionnez une joueuse.' : 'Sélectionnez un joueur.'
      );
      return;
    }
    const player = players.find((p) => p.uid === selectedPlayer);
    if (!player) return;

    setSaving(true);
    try {
      if (!profile) return;
      await teamEventsService.addLiveAction(
        eventId,
        {
          type,
          player_uid: player.uid,
          player_name: player.name,
          minute: parseInt(minute, 10) || 0,
        },
        { user: profile, isAdmin },
      );
      setMinute('');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Ajout impossible.');
    } finally {
      setSaving(false);
    }
  };

  const applyStats = async () => {
    if (reportLocked) {
      Alert.alert('Rapport verrouillé', 'Ce rapport validé est en lecture seule.');
      return;
    }
    Alert.alert(
      'Mettre à jour les stats saison',
      isWoman
        ? 'Les buts et passes seront ajoutés aux profils joueuses (+1 match). Continuer ?'
        : 'Les buts et passes seront ajoutés aux profils joueurs (+1 match). Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appliquer',
          onPress: async () => {
            setSaving(true);
            try {
              if (!profile) return;
              await teamEventsService.applyLiveStatsToPlayers(eventId, {
                user: profile,
                isAdmin,
              });
              Alert.alert(
                'Stats appliquées',
                isWoman ? 'Profils joueuses mis à jour.' : 'Profils joueurs mis à jour.'
              );
              await load();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !event) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  const timeline = [...(event?.live_actions ?? [])].sort(
    (a, b) => a.minute - b.minute || a.created_at.getTime() - b.created_at.getTime()
  );

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Live Stats" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Saisie en direct des actions — alimente le CV foot après validation.
        </Text>
        {event?.match_report_finalized_at ? (
          <Text style={styles.lockedMsg}>
            Rapport validé le{' '}
            {event.match_report_finalized_at.toLocaleDateString('fr-FR')} — édition verrouillée.
          </Text>
        ) : null}

        <Text style={styles.label}>{isWoman ? 'Joueuse' : 'Joueur'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
          {players.map((p) => (
            <TouchableOpacity
              key={p.uid}
              style={[styles.playerChip, selectedPlayer === p.uid && styles.playerChipActive]}
              onPress={() => setSelectedPlayer(p.uid)}
            >
              <Text
                style={[
                  styles.playerChipText,
                  selectedPlayer === p.uid && styles.playerChipTextActive,
                ]}
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Minute (ex. 67)"
          placeholderTextColor={c.textMuted}
          value={minute}
          onChangeText={setMinute}
          keyboardType="number-pad"
        />

        <View style={styles.actionGrid}>
          {ACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.actionBtn}
              onPress={() => addAction(type)}
              disabled={saving || reportLocked}
            >
              <Text style={styles.actionBtnText}>{LIVE_ACTION_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Timeline</Text>
        {timeline.length === 0 ? (
          <Text style={styles.empty}>Aucune action enregistrée.</Text>
        ) : (
          timeline.map((a) => (
            <View key={a.id} style={styles.timelineRow}>
              <Text style={styles.timelineMin}>{a.minute}&apos;</Text>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineType}>{LIVE_ACTION_LABELS[a.type]}</Text>
                <Text style={styles.timelinePlayer}>{a.player_name}</Text>
              </View>
            </View>
          ))
        )}

        {timeline.length > 0 && !event?.stats_applied_at && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={applyStats}
            disabled={saving || reportLocked}
          >
            <Text style={styles.applyText}>Appliquer aux stats saison</Text>
          </TouchableOpacity>
        )}
        {event?.stats_applied_at ? (
          <Text style={styles.applied}>Stats saison déjà appliquées.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { fontSize: 13, color: c.textSecondary, marginBottom: spacing.md, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', color: c.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  playerScroll: { marginBottom: spacing.sm },
  playerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
  },
  playerChipActive: { backgroundColor: c.ink, borderColor: c.ink },
  playerChipText: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
  playerChipTextActive: { color: c.brandInverse },
  input: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    fontSize: 16,
    color: c.text,
    marginBottom: spacing.md,
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: c.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  actionBtnText: { fontSize: 12, fontWeight: '800', color: c.accent },
  empty: { fontSize: 13, color: c.textMuted },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  timelineMin: { fontSize: 14, fontWeight: '900', color: c.accent, width: 36 },
  timelineBody: { flex: 1 },
  timelineType: { fontSize: 14, fontWeight: '800', color: c.text },
  timelinePlayer: { fontSize: 12, color: c.textMuted },
  applyBtn: {
    marginTop: spacing.xl,
    backgroundColor: c.ink,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  applyText: { color: c.brandInverse, fontWeight: '900' },
  applied: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: c.success,
    fontWeight: '700',
  },
  lockedMsg: {
    fontSize: 12,
    color: c.warning,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  });
}
