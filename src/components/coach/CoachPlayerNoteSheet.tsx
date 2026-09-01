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
import { radius, spacing } from '../../theme/designTokens';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import type { CoachEvaluationContext, CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { TeamEvent } from '../../models/TeamEvent';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { User } from '../../models/User';
import {
  hasAnyCoachRating,
  normalizeCoachRatings,
  type CoachRatingField,
} from '../../utils/coachEvaluationRatings';
import { coachChrome } from '../../features/coach/theme/coachDesignSystem';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';

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

const NOTE_QUICK_TAGS = [
  { label: '⚡ Intensité', text: 'Bonne intensité et impact physique dans les duels.' },
  { label: '🎯 Justesse technique', text: 'Très bonne qualité technique et prise de décision rapide.' },
  { label: '🧠 Placement tactique', text: 'Respect des consignes de placement et bon coulissement.' },
  { label: '🤝 Leadership', text: 'Excellente attitude, communication positive et leadership.' },
  { label: '📈 Axe de travail', text: 'À travailler : jeu sous pression et orientation du premier contrôle.' },
  { label: '🔋 Gestion de charge', text: 'Signes de fatigue observés, charge à adapter lors des prochaines séances.' },
];

const CHARGE_PRESETS = [
  { label: 'Plein régime', tone: '#10B981', note: '[Charge] Plein régime validé.' },
  { label: 'Charge allégée', tone: '#F59E0B', note: '[Charge] Allègement des intensités préconisé.' },
  { label: 'Repos recommandé', tone: '#EF4444', note: '[Charge] Repos complet recommandé avant la prochaine échéance.' },
  { label: 'Soins / Kiné', tone: '#8B5CF6', note: '[Charge] Soins et protocole de récupération requis.' },
];

/** Fiche joueur coach — notes privées du coach, suivi de charge & analyse IA. */
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
  const [context, setContext] = useState<CoachEvaluationContext>('season');
  const [scores, setScores] = useState<Partial<Record<CoachRatingField, number | undefined>>>({});
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const playerEvals = useMemo(
    () => (player ? evaluations.filter((e) => e.player_uid === player.uid) : []),
    [player, evaluations],
  );
  const latestNote = playerEvals.find((e) => e.notes?.trim())?.notes ?? '';
  const latestEval = playerEvals[0];

  useEffect(() => {
    if (!visible || !player) return;
    setNote(latestNote);
    setScores(latestEval ? normalizeCoachRatings(latestEval.ratings) : {});
    setContext(latestEval?.context ?? 'season');
  }, [visible, player?.uid, latestNote, latestEval]);

  const onScoreChange = (field: CoachRatingField, value: number | undefined) => {
    setScores((prev) => {
      const next = { ...prev };
      if (value == null) delete next[field];
      else next[field] = value;
      return next;
    });
  };

  const appendQuickTag = (text: string) => {
    setNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.includes(text)) return prev;
      return `${trimmed}\n• ${text}`;
    });
  };

  const handleChargePreset = (presetNote: string) => {
    setNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetNote;
      if (trimmed.includes(presetNote)) return prev;
      return `${presetNote}\n${trimmed}`;
    });
  };

  const save = async () => {
    if (!player || !profile.profile.club_id) return;
    const trimmed = note.trim();
    if (!trimmed && !hasAnyCoachRating(scores)) {
      Alert.alert('Note ou score requis', 'Renseignez une observation ou au moins une note /10.');
      return;
    }
    setSaving(true);
    try {
      const ratings = normalizeCoachRatings(scores);
      await coachEvaluationsService.create(profile.uid, profile.display_name, {
        club_id: profile.profile.club_id,
        player_uid: player.uid,
        player_name: player.display_name,
        context,
        ratings: hasAnyCoachRating(ratings) ? ratings : {},
        notes: trimmed,
        visible_to_player: false,
        visible_to_parent: false,
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
            {/* Header Fiche & Confidentialité */}
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <CoachText variant="section" style={styles.title}>
                  {player.display_name}
                </CoachText>
                <View style={styles.privacyBadge}>
                  <Icon name="lock" size={11} color={tokens.accent} />
                  <CoachText variant="caption" style={styles.privacyText}>
                    Note privée coach (confidentielle)
                  </CoachText>
                </View>
              </View>
              <Pressable style={styles.closeIconBtn} onPress={onClose}>
                <Icon name="close" size={20} color={tokens.muted} />
              </Pressable>
            </View>

            {/* Suivi de Charge & Disponibilité */}
            {wellness ? (
              <View style={styles.loadTrackingCard}>
                <View style={styles.loadTrackingHeader}>
                  <Icon name="shield" size={15} color={tokens.accent} />
                  <CoachText variant="caption" style={styles.loadTrackingTitle}>
                    Suivi de Charge & Disponibilité
                  </CoachText>
                </View>
                <View style={styles.loadMetricsGrid}>
                  <View style={styles.loadMetricItem}>
                    <CoachText variant="caption" muted style={styles.metricLabel}>
                      Fatigue
                    </CoachText>
                    <CoachText
                      variant="caption"
                      style={[
                        styles.metricValue,
                        { color: (wellness.fatigue ?? 0) >= 7 ? '#EF4444' : tokens.foreground },
                      ]}
                    >
                      {wellness.fatigue != null ? `${wellness.fatigue}/10` : '—'}
                    </CoachText>
                  </View>

                  <View style={styles.loadMetricItem}>
                    <CoachText variant="caption" muted style={styles.metricLabel}>
                      Récupération
                    </CoachText>
                    <CoachText
                      variant="caption"
                      style={[
                        styles.metricValue,
                        { color: (wellness.recovery ?? 10) <= 4 ? '#F59E0B' : tokens.foreground },
                      ]}
                    >
                      {wellness.recovery != null ? `${wellness.recovery}/10` : '—'}
                    </CoachText>
                  </View>

                  <View style={styles.loadMetricItem}>
                    <CoachText variant="caption" muted style={styles.metricLabel}>
                      Sommeil
                    </CoachText>
                    <CoachText variant="caption" style={styles.metricValue}>
                      {wellness.sleep_hours != null ? `${wellness.sleep_hours}h` : '—'}
                    </CoachText>
                  </View>

                  <View style={styles.loadMetricItem}>
                    <CoachText variant="caption" muted style={styles.metricLabel}>
                      Douleur
                    </CoachText>
                    <CoachText
                      variant="caption"
                      style={[
                        styles.metricValue,
                        { color: (wellness.pain ?? 0) >= 5 ? '#EF4444' : tokens.foreground },
                      ]}
                    >
                      {wellness.pain != null ? `${wellness.pain}/10` : '0/10'}
                    </CoachText>
                  </View>
                </View>

                {/* Préconisations rapides de charge */}
                <View style={styles.chargePresetsRow}>
                  {CHARGE_PRESETS.map((p) => (
                    <PressableSpring
                      key={p.label}
                      onPress={() => handleChargePreset(p.note)}
                      scaleTo={0.96}
                      haptic
                      style={[styles.chargePresetBtn, { borderColor: p.tone }]}
                    >
                      <CoachText variant="caption" style={[styles.chargePresetText, { color: p.tone }]}>
                        {p.label}
                      </CoachText>
                    </PressableSpring>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Sélecteur de contexte d'évaluation */}
            <View style={styles.contextRow}>
              <CoachText variant="caption" muted style={styles.contextLabel}>
                Contexte :
              </CoachText>
              {(
                [
                  { id: 'season' as const, label: 'Saison globale' },
                  { id: 'training' as const, label: 'Entraînement' },
                  { id: 'match' as const, label: 'Match' },
                ] as const
              ).map((c) => {
                const on = context === c.id;
                return (
                  <PressableSpring
                    key={c.id}
                    onPress={() => setContext(c.id)}
                    scaleTo={0.96}
                    haptic
                    style={[styles.contextBtn, on && styles.contextBtnOn]}
                  >
                    <CoachText
                      variant="caption"
                      style={[styles.contextBtnText, on && styles.contextBtnTextOn]}
                    >
                      {c.label}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </View>

            {/* Saisie de la note libre */}
            <CoachText variant="caption" muted style={styles.sub}>
              Observation & axes de progression du coach (texte libre) :
            </CoachText>

            {/* Suggestions rapides en 1 clic */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickTagsRow}
            >
              {NOTE_QUICK_TAGS.map((tag) => (
                <Pressable
                  key={tag.label}
                  style={styles.quickTagChip}
                  onPress={() => appendQuickTag(tag.text)}
                >
                  <CoachText variant="caption" style={styles.quickTagText}>
                    + {tag.label}
                  </CoachText>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Saisissez vos observations détaillées sur ce joueur..."
              placeholderTextColor={tokens.muted}
              multiline
              style={styles.input}
            />

            {/* Scores optionnels /10 */}
            <CoachOptionalScoresBlock values={scores} onChange={onScoreChange} />

            {/* Boutons d'action */}
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <CoachText variant="caption" muted>
                  Annuler
                </CoachText>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={() => void save()} disabled={saving}>
                <CoachText variant="caption" inverse style={styles.saveText}>
                  {saving ? 'Enregistrement…' : 'Enregistrer la note'}
                </CoachText>
              </Pressable>
            </View>

            {/* Historique des observations précédentes */}
            {playerEvals.length > 0 ? (
              <View style={styles.historySection}>
                <Pressable
                  style={styles.historyToggle}
                  onPress={() => setShowHistory((prev) => !prev)}
                >
                  <CoachText variant="caption" style={styles.historyToggleText}>
                    Historique des notes ({playerEvals.length}) {showHistory ? '▲' : '▼'}
                  </CoachText>
                </Pressable>
                {showHistory ? (
                  <View style={styles.historyList}>
                    {playerEvals.map((ev) => (
                      <View key={ev.id} style={styles.historyItem}>
                        <View style={styles.historyMeta}>
                          <CoachText variant="caption" style={styles.historyDate}>
                            {new Date(ev.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </CoachText>
                          <CoachText variant="caption" muted>
                            {ev.context}
                          </CoachText>
                        </View>
                        {ev.notes ? (
                          <CoachText variant="caption" style={styles.historyBody}>
                            « {ev.notes} »
                          </CoachText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Analyse IA et croisement des données */}
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
      maxHeight: sheetMode ? '90%' : '84%',
      width: '100%',
      maxWidth: sheetMode ? undefined : 540,
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    headerInfo: { flex: 1, gap: 4 },
    title: { fontWeight: '800', color: tokens.foreground, fontSize: 18 },
    privacyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    privacyText: { fontSize: 11, fontWeight: '700', color: tokens.accent },
    closeIconBtn: { padding: 4 },
    loadTrackingCard: {
      backgroundColor: tokens.elevated,
      borderRadius: 12,
      padding: spacing.sm,
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    loadTrackingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    loadTrackingTitle: {
      fontWeight: '800',
      color: tokens.foreground,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    loadMetricsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    loadMetricItem: {
      alignItems: 'center',
      gap: 2,
      flex: 1,
    },
    metricLabel: { fontSize: 11 },
    metricValue: { fontWeight: '800', fontSize: 14 },
    chargePresetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: 4,
    },
    chargePresetBtn: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: tokens.surface,
    },
    chargePresetText: { fontSize: 11, fontWeight: '700' },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginVertical: 4,
    },
    contextLabel: { fontSize: 12, fontWeight: '600' },
    contextBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    contextBtnOn: {
      backgroundColor: tokens.soft,
      borderColor: tokens.accent,
    },
    contextBtnText: { fontSize: 11, fontWeight: '600', color: tokens.muted },
    contextBtnTextOn: { color: tokens.accent, fontWeight: '700' },
    sub: { marginBottom: 4, fontSize: 12 },
    quickTagsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 4,
      marginBottom: 4,
    },
    quickTagChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    quickTagText: { fontSize: 11, fontWeight: '600', color: tokens.foreground },
    input: {
      minHeight: 96,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      color: tokens.foreground,
      padding: spacing.md,
      textAlignVertical: 'top',
      fontSize: 14,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    saveBtn: {
      backgroundColor: tokens.accent,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    saveText: { fontWeight: '700', color: tokens.onAccent },
    historySection: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingTop: spacing.xs,
    },
    historyToggle: {
      paddingVertical: 6,
    },
    historyToggleText: {
      fontWeight: '700',
      color: tokens.accent,
      fontSize: 12,
    },
    historyList: {
      gap: spacing.xs,
      marginTop: 4,
    },
    historyItem: {
      backgroundColor: tokens.elevated,
      borderRadius: 8,
      padding: spacing.sm,
      gap: 2,
    },
    historyMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    historyDate: { fontWeight: '700', fontSize: 11 },
    historyBody: { fontStyle: 'italic', fontSize: 12, lineHeight: 16 },
  });
}
