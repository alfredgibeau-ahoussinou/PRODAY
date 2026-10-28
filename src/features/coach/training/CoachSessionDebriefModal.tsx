import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '../../../components/ui/Icon';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useModalTopInset } from '../../../hooks/useModalTopInset';
import {
  BORG_RPE_SCALE,
  DEBRIEF_TAKEAWAY_PRESETS,
  INTENSITY_OPTIONS,
  coachSessionDebriefService,
  getBorgRpeInfo,
  type IntensityRealVsPlanned,
} from '../../../services/coachSessionDebrief.service';
import { useCoachWorkspace } from '../shell/CoachWorkspaceContext';
import {
  TrainingText as CoachText,
  useCoachTrainingTheme,
  type CoachTrainingPalette,
} from './coachTrainingTheme';

const DEFAULT_ROSTER_PLAYERS = [
  'Adam Diallo',
  'Kylian Martin',
  'Sofiane Benali',
  'Jordan Petit',
  'Lucas Bernard',
  'Enzo Moreau',
];

export interface CoachSessionDebriefModalProps {
  visible: boolean;
  onClose: () => void;
  eventId?: string;
  sessionTitle?: string;
  durationMin?: number;
  players?: string[];
  onSaved?: (summary: {
    rpeScore: number;
    durationMin: number;
    loadUa: number;
    presentPlayers: string[];
    mentionPlayer: string;
    observation: string;
  }) => void;
  inline?: boolean;
}

export function CoachSessionDebriefModal({
  visible,
  onClose,
  eventId = 'session_today_demo',
  sessionTitle = 'Conservation & transitions',
  durationMin = 75,
  players = DEFAULT_ROSTER_PLAYERS,
  onSaved,
  inline = false,
}: CoachSessionDebriefModalProps) {
  const { pal, tokens: trainingTokens } = useCoachTrainingTheme();
  const workspace = useCoachWorkspace();
  const sessionProfile = useSessionProfile();
  const styles = useMemo(() => createStyles(pal, workspace.desktop), [pal, workspace.desktop]);
  const modalTopInset = useModalTopInset({ embedded: inline });
  const headerPadTop = workspace.desktop ? 24 : modalTopInset;

  const [rpeScore, setRpeScore] = useState<number>(7);
  const [sessionMinutes, setSessionMinutes] = useState<number>(durationMin || 75);
  const [intensityComparison, setIntensityComparison] =
    useState<IntensityRealVsPlanned>('as_expected');
  const [groupEngagement, setGroupEngagement] = useState<number>(4);
  const [presentSet, setPresentSet] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    players.forEach((p) => {
      map[p] = true;
    });
    return map;
  });
  const [mentionPlayer, setMentionPlayer] = useState<string>(players[0] ?? 'Adam Diallo');
  const [observation, setObservation] = useState<string>('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (durationMin && durationMin > 0) {
      setSessionMinutes(durationMin);
    }
  }, [durationMin]);

  const rpeInfo = useMemo(() => getBorgRpeInfo(rpeScore), [rpeScore]);
  const computedLoadUa = useMemo(
    () => Math.round(Math.max(1, sessionMinutes) * rpeInfo.score),
    [sessionMinutes, rpeInfo.score],
  );

  const togglePlayerPresence = (name: string) => {
    setPresentSet((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePreset = (preset: string) => {
    setSelectedPresets((prev) => {
      const exists = prev.includes(preset);
      const next = exists ? prev.filter((item) => item !== preset) : [...prev, preset];
      if (!exists && !observation.includes(preset)) {
        setObservation((curr) => (curr.trim() ? `${curr.trim()} · ${preset}` : preset));
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const presentPlayers = players.filter((p) => presentSet[p] !== false);
      const fullObservation = [
        observation.trim(),
        mentionPlayer ? `Mention du jour : ${mentionPlayer}` : '',
      ]
        .filter(Boolean)
        .join(' — ');

      await coachSessionDebriefService.saveDebrief({
        eventId,
        coachUid: sessionProfile?.uid || 'coach_demo',
        rpeScore: rpeInfo.score,
        intensityRealVsPlanned: intensityComparison,
        groupEngagement,
        keyTakeaways:
          fullObservation ||
          `Séance ${sessionTitle} (${sessionMinutes} min · Charge ${computedLoadUa} UA)`,
        fatiguedPlayerUids: players.filter((p) => presentSet[p] === false),
      });

      setSavedSuccess(true);
      onSaved?.({
        rpeScore: rpeInfo.score,
        durationMin: sessionMinutes,
        loadUa: computedLoadUa,
        presentPlayers,
        mentionPlayer,
        observation: observation.trim(),
      });
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 450);
    } finally {
      setSaving(false);
    }
  };

  if (!visible && !inline) return null;

  const presentCount = players.filter((p) => presentSet[p] !== false).length;

  const content = (
    <View style={styles.root} testID="coach-session-debrief-modal">
      {!inline ? <StatusBar style={trainingTokens.isLight ? 'dark' : 'light'} /> : null}
      <View style={[styles.topHeader, { paddingTop: headerPadTop }]}>
        <View style={styles.topHeaderLeft}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backPill}
          >
            <CoachText style={styles.backPillText}>‹ Retour</CoachText>
          </Pressable>
          <CoachText style={styles.eyebrow}>PRODAY · BILAN DE SÉANCE</CoachText>
          <CoachText style={styles.pageTitle}>Bilan de séance</CoachText>
          <CoachText style={styles.pageSubtitle}>
            Présences et objectifs · {sessionTitle}
          </CoachText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <CoachText style={styles.introText}>
          Confirmez les présences et notez un point positif avant de quitter le terrain.
        </CoachText>

        <View style={workspace.desktop ? styles.desktopSplit : styles.mobileStack}>
          {/* Proto debrief : Présences d’abord sur mobile ; RPE conservé (Firebase). */}
          {!workspace.desktop ? (
            <View style={styles.sideCol} testID="debrief-presences-first">
              <CoachText style={styles.sectionTitle}>
                Présences ({presentCount} / {players.length})
              </CoachText>
              <View style={styles.listGroup}>
                {players.map((player, idx) => {
                  const isPresent = presentSet[player] !== false;
                  return (
                    <Pressable
                      key={`mobile-presence-${player}`}
                      onPress={() => togglePlayerPresence(player)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Présence ${player}`}
                      accessibilityState={{ checked: isPresent }}
                      style={[styles.checkRow, idx > 0 && styles.checkRowBorder]}
                    >
                      <View>
                        <CoachText style={styles.checkRowName}>{player}</CoachText>
                        <CoachText
                          style={[
                            styles.checkRowStatus,
                            { color: isPresent ? pal.green : pal.sub },
                          ]}
                        >
                          {isPresent ? 'Présent' : 'Absent'}
                        </CoachText>
                      </View>
                      <View style={[styles.checkbox, isPresent && styles.checkboxChecked]}>
                        {isPresent ? <Icon name="checkmark-circle" size={14} color={pal.white} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Colonne principale : RPE & Charge + Observations */}
          <View style={styles.mainCol}>
            {/* Carte Curseur RPE (1 à 10) & Calcul automatique de la charge (durée × RPE) */}
            <View style={styles.card} testID="debrief-rpe-card">
              <View style={styles.cardHeaderRow}>
                <CoachText style={styles.cardHeadOrange}>
                  Intensité perçue (RPE 1 à 10) & Charge
                </CoachText>
                <View style={styles.loadPill}>
                  <CoachText style={styles.loadPillText}>{computedLoadUa} UA</CoachText>
                </View>
              </View>

              {/* Métrique Charge = durée × RPE */}
              <View style={styles.metricsSplitRow}>
                <View style={styles.metricBox}>
                  <CoachText style={styles.metricValue}>
                    {rpeInfo.score}
                    <CoachText style={styles.metricUnit}> / 10</CoachText>
                  </CoachText>
                  <CoachText style={styles.metricCaption}>{rpeInfo.label}</CoachText>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricBox}>
                  <CoachText style={styles.metricValue} testID="debrief-load-value">
                    {computedLoadUa}
                    <CoachText style={styles.metricUnit}> UA</CoachText>
                  </CoachText>
                  <CoachText style={styles.metricCaption}>
                    Charge ({sessionMinutes} min × RPE {rpeInfo.score})
                  </CoachText>
                </View>
              </View>

              {/* Curseur RPE interactif 1 à 10 */}
              <View
                style={styles.rpeScaleRow}
                accessibilityRole="adjustable"
                accessibilityLabel={'Curseur RPE de 1 à 10'}>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((val) => {
                  const selected = rpeInfo.score === val;
                  const isHigh = val >= 8;
                  const isMed = val >= 5 && val <= 7;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => setRpeScore(val)}
                      accessibilityRole="button"
                      accessibilityLabel={`RPE ${val}`}
                      accessibilityState={{ selected }}
                      style={[
                        styles.rpeStepBtn,
                        selected && {
                          backgroundColor: isHigh
                            ? pal.red
                            : isMed
                              ? pal.orange
                              : pal.green,
                          borderColor: isHigh ? pal.red : isMed ? pal.orange : pal.green,
                        },
                      ]}
                    >
                      <CoachText
                        style={[styles.rpeStepText, selected && styles.rpeStepTextActive]}
                      >
                        {val}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Ajustement rapide de la durée réelle */}
              <View style={styles.durationAdjustBlock}>
                <CoachText style={styles.formLabel}>Durée effective</CoachText>
                <View
                  style={styles.durationChips}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Durée effective de la séance"
                >
                  {[60, 75, 90, 105].map((min) => {
                    const active = sessionMinutes === min;
                    return (
                      <Pressable
                        key={min}
                        onPress={() => setSessionMinutes(min)}
                        accessibilityRole="radio"
                        accessibilityLabel={`Durée ${min} minutes`}
                        accessibilityState={{ selected: active }}
                        style={[styles.smallChip, active && styles.smallChipActive]}
                      >
                        <CoachText
                          style={[styles.smallChipText, active && styles.smallChipTextActive]}
                        >
                          {min} min
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Ressenti par rapport au plan */}
              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Intensité réelle vs prévue</CoachText>
                <View style={styles.segmentedBar}>
                  {INTENSITY_OPTIONS.map((opt) => {
                    const chosen = intensityComparison === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setIntensityComparison(opt.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: chosen }}
                        style={[styles.segmentOption, chosen && styles.segmentOptionChosen]}
                      >
                        <CoachText
                          style={[
                            styles.segmentOptionText,
                            chosen && styles.segmentOptionTextChosen,
                          ]}
                        >
                          {opt.label}
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Section Mention du jour & Observations */}
            <CoachText style={styles.sectionTitle}>Mention du jour & Observations</CoachText>
            <View style={styles.card}>
              <CoachText style={styles.cardHeadOrange}>Valoriser un joueur</CoachText>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Joueur</CoachText>
                <View style={styles.chipsWrap}>
                  {players.map((player) => {
                    const chosen = mentionPlayer === player;
                    return (
                      <Pressable
                        key={player}
                        onPress={() => setMentionPlayer(player)}
                        accessibilityRole="button"
                        accessibilityLabel={`Valoriser ${player}`}
                        accessibilityState={{ selected: chosen }}
                        style={[styles.playerChip, chosen && styles.playerChipActive]}
                      >
                        <CoachText
                          style={[styles.playerChipText, chosen && styles.playerChipTextActive]}
                        >
                          {player}
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Observations rapides</CoachText>
                <View style={styles.chipsWrap}>
                  {DEBRIEF_TAKEAWAY_PRESETS.slice(0, 4).map((preset) => {
                    const active = selectedPresets.includes(preset);
                    return (
                      <Pressable
                        key={preset}
                        onPress={() => togglePreset(preset)}
                        accessibilityRole="button"
                        style={[styles.presetChip, active && styles.presetChipActive]}
                      >
                        <CoachText
                          style={[styles.presetChipText, active && styles.presetChipTextActive]}
                        >
                          {preset}
                        </CoachText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <CoachText style={styles.formLabel}>Observation</CoachText>
                <TextInput
                  value={observation}
                  onChangeText={setObservation}
                  multiline
                  placeholder={'Ex. Bonne prise d’information avant réception'}placeholderTextColor={pal.muted}
                  accessibilityLabel={'Observation de la séance'}style={[styles.input, styles.textarea]}
                />
              </View>
            </View>
          </View>

          {/* Desktop : présences en colonne latérale. Mobile : CTA en flux après le formulaire (pas de flex:1). */}
          {workspace.desktop ? (
            <View style={styles.sideCol}>
              <CoachText style={styles.sectionTitle}>
                Présences ({presentCount} / {players.length})
              </CoachText>
              <View style={styles.listGroup}>
                {players.map((player, idx) => {
                  const isPresent = presentSet[player] !== false;
                  return (
                    <Pressable
                      key={player}
                      onPress={() => togglePlayerPresence(player)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Présence ${player}`}
                      accessibilityState={{ checked: isPresent }}
                      style={[styles.checkRow, idx > 0 && styles.checkRowBorder]}
                    >
                      <View>
                        <CoachText style={styles.checkRowName}>{player}</CoachText>
                        <CoachText
                          style={[
                            styles.checkRowStatus,
                            { color: isPresent ? pal.green : pal.sub },
                          ]}
                        >
                          {isPresent ? 'Présent' : 'Absent'}
                        </CoachText>
                      </View>
                      <View style={[styles.checkbox, isPresent && styles.checkboxChecked]}>
                        {isPresent ? (
                          <Icon name="checkmark-circle" size={14} color={pal.white} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {savedSuccess ? (
                <View style={styles.successBanner}>
                  <CoachText style={styles.successBannerText}>
                    Bilan enregistré ({computedLoadUa} UA) · Fiche mise à jour
                  </CoachText>
                </View>
              ) : null}

              <Pressable
                onPress={() => void handleSave()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={'Enregistrer le bilan'}style={[styles.primaryAction, saving && { opacity: 0.6 }]}
              >
                <CoachText style={styles.primaryActionText}>
                  {saving ? 'Enregistrement…' : 'Enregistrer le bilan'}
                </CoachText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.saveBlock} testID="debrief-save-in-flow">
              {savedSuccess ? (
                <View style={styles.successBanner}>
                  <CoachText style={styles.successBannerText}>
                    Bilan enregistré ({computedLoadUa} UA) · Fiche mise à jour
                  </CoachText>
                </View>
              ) : null}

              <Pressable
                onPress={() => void handleSave()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={'Enregistrer le bilan'}style={[styles.primaryAction, saving && { opacity: 0.6 }]}
              >
                <CoachText style={styles.primaryActionText}>
                  {saving ? 'Enregistrement…' : 'Enregistrer le bilan'}
                </CoachText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  if (inline) return content;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function createStyles(pal: CoachTrainingPalette, desktop: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: desktop ? pal.bgDesktop : pal.bgMobile,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: desktop ? 32 : 20,
      paddingTop: desktop ? 24 : 18,
      paddingBottom: 12,
      maxWidth: 1120,
      width: '100%',
      alignSelf: 'center',
    },
    topHeaderLeft: {
      flex: 1,
      gap: 4,
    },
    backPill: {
      alignSelf: 'flex-start',
      backgroundColor: pal.orangeSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 6,
    },
    backPillText: {
      color: pal.orange,
      fontSize: 13,
      fontWeight: '700',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: pal.sub,
    },
    pageTitle: {
      fontSize: desktop ? 30 : 28,
      lineHeight: desktop ? 36 : 34,
      fontWeight: '800',
      color: pal.ink,
      letterSpacing: -0.8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: pal.sub,
    },
    scrollContent: {
      width: '100%',
      maxWidth: 1120,
      alignSelf: 'center',
      paddingHorizontal: desktop ? 32 : 20,
      // Espace bas pour le CTA en flux (évite tout chevauchement type sticky/flex web).
      paddingBottom: desktop ? 48 : 72,
      gap: 16,
    },
    introText: {
      fontSize: 15,
      lineHeight: 22,
      color: pal.sub,
    },
    desktopSplit: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    mobileStack: {
      flexDirection: 'column',
      // Contenu-sized stack: jamais flex:1 ici (RN Web overlap avec ScrollView).
      alignItems: 'stretch',
      gap: 16,
    },
    mainCol: {
      // flex uniquement en row desktop — sur mobile, hauteur = contenu.
      ...(desktop ? { flex: 1.35 } : { width: '100%' as const }),
      gap: 14,
    },
    sideCol: {
      ...(desktop ? { flex: 1 } : { width: '100%' as const }),
      gap: 14,
    },
    saveBlock: {
      width: '100%',
      gap: 14,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: pal.orange,
      marginTop: 4,
    },
    card: {
      backgroundColor: pal.card,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: pal.borderCard,
      gap: 14,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardHeadOrange: {
      fontSize: 14,
      fontWeight: '700',
      color: pal.orange,
    },
    loadPill: {
      backgroundColor: pal.orangeSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    loadPillText: {
      fontSize: 12,
      fontWeight: '800',
      color: pal.orange,
    },
    metricsSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: pal.cardSoft,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: pal.borderSoft,
      gap: 14,
    },
    metricBox: {
      flex: 1,
      gap: 4,
    },
    metricDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: pal.borderCard,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: '800',
      color: pal.ink,
      letterSpacing: -0.5,
      lineHeight: 34,
      includeFontPadding: false,
    },
    metricUnit: {
      fontSize: 14,
      fontWeight: '600',
      color: pal.sub,
      lineHeight: 20,
    },
    metricCaption: {
      fontSize: 12,
      color: pal.sub,
      lineHeight: 16,
    },
    rpeScaleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 5,
    },
    rpeStepBtn: {
      flex: 1,
      minHeight: 40,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rpeStepText: {
      fontSize: 13,
      fontWeight: '700',
      color: pal.ink,
      lineHeight: 18,
      includeFontPadding: false,
    },
    rpeStepTextActive: {
      color: pal.white,
      fontWeight: '800',
      lineHeight: 18,
      includeFontPadding: false,
    },
    durationAdjustBlock: {
      gap: 8,
      marginTop: 4,
    },
    durationChips: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 6,
    },
    smallChip: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
      overflow: 'hidden',
    },
    smallChipActive: {
      backgroundColor: pal.orangeSoft,
      borderColor: pal.orange,
    },
    smallChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.sub,
      textAlign: 'center',
    },
    smallChipTextActive: {
      color: pal.orange,
      fontWeight: '800',
      textAlign: 'center',
    },
    segmentedBar: {
      flexDirection: 'row',
      backgroundColor: pal.cardSoft,
      borderRadius: 11,
      padding: 3,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    segmentOption: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentOptionChosen: {
      backgroundColor: pal.card,
    },
    segmentOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: pal.sub,
    },
    segmentOptionTextChosen: {
      color: pal.ink,
      fontWeight: '800',
    },
    formField: {
      gap: 8,
    },
    formLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.ink,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    playerChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    playerChipActive: {
      backgroundColor: pal.orange,
      borderColor: pal.orange,
    },
    playerChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: pal.ink,
    },
    playerChipTextActive: {
      color: pal.white,
      fontWeight: '700',
    },
    presetChip: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
    },
    presetChipActive: {
      backgroundColor: pal.orangeSoft,
      borderColor: pal.orange,
    },
    presetChipText: {
      fontSize: 12,
      color: pal.sub,
      fontWeight: '600',
    },
    presetChipTextActive: {
      color: pal.orange,
      fontWeight: '700',
    },
    input: {
      backgroundColor: pal.cardSoft,
      borderWidth: 1,
      borderColor: pal.borderCard,
      borderRadius: 13,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: pal.ink,
    },
    textarea: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    listGroup: {
      backgroundColor: pal.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: pal.borderCard,
      overflow: 'hidden',
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      minHeight: 58,
    },
    checkRowBorder: {
      borderTopWidth: 1,
      borderTopColor: pal.borderSoft,
    },
    checkRowName: {
      fontSize: 15,
      fontWeight: '600',
      color: pal.ink,
    },
    checkRowStatus: {
      fontSize: 12,
      marginTop: 2,
      fontWeight: '600',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: pal.borderCard,
      backgroundColor: pal.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: pal.blue,
      borderColor: pal.blue,
    },
    successBanner: {
      backgroundColor: pal.greenSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
    },
    successBannerText: {
      color: pal.green,
      fontSize: 13,
      fontWeight: '700',
    },
    primaryAction: {
      backgroundColor: pal.orange,
      borderRadius: 25,
      minHeight: 48,
      paddingHorizontal: 20,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryActionText: {
      color: pal.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
