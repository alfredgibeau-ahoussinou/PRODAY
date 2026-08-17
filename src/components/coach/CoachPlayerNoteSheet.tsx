import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { CoachText } from './coachPortalUi';
import { CoachPlayerAiPanel } from './CoachPlayerAiPanel';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { TeamEvent } from '../../models/TeamEvent';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { User } from '../../models/User';

type Props = {
  visible: boolean;
  player: User | null;
  profile: User;
  events: TeamEvent[];
  evaluations: CoachPlayerEvaluation[];
  wellness?: WellnessSignals;
  onClose: () => void;
  onSaved: () => void;
};

/** Fiche joueur coach — note libre + analyse IA. */
export function CoachPlayerNoteSheet({
  visible,
  player,
  profile,
  events,
  evaluations,
  wellness,
  onClose,
  onSaved,
}: Props) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const playerEvals = player
    ? evaluations.filter((e) => e.player_uid === player.uid)
    : [];
  const latestNote = playerEvals.find((e) => e.notes?.trim())?.notes ?? '';

  useEffect(() => {
    if (visible && player) setNote(latestNote);
  }, [visible, player?.uid, latestNote]);

  const save = async () => {
    if (!player || !profile.profile.club_id) return;
    const trimmed = note.trim();
    if (!trimmed) {
      Alert.alert('Note vide', 'Écrivez une observation ou annulez.');
      return;
    }
    setSaving(true);
    try {
      await coachEvaluationsService.create(profile.uid, profile.display_name, {
        club_id: profile.profile.club_id,
        player_uid: player.uid,
        player_name: player.display_name,
        context: 'season',
        ratings: { overall: 3 },
        notes: trimmed,
        visible_to_player: false,
      });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (!player) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <CoachText variant="section" style={styles.title}>
            {player.display_name}
          </CoachText>
          <CoachText variant="caption" muted style={styles.sub}>
            Note coach (texte libre) — enrichit l’analyse IA.
          </CoachText>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Points forts, axes de progrès, contexte…"
            placeholderTextColor={COACH_SITE.muted}
            multiline
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <CoachText variant="caption" muted>
                Annuler
              </CoachText>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={() => void save()} disabled={saving}>
              <CoachText variant="caption" inverse style={styles.saveText}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </CoachText>
            </Pressable>
          </View>

          <CoachPlayerAiPanel
            playerUid={player.uid}
            events={events}
            evaluations={evaluations}
            wellness={wellness}
            note={note.trim() || latestNote}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COACH_SITE.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '85%',
    gap: spacing.sm,
  },
  title: { fontWeight: '800' },
  sub: { marginBottom: spacing.xs },
  input: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    backgroundColor: COACH_SITE.elevated,
    color: COACH_SITE.foreground,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    alignItems: 'center',
  },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  saveBtn: {
    backgroundColor: COACH_SITE.accent,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  saveText: { fontWeight: '700', color: '#fff' },
});
