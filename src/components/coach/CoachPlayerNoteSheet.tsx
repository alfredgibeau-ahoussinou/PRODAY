import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CoachText } from './coachPortalUi';
import { CoachPlayerAiPanel } from './CoachPlayerAiPanel';
import { CoachOptionalScoresBlock } from './CoachOptionalScoreInput';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { TeamEvent } from '../../models/TeamEvent';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { User } from '../../models/User';
import {
  hasAnyCoachRating,
  normalizeCoachRatings,
  type CoachRatingField,
} from '../../utils/coachEvaluationRatings';
import { coachChrome } from '../../features/coach/theme/coachDesignSystem';

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

/** Fiche joueur coach — note libre + scores optionnels + analyse IA. */
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
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const sheetMode = coachChrome.modalIsSheet(width);
  const styles = useMemo(() => createStyles(tokens, sheetMode), [tokens, sheetMode]);
  const [note, setNote] = useState('');
  const [scores, setScores] = useState<Partial<Record<CoachRatingField, number | undefined>>>({});
  const [saving, setSaving] = useState(false);

  const playerEvals = player
    ? evaluations.filter((e) => e.player_uid === player.uid)
    : [];
  const latestNote = playerEvals.find((e) => e.notes?.trim())?.notes ?? '';
  const latestEval = playerEvals[0];

  useEffect(() => {
    if (!visible || !player) return;
    setNote(latestNote);
    setScores(latestEval ? normalizeCoachRatings(latestEval.ratings) : {});
  }, [visible, player?.uid, latestNote, latestEval?.id]);

  const onScoreChange = (field: CoachRatingField, value: number | undefined) => {
    setScores((prev) => {
      const next = { ...prev };
      if (value == null) delete next[field];
      else next[field] = value;
      return next;
    });
  };

  const save = async () => {
    if (!player || !profile.profile.club_id) return;
    const trimmed = note.trim();
    if (!trimmed) {
      Alert.alert('Note vide', 'Écrivez une observation ou annulez.');
      return;
    }
    setSaving(true);
    try {
      const ratings = normalizeCoachRatings(scores);
      await coachEvaluationsService.create(profile.uid, profile.display_name, {
        club_id: profile.profile.club_id,
        player_uid: player.uid,
        player_name: player.display_name,
        context: 'season',
        ratings: hasAnyCoachRating(ratings) ? ratings : {},
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
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              placeholderTextColor={tokens.muted}
              multiline
              style={styles.input}
            />

            <CoachOptionalScoresBlock values={scores} onChange={onScoreChange} />

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
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(tokens: CoachThemeTokens, sheetMode: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: sheetMode ? 'flex-end' : 'center',
      alignItems: sheetMode ? undefined : 'center',
      paddingHorizontal: sheetMode ? 0 : spacing.xl,
    },
    sheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: sheetMode ? 20 : 16,
      borderTopRightRadius: sheetMode ? 20 : 16,
      borderBottomLeftRadius: sheetMode ? 0 : 16,
      borderBottomRightRadius: sheetMode ? 0 : 16,
      padding: spacing.lg,
      maxHeight: sheetMode ? '88%' : '80%',
      width: '100%',
      maxWidth: sheetMode ? undefined : 520,
      gap: spacing.sm,
    },
    title: { fontWeight: '800', color: tokens.foreground },
    sub: { marginBottom: spacing.xs },
    input: {
      minHeight: 88,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      color: tokens.foreground,
      padding: spacing.md,
      textAlignVertical: 'top',
      fontSize: 15,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    saveBtn: {
      backgroundColor: tokens.accent,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    saveText: { fontWeight: '700', color: tokens.onAccent },
  });
}
