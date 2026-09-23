import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  EvaluationSource,
  EvaluationStatus,
  PlayerMatchSheetStat,
  PlayerStatClip,
} from '../../models/TeamEvent';
import {
  clampCoachRating,
  COACH_RATING_FIELDS,
  formatCoachRating,
  formatEvaluationSourceLabel,
  formatEvaluationStatusLabel,
  type CoachRatingField,
} from '../../utils/coachEvaluationRatings';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { withAlpha } from '../../utils/coachTeamTheme';
import { CoachText } from './coachPortalUi';
import { PressableSpring } from '../motion';
import { proSemantic, PRO_DATA_VIOLET } from '../../theme/professionalDesign';
import { spacing } from '../../theme/designTokens';

export type PlayerStatsRatingModalMode = 'stats' | 'rating';

export interface PlayerStatsRatingModalProps {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  playerName: string;
  matchTitle?: string;
  matchDateLabel?: string;
  initialStat?: PlayerMatchSheetStat;
  initialMode?: PlayerStatsRatingModalMode;
  onSave: (patch: Partial<PlayerMatchSheetStat>) => Promise<void>;
}

export const PlayerStatsRatingModal: React.FC<PlayerStatsRatingModalProps> = ({
  visible,
  onClose,
  playerUid,
  playerName,
  matchTitle,
  matchDateLabel,
  initialStat,
  initialMode = 'stats',
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  const [activeTab, setActiveTab] = useState<PlayerStatsRatingModalMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Stats form state (distinguishing 0 from undefined/unrecorded)
  const [minutesPlayed, setMinutesPlayed] = useState<number | undefined>(
    initialStat?.minutes_played,
  );
  const [goals, setGoals] = useState<number>(initialStat?.goals ?? 0);
  const [assists, setAssists] = useState<number>(initialStat?.assists ?? 0);
  const [yellowCards, setYellowCards] = useState<number>(initialStat?.yellow_cards ?? 0);
  const [redCards, setRedCards] = useState<number>(initialStat?.red_cards ?? 0);
  const [cleanSheet, setCleanSheet] = useState<boolean>(initialStat?.clean_sheet ?? false);

  // Ratings form state
  const [overallRating, setOverallRating] = useState<number | undefined>(initialStat?.rating);
  const [ratingExplanation, setRatingExplanation] = useState<string>(
    initialStat?.rating_explanation ?? '',
  );
  const [dimensions, setDimensions] = useState<Partial<Record<CoachRatingField, number | undefined>>>({
    overall: initialStat?.rating,
  });

  // Provenance & publication status
  const currentSource: EvaluationSource = initialStat?.source ?? 'manual';
  const [status, setStatus] = useState<EvaluationStatus>(initialStat?.status ?? 'published');

  // Synchronize state when opening modal or when player/initial values change
  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode);
      setMinutesPlayed(initialStat?.minutes_played);
      setGoals(initialStat?.goals ?? 0);
      setAssists(initialStat?.assists ?? 0);
      setYellowCards(initialStat?.yellow_cards ?? 0);
      setRedCards(initialStat?.red_cards ?? 0);
      setCleanSheet(initialStat?.clean_sheet ?? false);
      setOverallRating(initialStat?.rating);
      setRatingExplanation(initialStat?.rating_explanation ?? '');
      setDimensions({
        overall: initialStat?.rating,
      });
      setStatus(initialStat?.status ?? 'published');
      setShowHistory(false);
    }
  }, [visible, playerUid, initialStat, initialMode]);

  // AI proposal metadata
  const isAiGenerated = currentSource === 'ai_generated';
  const aiConfidence = initialStat?.ai_confidence;
  const aiUncertainty = initialStat?.ai_uncertainty_reason;
  const aiClips = initialStat?.ai_clips ?? [];

  const handleStepStat = (
    getter: number | undefined,
    setter: (val: number | undefined) => void,
    delta: number,
    min = 0,
    allowUndefined = false,
  ) => {
    if (getter === undefined) {
      setter(delta > 0 ? delta : min);
      return;
    }
    const next = getter + delta;
    if (next < min) {
      if (allowUndefined) setter(undefined);
      else setter(min);
    } else {
      setter(next);
    }
  };

  const handleStepRating = (delta: number) => {
    if (overallRating === undefined) {
      setOverallRating(delta > 0 ? 6.0 : 5.0);
      return;
    }
    const next = clampCoachRating(overallRating + delta);
    setOverallRating(next);
  };

  const handleClearRating = () => {
    setOverallRating(undefined);
  };

  const handleApproveAi = () => {
    // Valide les propositions de l'IA et bascule en 'coach_reviewed'
    void handleSave('coach_reviewed');
  };

  const handleSave = async (forceSource?: EvaluationSource) => {
    setSaving(true);
    try {
      const nextSource: EvaluationSource =
        forceSource ?? (currentSource === 'ai_generated' ? 'coach_reviewed' : currentSource);

      const patch: Partial<PlayerMatchSheetStat> = {
        player_name: playerName,
        minutes_played: minutesPlayed,
        rating: overallRating,
        rating_explanation: ratingExplanation.trim() || undefined,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        clean_sheet: cleanSheet,
        source: nextSource,
        status,
      };

      await onSave(patch);
      onClose();
    } catch (err) {
      console.error('[PlayerStatsRatingModal] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const sourceBadgeColor = useMemo(() => {
    if (currentSource === 'ai_generated') return PRO_DATA_VIOLET;
    if (currentSource === 'coach_reviewed') return proSemantic.success;
    return tokens.accent;
  }, [currentSource, tokens.accent]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {/* Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <CoachText variant="caption" muted style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {matchTitle ? `${matchTitle} · ` : ''}{matchDateLabel ?? 'Feuille de match'}
              </CoachText>
              <CoachText variant="title" numberOfLines={1} style={styles.playerNameTitle}>
                {playerName}
              </CoachText>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color={tokens.foreground} />
            </Pressable>
          </View>

          {/* Status & Provenance Bar */}
          <View style={styles.metaBadgeRow}>
            <View style={[styles.sourceBadge, { backgroundColor: withAlpha(sourceBadgeColor, 0.15), borderColor: sourceBadgeColor }]}>
              <MaterialCommunityIcons
                name={currentSource === 'ai_generated' ? 'robot-outline' : currentSource === 'coach_reviewed' ? 'check-decagram' : 'pencil'}
                size={13}
                color={sourceBadgeColor}
              />
              <CoachText variant="caption" style={[styles.sourceBadgeText, { color: sourceBadgeColor }]}>
                {formatEvaluationSourceLabel(currentSource)}
              </CoachText>
            </View>

            <View style={[styles.statusBadge, { borderColor: status === 'published' ? proSemantic.success : tokens.border }]}>
              <View style={[styles.statusDot, { backgroundColor: status === 'published' ? proSemantic.success : tokens.muted }]} />
              <CoachText variant="caption" muted style={{ fontSize: 11, fontWeight: '700' }}>
                {formatEvaluationStatusLabel(status)}
              </CoachText>
            </View>
          </View>

          {/* AI Notice Banner (if generated from Veo video) */}
          {isAiGenerated ? (
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerTop}>
                <Ionicons name="sparkles" size={15} color={PRO_DATA_VIOLET} />
                <CoachText variant="caption" style={styles.aiBannerTitle}>
                  Proposition IA générée depuis la captation Veo
                </CoachText>
                {aiConfidence ? (
                  <CoachText variant="caption" style={styles.aiConfidence}>
                    Confiance {Math.round(aiConfidence * 100)}%
                  </CoachText>
                ) : null}
              </View>

              {aiUncertainty ? (
                <View style={styles.aiUncertaintyBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={proSemantic.warning} />
                  <CoachText variant="caption" style={styles.aiUncertaintyText}>
                    {aiUncertainty}
                  </CoachText>
                </View>
              ) : null}

              {aiClips.length > 0 ? (
                <View style={styles.aiClipsWrap}>
                  <CoachText variant="caption" muted style={{ fontSize: 11, fontWeight: '700' }}>
                    Actions clés horodatées sur la vidéo :
                  </CoachText>
                  {aiClips.map((clip, idx) => (
                    <View key={idx} style={styles.clipRow}>
                      <Ionicons name="videocam-outline" size={12} color={PRO_DATA_VIOLET} />
                      <CoachText variant="caption" style={styles.clipText}>
                        {Math.floor(clip.timestamp_sec / 60)}' — {clip.label}
                        {clip.description ? ` (${clip.description})` : ''}
                      </CoachText>
                    </View>
                  ))}
                </View>
              ) : null}

              <PressableSpring
                onPress={handleApproveAi}
                style={styles.approveAiBtn}
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-done" size={14} color="#FFF" />
                <CoachText variant="caption" style={styles.approveAiText}>
                  Valider la proposition de l'IA (Validé par coach)
                </CoachText>
              </PressableSpring>
            </View>
          ) : null}

          {/* Mode Switcher Tabs */}
          <View style={styles.tabSelector}>
            <Pressable
              onPress={() => setActiveTab('stats')}
              style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]}
              accessibilityRole="tab"
            >
              <Ionicons
                name="stats-chart"
                size={14}
                color={activeTab === 'stats' ? tokens.onAccent : tokens.muted}
              />
              <CoachText
                variant="caption"
                style={[styles.tabBtnLabel, activeTab === 'stats' && styles.tabBtnLabelActive]}
              >
                Modifier les statistiques
              </CoachText>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('rating')}
              style={[styles.tabBtn, activeTab === 'rating' && styles.tabBtnActive]}
              accessibilityRole="tab"
            >
              <Ionicons
                name="star"
                size={14}
                color={activeTab === 'rating' ? tokens.onAccent : tokens.muted}
              />
              <CoachText
                variant="caption"
                style={[styles.tabBtnLabel, activeTab === 'rating' && styles.tabBtnLabelActive]}
              >
                Ajouter ou modifier la note
              </CoachText>
            </Pressable>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'stats' ? (
              <View style={styles.formSection}>
                {/* Temps de jeu */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>
                      Temps de jeu (minutes)
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {minutesPlayed === undefined ? 'Non renseigné' : `${minutesPlayed} minutes (0 = non entré)`}
                    </CoachText>
                  </View>
                  <View style={styles.stepperWrap}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(minutesPlayed, setMinutesPlayed, -5, 0, true)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>−</CoachText>
                    </Pressable>
                    <CoachText variant="body" style={styles.stepValTxt}>
                      {minutesPlayed !== undefined ? `${minutesPlayed}'` : '—'}
                    </CoachText>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(minutesPlayed, setMinutesPlayed, 5, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>+</CoachText>
                    </Pressable>
                    {minutesPlayed !== undefined ? (
                      <Pressable
                        style={styles.clearBtn}
                        onPress={() => setMinutesPlayed(undefined)}
                        accessibilityLabel="Effacer temps de jeu"
                      >
                        <Ionicons name="close-circle" size={16} color={tokens.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {/* Buts */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>Buts inscrits</CoachText>
                    <CoachText variant="caption" muted>Nombre de réalisations</CoachText>
                  </View>
                  <View style={styles.stepperWrap}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(goals, (v) => setGoals(v ?? 0), -1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>−</CoachText>
                    </Pressable>
                    <CoachText variant="body" style={styles.stepValTxt}>{goals}</CoachText>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(goals, (v) => setGoals(v ?? 0), 1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>+</CoachText>
                    </Pressable>
                  </View>
                </View>

                {/* Passes décisives */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>Passes décisives</CoachText>
                    <CoachText variant="caption" muted>Dernière passe avant but</CoachText>
                  </View>
                  <View style={styles.stepperWrap}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(assists, (v) => setAssists(v ?? 0), -1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>−</CoachText>
                    </Pressable>
                    <CoachText variant="body" style={styles.stepValTxt}>{assists}</CoachText>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(assists, (v) => setAssists(v ?? 0), 1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>+</CoachText>
                    </Pressable>
                  </View>
                </View>

                {/* Cartons jaunes */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>Cartons jaunes</CoachText>
                    <CoachText variant="caption" muted>Avertissements reçus</CoachText>
                  </View>
                  <View style={styles.stepperWrap}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(yellowCards, (v) => setYellowCards(v ?? 0), -1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>−</CoachText>
                    </Pressable>
                    <CoachText variant="body" style={styles.stepValTxt}>{yellowCards}</CoachText>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(yellowCards, (v) => setYellowCards(v ?? 0), 1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>+</CoachText>
                    </Pressable>
                  </View>
                </View>

                {/* Cartons rouges */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>Cartons rouges</CoachText>
                    <CoachText variant="caption" muted>Exclusions directes ou 2e jaune</CoachText>
                  </View>
                  <View style={styles.stepperWrap}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(redCards, (v) => setRedCards(v ?? 0), -1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>−</CoachText>
                    </Pressable>
                    <CoachText variant="body" style={styles.stepValTxt}>{redCards}</CoachText>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => handleStepStat(redCards, (v) => setRedCards(v ?? 0), 1, 0)}
                    >
                      <CoachText variant="body" style={styles.stepBtnTxt}>+</CoachText>
                    </Pressable>
                  </View>
                </View>

                {/* Clean Sheet */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <CoachText variant="body" style={styles.fieldTitle}>Clean sheet</CoachText>
                    <CoachText variant="caption" muted>Aucun but encaissé (gardien / défenseurs)</CoachText>
                  </View>
                  <Switch
                    value={cleanSheet}
                    onValueChange={setCleanSheet}
                    trackColor={{ false: tokens.surface, true: tokens.accent }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.formSection}>
                {/* Note globale /10 */}
                <View style={styles.ratingHeroBox}>
                  <CoachText variant="caption" muted style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Évaluation globale du match (/10)
                  </CoachText>
                  <View style={styles.ratingBigRow}>
                    <CoachText variant="title" style={styles.ratingBigVal}>
                      {formatCoachRating(overallRating)}
                    </CoachText>
                    {overallRating !== undefined ? (
                      <Pressable onPress={handleClearRating} style={styles.clearRatingBtn}>
                        <CoachText variant="caption" muted>Effacer la note</CoachText>
                      </Pressable>
                    ) : null}
                  </View>
                  <CoachText variant="caption" muted>
                    {overallRating === 0
                      ? 'Note 0.0/10 attribuée (performance sanctionnée).'
                      : overallRating === undefined
                        ? 'Joueur non noté sur cette rencontre.'
                        : 'Échelle officielle ProDay 0 à 10.'}
                  </CoachText>

                  <View style={styles.ratingControlsRow}>
                    <Pressable
                      style={styles.ratingStepBtn}
                      onPress={() => handleStepRating(-0.5)}
                      accessibilityLabel="Diminuer la note de 0.5"
                    >
                      <CoachText variant="body" style={styles.ratingStepTxt}>− 0.5</CoachText>
                    </Pressable>
                    <Pressable
                      style={[styles.ratingStepBtn, { backgroundColor: tokens.accent }]}
                      onPress={() => handleStepRating(0.5)}
                      accessibilityLabel="Augmenter la note de 0.5"
                    >
                      <CoachText variant="body" style={[styles.ratingStepTxt, { color: tokens.onAccent }]}>
                        + 0.5
                      </CoachText>
                    </Pressable>
                  </View>
                </View>

                {/* Explication / observations du coach */}
                <View style={styles.explanationBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={tokens.accent} />
                    <CoachText variant="caption" style={{ fontWeight: '700' }}>
                      Explication / observation du coach
                    </CoachText>
                  </View>
                  <TextInput
                    value={ratingExplanation}
                    onChangeText={setRatingExplanation}
                    placeholder="Justification de la note, points forts, axes d'amélioration..."
                    placeholderTextColor={tokens.muted}
                    multiline
                    numberOfLines={3}
                    style={[
                      styles.explanationInput,
                      { color: tokens.foreground, borderColor: tokens.border, backgroundColor: tokens.surface },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Publication Status Selector */}
            <View style={styles.statusSection}>
              <CoachText variant="caption" muted style={styles.statusSectionLabel}>
                Visibilité & Statut de publication
              </CoachText>
              <View style={styles.statusOptionRow}>
                <Pressable
                  style={[styles.statusOptionBtn, status === 'draft' && styles.statusOptionBtnOn]}
                  onPress={() => setStatus('draft')}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={13}
                    color={status === 'draft' ? tokens.accent : tokens.muted}
                  />
                  <CoachText
                    variant="caption"
                    style={[styles.statusOptionTxt, status === 'draft' && styles.statusOptionTxtOn]}
                  >
                    Brouillon staff (privé)
                  </CoachText>
                </Pressable>

                <Pressable
                  style={[styles.statusOptionBtn, status === 'published' && styles.statusOptionBtnOn]}
                  onPress={() => setStatus('published')}
                >
                  <Ionicons
                    name="eye-outline"
                    size={13}
                    color={status === 'published' ? proSemantic.success : tokens.muted}
                  />
                  <CoachText
                    variant="caption"
                    style={[styles.statusOptionTxt, status === 'published' && { color: proSemantic.success, fontWeight: '700' }]}
                  >
                    Publié (joueur & club)
                  </CoachText>
                </Pressable>
              </View>
            </View>

            {/* Audit History Log */}
            {initialStat?.history && initialStat.history.length > 0 ? (
              <View style={styles.historySection}>
                <Pressable
                  style={styles.historyToggle}
                  onPress={() => setShowHistory((prev) => !prev)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={14} color={tokens.muted} />
                    <CoachText variant="caption" muted style={{ fontWeight: '700' }}>
                      Historique des modifications ({initialStat.history.length})
                    </CoachText>
                  </View>
                  <Ionicons
                    name={showHistory ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={tokens.muted}
                  />
                </Pressable>

                {showHistory ? (
                  <View style={styles.historyList}>
                    {initialStat.history.map((entry, idx) => (
                      <View key={idx} style={styles.historyRow}>
                        <View style={styles.historyRowTop}>
                          <CoachText variant="caption" style={{ fontWeight: '700', fontSize: 11 }}>
                            {entry.author_name} · {entry.action}
                          </CoachText>
                          <CoachText variant="caption" muted style={{ fontSize: 10 }}>
                            {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </CoachText>
                        </View>
                        <CoachText variant="caption" muted style={{ fontSize: 11 }}>
                          {entry.summary}
                        </CoachText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Save Actions */}
          <View style={styles.footer}>
            <PressableSpring
              style={styles.cancelBtn}
              onPress={onClose}
              scaleTo={0.97}
              disabled={saving}
            >
              <CoachText variant="caption" muted style={{ fontWeight: '700' }}>
                Annuler
              </CoachText>
            </PressableSpring>

            <PressableSpring
              style={[styles.saveBtn, { backgroundColor: tokens.accent }]}
              onPress={() => handleSave()}
              scaleTo={0.97}
              disabled={saving}
            >
              <CoachText variant="caption" style={[styles.saveBtnText, { color: tokens.onAccent }]}>
                {saving ? 'Enregistrement...' : 'Enregistrer la fiche'}
              </CoachText>
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: withAlpha(tokens.bg, 0.75),
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
      backgroundColor: tokens.elevated,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
      maxHeight: '90%',
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    playerNameTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: tokens.foreground,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: tokens.surface,
    },
    metaBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    sourceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    sourceBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      backgroundColor: tokens.surface,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    aiBanner: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      padding: spacing.md,
      borderRadius: 10,
      backgroundColor: withAlpha(PRO_DATA_VIOLET, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(PRO_DATA_VIOLET, 0.3),
      gap: spacing.xs,
    },
    aiBannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiBannerTitle: {
      flex: 1,
      color: PRO_DATA_VIOLET,
      fontWeight: '700',
      fontSize: 12,
    },
    aiConfidence: {
      color: PRO_DATA_VIOLET,
      fontSize: 11,
      fontWeight: '800',
    },
    aiUncertaintyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      padding: 6,
      borderRadius: 6,
      backgroundColor: withAlpha(proSemantic.warning, 0.12),
    },
    aiUncertaintyText: {
      flex: 1,
      color: proSemantic.warning,
      fontSize: 11,
    },
    aiClipsWrap: {
      marginTop: 4,
      gap: 3,
    },
    clipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    clipText: {
      fontSize: 11,
      color: tokens.foreground,
    },
    approveAiBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: PRO_DATA_VIOLET,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 6,
    },
    approveAiText: {
      color: tokens.onAccent || tokens.foreground,
      fontWeight: '700',
      fontSize: 12,
    },
    tabSelector: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      backgroundColor: tokens.surface,
      borderRadius: 10,
      padding: 3,
      gap: 4,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
    },
    tabBtnActive: {
      backgroundColor: tokens.accent,
    },
    tabBtnLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.muted,
    },
    tabBtnLabelActive: {
      color: tokens.onAccent,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    formSection: {
      gap: spacing.sm,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: tokens.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    fieldInfo: {
      flex: 1,
    },
    fieldTitle: {
      fontWeight: '700',
      fontSize: 14,
    },
    stepperWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnTxt: {
      fontSize: 18,
      fontWeight: '700',
    },
    stepValTxt: {
      minWidth: 28,
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 15,
    },
    clearBtn: {
      padding: 4,
    },
    ratingHeroBox: {
      alignItems: 'center',
      backgroundColor: tokens.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 6,
    },
    ratingBigRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    ratingBigVal: {
      fontSize: 34,
      fontWeight: '900',
      color: tokens.accent,
    },
    clearRatingBtn: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      backgroundColor: tokens.elevated,
    },
    ratingControlsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    ratingStepBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    ratingStepTxt: {
      fontWeight: '700',
      fontSize: 13,
    },
    explanationBox: {
      marginTop: spacing.sm,
      backgroundColor: tokens.surface,
      borderRadius: 10,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    explanationInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: spacing.sm,
      fontSize: 13,
      minHeight: 70,
      textAlignVertical: 'top',
    },
    statusSection: {
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    statusSectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    statusOptionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statusOptionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    statusOptionBtnOn: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.1),
    },
    statusOptionTxt: {
      fontSize: 12,
      color: tokens.muted,
      fontWeight: '600',
    },
    statusOptionTxtOn: {
      color: tokens.accent,
      fontWeight: '700',
    },
    historySection: {
      marginTop: spacing.md,
      backgroundColor: tokens.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    historyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.sm,
    },
    historyList: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      gap: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    historyRow: {
      paddingVertical: 4,
      gap: 2,
    },
    historyRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surface,
    },
    saveBtn: {
      flex: 2,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontWeight: '800',
      fontSize: 14,
    },
  });
}
