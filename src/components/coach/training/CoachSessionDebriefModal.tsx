import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { coachChrome } from '../../../features/coach/theme/coachDesignSystem';
import { CoachText } from '../CoachText';
import { PressableSpring } from '../../motion';
import { radius, spacing } from '../../../theme/designTokens';
import { withAlpha } from '../../../utils/coachTeamTheme';
import {
  coachSessionDebriefService,
  getBorgRpeInfo,
  INTENSITY_OPTIONS,
  DEBRIEF_TAKEAWAY_PRESETS,
  type CoachSessionDebrief,
  type IntensityRealVsPlanned,
} from '../../../services/coachSessionDebrief.service';

export interface CoachSessionDebriefModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  sessionTitle?: string;
  coachUid: string;
  players?: Array<{ uid: string; name: string }>;
  initialDebrief?: CoachSessionDebrief | null;
  onDebriefSaved?: (debrief: CoachSessionDebrief) => void;
}

export const CoachSessionDebriefModal: React.FC<CoachSessionDebriefModalProps> = ({
  visible,
  onClose,
  eventId,
  sessionTitle,
  coachUid,
  players = [],
  initialDebrief,
  onDebriefSaved,
}) => {
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const sheetMode = coachChrome.modalIsSheet(width);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [existingDebriefId, setExistingDebriefId] = useState<string | undefined>(
    initialDebrief?.id
  );
  const [rpeScore, setRpeScore] = useState<number>(initialDebrief?.rpeScore ?? 6);
  const [intensity, setIntensity] = useState<IntensityRealVsPlanned>(
    initialDebrief?.intensityRealVsPlanned ?? 'as_expected'
  );
  const [groupEngagement, setGroupEngagement] = useState<number>(
    initialDebrief?.groupEngagement ?? 4
  );
  const [fatiguedPlayerUids, setFatiguedPlayerUids] = useState<string[]>(
    initialDebrief?.fatiguedPlayerUids ?? []
  );
  const [keyTakeaways, setKeyTakeaways] = useState<string>(
    initialDebrief?.keyTakeaways ?? ''
  );
  const [saving, setSaving] = useState(false);

  // Chargement ou synchronisation du débrief existant
  useEffect(() => {
    if (!visible) return;

    if (initialDebrief) {
      setExistingDebriefId(initialDebrief.id);
      setRpeScore(initialDebrief.rpeScore);
      setIntensity(initialDebrief.intensityRealVsPlanned);
      setGroupEngagement(initialDebrief.groupEngagement);
      setFatiguedPlayerUids(initialDebrief.fatiguedPlayerUids || []);
      setKeyTakeaways(initialDebrief.keyTakeaways || '');
      setLoadingInitial(false);
      return;
    }

    let isMounted = true;
    setLoadingInitial(true);
    coachSessionDebriefService
      .getDebriefForEvent(eventId)
      .then((debrief) => {
        if (!isMounted) return;
        if (debrief) {
          setExistingDebriefId(debrief.id);
          setRpeScore(debrief.rpeScore);
          setIntensity(debrief.intensityRealVsPlanned);
          setGroupEngagement(debrief.groupEngagement);
          setFatiguedPlayerUids(debrief.fatiguedPlayerUids || []);
          setKeyTakeaways(debrief.keyTakeaways || '');
        } else {
          setExistingDebriefId(undefined);
          setRpeScore(6);
          setIntensity('as_expected');
          setGroupEngagement(4);
          setFatiguedPlayerUids([]);
          setKeyTakeaways('');
        }
      })
      .catch((err) => {
        console.warn('[CoachSessionDebriefModal] Erreur chargement débrief:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, eventId, initialDebrief]);

  const toggleFatiguedPlayer = useCallback((uid: string) => {
    setFatiguedPlayerUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }, []);

  const handleAppendPreset = useCallback((preset: string) => {
    setKeyTakeaways((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return preset;
      return `${trimmed}. ${preset}`;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await coachSessionDebriefService.saveDebrief({
        id: existingDebriefId,
        eventId,
        coachUid,
        rpeScore,
        intensityRealVsPlanned: intensity,
        groupEngagement,
        keyTakeaways: keyTakeaways.trim(),
        fatiguedPlayerUids,
      });

      onDebriefSaved?.(saved);
      onClose();
    } catch (err) {
      console.warn('[CoachSessionDebriefModal] Échec de l’enregistrement du débrief:', err);
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    existingDebriefId,
    eventId,
    coachUid,
    rpeScore,
    intensity,
    groupEngagement,
    keyTakeaways,
    fatiguedPlayerUids,
    onDebriefSaved,
    onClose,
  ]);

  const activeRpeInfo = useMemo(() => getBorgRpeInfo(rpeScore), [rpeScore]);
  const styles = useMemo(() => createStyles(tokens, sheetMode), [tokens, sheetMode]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet} testID="coach-session-debrief-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Ionicons name="speedometer-outline" size={14} color={tokens.accent} />
                <CoachText variant="caption" style={styles.headerBadgeText}>
                  Baromètre d’Après-Séance
                </CoachText>
              </View>
              <CoachText variant="section" style={styles.headerTitle}>
                {existingDebriefId ? 'Modifier le Débrief' : 'Clôture d’Entraînement'}
              </CoachText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={22} color={tokens.muted} />
            </Pressable>
          </View>

          {sessionTitle ? (
            <View style={styles.sessionBanner}>
              <Ionicons name="football-outline" size={13} color={tokens.muted} />
              <CoachText variant="caption" muted numberOfLines={1} style={styles.sessionText}>
                {sessionTitle}
              </CoachText>
            </View>
          ) : null}

          {loadingInitial ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.accent} />
            </View>
          ) : (
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Curseur RPE (Échelle de Borg 1 à 10) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <CoachText variant="caption" style={styles.sectionLabel}>
                    1. RPE RESSENTI DU GROUPE (ÉCHELLE DE BORG 1-10)
                  </CoachText>
                </View>

                {/* Badge RPE sélectionné */}
                <View
                  style={[
                    styles.rpeSummaryCard,
                    { borderColor: withAlpha(activeRpeInfo.color, 0.4) },
                  ]}
                >
                  <View
                    style={[
                      styles.rpeScoreCircle,
                      { backgroundColor: activeRpeInfo.color },
                    ]}
                  >
                    <CoachText variant="section" style={styles.rpeScoreNumber}>
                      {rpeScore}
                    </CoachText>
                  </View>
                  <View style={styles.rpeInfoTextCol}>
                    <CoachText variant="body" style={styles.rpeInfoLabel}>
                      {activeRpeInfo.label}
                    </CoachText>
                    <CoachText variant="caption" muted style={styles.rpeInfoDesc}>
                      {activeRpeInfo.description}
                    </CoachText>
                  </View>
                </View>

                {/* Sélecteur 1 à 10 */}
                <View style={styles.rpeButtonsGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const isSelected = rpeScore === score;
                    const info = getBorgRpeInfo(score);
                    return (
                      <PressableSpring
                        key={score}
                        onPress={() => setRpeScore(score)}
                        style={[
                          styles.rpeButton,
                          isSelected && {
                            backgroundColor: info.color,
                            borderColor: info.color,
                          },
                        ]}
                        testID={`rpe-button-${score}`}
                      >
                        <CoachText
                          variant="caption"
                          style={[
                            styles.rpeButtonText,
                            isSelected && styles.rpeButtonTextSelected,
                          ]}
                        >
                          {score}
                        </CoachText>
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {/* 2. Tonalité d'intensité réelle vs planifiée */}
              <View style={styles.sectionBlock}>
                <CoachText variant="caption" style={styles.sectionLabel}>
                  2. INTENSITÉ PAR RAPPORT AU PLAN INITIAL
                </CoachText>
                <View style={styles.intensityRow}>
                  {INTENSITY_OPTIONS.map((opt) => {
                    const isSelected = intensity === opt.value;
                    return (
                      <PressableSpring
                        key={opt.value}
                        onPress={() => setIntensity(opt.value)}
                        style={[
                          styles.intensityCard,
                          isSelected && styles.intensityCardSelected,
                        ]}
                        testID={`intensity-opt-${opt.value}`}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={18}
                          color={isSelected ? tokens.accent : tokens.muted}
                        />
                        <CoachText
                          variant="caption"
                          style={[
                            styles.intensityLabel,
                            isSelected && styles.intensityLabelSelected,
                          ]}
                        >
                          {opt.shortLabel}
                        </CoachText>
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>

              {/* 3. Engagement du groupe (1 à 5 étoiles) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <CoachText variant="caption" style={styles.sectionLabel}>
                    3. ENGAGEMENT & ÉCOUTE COLLECTIVE
                  </CoachText>
                  <CoachText variant="caption" style={styles.starsValueText}>
                    {groupEngagement}/5 étoiles
                  </CoachText>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= groupEngagement;
                    return (
                      <Pressable
                        key={star}
                        onPress={() => setGroupEngagement(star)}
                        hitSlop={8}
                        style={styles.starBtn}
                        testID={`star-rating-${star}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Engagement ${star} sur 5`}
                      >
                        <Ionicons
                          name={filled ? 'star' : 'star-outline'}
                          size={28}
                          color={filled ? '#FBBF24' : tokens.muted}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 4. Joueurs fatigués ou blessés */}
              {players.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeader}>
                    <CoachText variant="caption" style={styles.sectionLabel}>
                      4. JOUEURS PARTICULIÈREMENT ÉPROUVÉS OU BLESSÉS
                    </CoachText>
                    {fatiguedPlayerUids.length > 0 ? (
                      <CoachText variant="caption" style={styles.fatiguedCountText}>
                        {fatiguedPlayerUids.length} signalé(s)
                      </CoachText>
                    ) : null}
                  </View>
                  <View style={styles.fatiguedPlayersWrap}>
                    {players.map((p) => {
                      const isFlagged = fatiguedPlayerUids.includes(p.uid);
                      return (
                        <PressableSpring
                          key={p.uid}
                          onPress={() => toggleFatiguedPlayer(p.uid)}
                          style={[
                            styles.fatiguedChip,
                            isFlagged && styles.fatiguedChipSelected,
                          ]}
                          testID={`fatigued-player-${p.uid}`}
                        >
                          <Ionicons
                            name={isFlagged ? 'warning' : 'person-outline'}
                            size={12}
                            color={isFlagged ? '#EF4444' : tokens.muted}
                          />
                          <CoachText
                            variant="caption"
                            style={[
                              styles.fatiguedChipText,
                              isFlagged && styles.fatiguedChipTextSelected,
                            ]}
                          >
                            {p.name}
                          </CoachText>
                        </PressableSpring>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* 5. Note de synthèse courte */}
              <View style={styles.sectionBlock}>
                <CoachText variant="caption" style={styles.sectionLabel}>
                  5. NOTE DE SYNTHÈSE COURTE
                </CoachText>
                <View style={styles.presetsRow}>
                  {DEBRIEF_TAKEAWAY_PRESETS.map((preset, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleAppendPreset(preset)}
                      style={styles.presetPill}
                    >
                      <Ionicons name="add-circle-outline" size={12} color={tokens.accent} />
                      <CoachText variant="caption" style={styles.presetText}>
                        {preset}
                      </CoachText>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={keyTakeaways}
                  onChangeText={setKeyTakeaways}
                  placeholder="Ex: Séance à haute intensité. Bloc défensif réactif, vigilance sur les étirements..."
                  placeholderTextColor={tokens.muted}
                  multiline
                  numberOfLines={3}
                  style={styles.summaryInput}
                  testID="debrief-summary-input"
                />
              </View>
            </ScrollView>
          )}

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <PressableSpring
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              testID="debrief-save-button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                  <CoachText variant="body" style={styles.saveButtonText}>
                    {existingDebriefId ? 'Mettre à jour le débrief' : 'Valider le débrief (3 clics)'}
                  </CoachText>
                </>
              )}
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function createStyles(tokens: any, sheetMode: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: tokens.card ?? '#181A20',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: sheetMode ? 0 : 20,
      borderBottomRightRadius: sheetMode ? 0 : 20,
      borderWidth: 1,
      borderColor: tokens.border ?? '#2A2E39',
      width: '100%',
      maxWidth: sheetMode ? undefined : 540,
      maxHeight: sheetMode ? '92%' : '88%',
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.xs,
    },
    headerLeft: {
      flex: 1,
      gap: 2,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerBadgeText: {
      color: tokens.accent,
      fontWeight: '800',
      textTransform: 'uppercase',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontWeight: '800',
      color: tokens.foreground,
      fontSize: 18,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    sessionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: withAlpha(tokens.muted, 0.1),
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
    },
    sessionText: {
      flex: 1,
      fontSize: 12,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyScroll: {
      flexShrink: 1,
    },
    bodyContent: {
      paddingVertical: spacing.xs,
      gap: spacing.md,
    },
    sectionBlock: {
      gap: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
      letterSpacing: 0.6,
    },
    starsValueText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FBBF24',
    },
    fatiguedCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#EF4444',
    },
    rpeSummaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: tokens.background ?? '#0F1015',
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.sm,
    },
    rpeScoreCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rpeScoreNumber: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 18,
    },
    rpeInfoTextCol: {
      flex: 1,
      gap: 2,
    },
    rpeInfoLabel: {
      fontWeight: '800',
      fontSize: 14,
    },
    rpeInfoDesc: {
      fontSize: 11,
    },
    rpeButtonsGrid: {
      flexDirection: 'row',
      gap: 4,
      justifyContent: 'space-between',
    },
    rpeButton: {
      flex: 1,
      minHeight: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated ?? '#1F222B',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    rpeButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: tokens.foreground,
    },
    rpeButtonTextSelected: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    intensityRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    intensityCard: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: tokens.elevated ?? '#1F222B',
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    intensityCardSelected: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.15),
    },
    intensityLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: tokens.muted,
      textAlign: 'center',
    },
    intensityLabelSelected: {
      color: tokens.accent,
      fontWeight: '800',
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: tokens.background ?? '#0F1015',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingVertical: spacing.xs,
    },
    starBtn: {
      padding: 4,
    },
    fatiguedPlayersWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    fatiguedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated ?? '#1F222B',
    },
    fatiguedChipSelected: {
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    fatiguedChipText: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '600',
    },
    fatiguedChipTextSelected: {
      color: '#EF4444',
      fontWeight: '800',
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    presetPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
      backgroundColor: withAlpha(tokens.muted, 0.08),
      borderWidth: 1,
      borderColor: withAlpha(tokens.muted, 0.15),
    },
    presetText: {
      fontSize: 11,
      color: tokens.foreground,
    },
    summaryInput: {
      minHeight: 70,
      maxHeight: 120,
      backgroundColor: tokens.background ?? '#0F1015',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      color: tokens.foreground,
      padding: spacing.sm,
      fontSize: 13,
      textAlignVertical: 'top',
    },
    footer: {
      paddingTop: spacing.sm,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: tokens.accent,
      borderRadius: radius.pill,
      height: 46,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
  });
}
