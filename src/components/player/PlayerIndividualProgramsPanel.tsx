import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { individualProgramsService } from '../../services/individualPrograms.service';
import type {
  IndividualTrainingProgram,
  AssignedExerciseSnapshot,
} from '../../models/IndividualTrainingProgram';
import { PlayerFeedbackModal } from './PlayerFeedbackModal';
import { CoachExerciseDiagramRenderer } from '../coach/diagram/CoachExerciseDiagramRenderer';

interface Props {
  playerUid: string;
  playerName: string;
  clubId?: string;
  teamId?: string;
  accent?: string;
}

export const PlayerIndividualProgramsPanel: React.FC<Props> = ({
  playerUid,
  playerName,
  clubId,
  teamId,
  accent = PLAYER_DARK.accent,
}) => {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<IndividualTrainingProgram[]>([]);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [feedbackInputOpen, setFeedbackInputOpen] = useState<Record<string, boolean>>({});
  const [showSpecificRequestModal, setShowSpecificRequestModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await individualProgramsService.listForPlayer(playerUid);
      setPrograms(data);
      if (data.length > 0 && !expandedProgramId) {
        setExpandedProgramId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [playerUid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleComplete = async (
    programId: string,
    exerciseId: string,
    currentStatus: boolean,
  ) => {
    prodayHaptics.selection();
    const nextVal = !currentStatus;
    const fb = feedbackInputs[exerciseId];

    // Optimistic UI update
    setPrograms((prev) =>
      prev.map((p) => {
        if (p.id !== programId) return p;
        return {
          ...p,
          exercises: p.exercises.map((e) =>
            e.id === exerciseId
              ? {
                  ...e,
                  player_completed: nextVal,
                  player_completed_at: nextVal ? new Date() : undefined,
                  player_feedback: fb ?? e.player_feedback,
                }
              : e,
          ),
        };
      }),
    );

    try {
      await individualProgramsService.markExerciseCompleted(
        programId,
        exerciseId,
        nextVal,
        fb,
      );
    } catch {
      await load();
    }
  };

  const saveFeedbackText = async (programId: string, exerciseId: string) => {
    const text = feedbackInputs[exerciseId]?.trim();
    if (!text) return;
    prodayHaptics.confirm();
    try {
      await individualProgramsService.markExerciseCompleted(
        programId,
        exerciseId,
        true,
        text,
      );
      setFeedbackInputOpen((prev) => ({ ...prev, [exerciseId]: false }));
      Alert.alert('Retour transmis', 'Votre retour sur cet exercice a été transmis au coach.');
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer le retour.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec action pour demander un entraînement spécifique */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="barbell-outline" size={18} color={accent} />
          <ProDayText style={styles.title}>Programmes Individuels</ProDayText>
        </View>

        <TouchableOpacity
          style={[styles.requestSkillBtn, { borderColor: `${accent}40`, backgroundColor: `${accent}15` }]}
          onPress={() => {
            prodayHaptics.selection();
            setShowSpecificRequestModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={14} color={accent} />
          <ProDayText style={[styles.requestSkillBtnText, { color: accent }]}>
            Demander un spécifique
          </ProDayText>
        </TouchableOpacity>
      </View>

      <ProDayText style={styles.subtitle}>
        Exercices ciblés et devoirs assignés par votre staff technique avec instructions préservées.
      </ProDayText>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={accent} />
          <ProDayText style={styles.loadingText}>Chargement de vos programmes…</ProDayText>
        </View>
      ) : programs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="fitness-outline" size={28} color={PLAYER_DARK.textMuted} />
          <ProDayText style={styles.emptyTitle}>Aucun programme individuel actif</ProDayText>
          <ProDayText style={styles.emptyBody}>
            Votre coach peut vous assigner des ateliers spécifiques, ou vous pouvez lui demander de travailler un point technique.
          </ProDayText>
          <TouchableOpacity
            style={[styles.emptyActionBtn, { backgroundColor: accent }]}
            onPress={() => setShowSpecificRequestModal(true)}
          >
            <ProDayText style={styles.emptyActionText}>Demander un entraînement spécifique</ProDayText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.programsList}>
          {programs.map((prog) => {
            const isExpanded = expandedProgramId === prog.id;
            const completedCount = prog.exercises.filter((e) => e.player_completed).length;
            const reviewedCount = prog.exercises.filter((e) => e.coach_reviewed).length;

            return (
              <View key={prog.id} style={styles.programCard}>
                <TouchableOpacity
                  style={styles.programCardHeader}
                  onPress={() => {
                    prodayHaptics.selection();
                    setExpandedProgramId(isExpanded ? null : prog.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.programBadgeRow}>
                      <View style={[styles.coachBadge, { backgroundColor: `${accent}18` }]}>
                        <ProDayText style={[styles.coachBadgeText, { color: accent }]}>
                          Assigné par {prog.coach_name}
                        </ProDayText>
                      </View>
                      {prog.due_date ? (
                        <ProDayText style={styles.dueText}>
                          Pour le {new Date(prog.due_date).toLocaleDateString('fr-FR')}
                        </ProDayText>
                      ) : null}
                    </View>
                    <ProDayText style={styles.programTitle}>{prog.title}</ProDayText>
                    {prog.objective ? (
                      <ProDayText style={styles.programObjective}>{prog.objective}</ProDayText>
                    ) : null}
                  </View>

                  <View style={styles.progHeaderRight}>
                    <View style={styles.countersBox}>
                      <ProDayText style={styles.counterText}>
                        {completedCount}/{prog.exercises.length} faits
                      </ProDayText>
                      {reviewedCount > 0 ? (
                        <ProDayText style={styles.reviewedCounterText}>
                          {reviewedCount} revus staff
                        </ProDayText>
                      ) : null}
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={PLAYER_DARK.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Contenu déroulé : liste des exercices */}
                {isExpanded && (
                  <View style={styles.exercisesList}>
                    {prog.exercises.map((ex, idx) => {
                      const isInputOpen = Boolean(feedbackInputOpen[ex.id]);

                      return (
                        <View key={ex.id} style={styles.exerciseCard}>
                          <View style={styles.exerciseTopRow}>
                            <View style={styles.exerciseNumBadge}>
                              <ProDayText style={styles.exerciseNumText}>#{idx + 1}</ProDayText>
                            </View>
                            <ProDayText style={styles.exerciseTitle}>{ex.title}</ProDayText>
                          </View>

                          {/* Métadonnées : répétitions, durée, matériel */}
                          <View style={styles.metaRow}>
                            {ex.reps_label ? (
                              <View style={styles.metaChip}>
                                <Ionicons name="repeat-outline" size={13} color={PLAYER_DARK.textMuted} />
                                <ProDayText style={styles.metaChipText}>{ex.reps_label}</ProDayText>
                              </View>
                            ) : null}
                            {ex.duration_min ? (
                              <View style={styles.metaChip}>
                                <Ionicons name="time-outline" size={13} color={PLAYER_DARK.textMuted} />
                                <ProDayText style={styles.metaChipText}>{ex.duration_min} min</ProDayText>
                              </View>
                            ) : null}
                            {ex.equipment && ex.equipment.length > 0 ? (
                              <View style={styles.metaChip}>
                                <Ionicons name="cube-outline" size={13} color={PLAYER_DARK.textMuted} />
                                <ProDayText style={styles.metaChipText}>{ex.equipment.join(', ')}</ProDayText>
                              </View>
                            ) : null}
                          </View>

                          {/* Instructions snapshotées */}
                          {ex.instructions ? (
                            <View style={styles.instructionsBox}>
                              <ProDayText style={styles.instructionsLabel}>Consignes :</ProDayText>
                              {(Array.isArray(ex.instructions) ? ex.instructions : [ex.instructions]).map((inst: string, i: number) => (
                                <View key={i} style={styles.instructionItem}>
                                  <Ionicons name="caret-forward" size={10} color={accent} style={{ marginTop: 3 }} />
                                  <ProDayText style={styles.instructionText}>{inst}</ProDayText>
                                </View>
                              ))}
                            </View>
                          ) : null}

                          {/* Schéma / Diagramme tactique s'il existe */}
                          {ex.diagram ? (
                            <View style={styles.diagramWrapper}>
                              <CoachExerciseDiagramRenderer diagram={ex.diagram} height={160} />
                            </View>
                          ) : null}

                          {/* Statuts distincts Joueur vs Coach */}
                          <View style={styles.statusBox}>
                            <View style={styles.statusRow}>
                              <View style={styles.statusIndicator}>
                                <Ionicons
                                  name={ex.player_completed ? 'checkmark-circle' : 'ellipse-outline'}
                                  size={15}
                                  color={ex.player_completed ? '#10B981' : PLAYER_DARK.textMuted}
                                />
                                <ProDayText style={[styles.statusLabel, ex.player_completed && { color: '#10B981', fontWeight: '700' }]}>
                                  {ex.player_completed ? 'Complété par toi' : 'Non complété'}
                                </ProDayText>
                              </View>

                              <View style={styles.statusIndicator}>
                                <Ionicons
                                  name={ex.coach_reviewed ? 'ribbon' : 'time-outline'}
                                  size={15}
                                  color={ex.coach_reviewed ? accent : PLAYER_DARK.textMuted}
                                />
                                <ProDayText style={[styles.statusLabel, ex.coach_reviewed && { color: accent, fontWeight: '700' }]}>
                                  {ex.coach_reviewed ? 'Revu & validé par le coach' : 'En attente revue coach'}
                                </ProDayText>
                              </View>
                            </View>

                            {ex.coach_feedback ? (
                              <View style={styles.coachFeedbackBox}>
                                <Ionicons name="chatbubble-ellipses" size={13} color={accent} />
                                <ProDayText style={styles.coachFeedbackText}>
                                  Staff : {ex.coach_feedback}
                                </ProDayText>
                              </View>
                            ) : null}

                            {ex.player_feedback ? (
                              <View style={styles.playerFeedbackBox}>
                                <Ionicons name="chatbox-ellipses-outline" size={13} color={PLAYER_DARK.textMuted} />
                                <ProDayText style={styles.playerFeedbackText}>
                                  Ton retour : {ex.player_feedback}
                                </ProDayText>
                              </View>
                            ) : null}
                          </View>

                          {/* Actions de complétion et feedback */}
                          <View style={styles.actionsRow}>
                            <TouchableOpacity
                              style={[
                                styles.completeBtn,
                                ex.player_completed && styles.completeBtnActive,
                              ]}
                              onPress={() => handleToggleComplete(prog.id, ex.id, ex.player_completed)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={ex.player_completed ? 'checkmark-circle' : 'checkmark-outline'}
                                size={15}
                                color={ex.player_completed ? '#10B981' : PLAYER_DARK.text}
                              />
                              <ProDayText style={[styles.completeBtnText, ex.player_completed && { color: '#10B981' }]}>
                                {ex.player_completed ? 'Marqué comme fait' : 'Marquer comme fait'}
                              </ProDayText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.feedbackToggleBtn}
                              onPress={() =>
                                setFeedbackInputOpen((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))
                              }
                              activeOpacity={0.7}
                            >
                              <Ionicons name="create-outline" size={14} color={accent} />
                              <ProDayText style={[styles.feedbackToggleText, { color: accent }]}>
                                {ex.player_feedback ? 'Modifier mon retour' : 'Donner mon retour'}
                              </ProDayText>
                            </TouchableOpacity>
                          </View>

                          {/* Saisie de feedback */}
                          {isInputOpen ? (
                            <View style={styles.feedbackInputWrap}>
                              <TextInput
                                style={styles.feedbackInput}
                                placeholder="Ressenti, difficultés, nombre de réussites…"
                                placeholderTextColor={PLAYER_DARK.textMuted}
                                defaultValue={ex.player_feedback ?? feedbackInputs[ex.id] ?? ''}
                                onChangeText={(t) =>
                                  setFeedbackInputs((prev) => ({ ...prev, [ex.id]: t }))
                                }
                              />
                              <TouchableOpacity
                                style={[styles.saveFeedbackBtn, { backgroundColor: accent }]}
                                onPress={() => saveFeedbackText(prog.id, ex.id)}
                              >
                                <ProDayText style={styles.saveFeedbackBtnText}>Enregistrer</ProDayText>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modal Demander un spécifique */}
      <PlayerFeedbackModal
        visible={showSpecificRequestModal}
        onClose={() => setShowSpecificRequestModal(false)}
        playerUid={playerUid}
        playerName={playerName}
        clubId={clubId}
        teamId={teamId}
        initialKind="specific_skill"
        onSuccess={load}
        accent={accent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  requestSkillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  loadingWrap: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyBody: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyActionBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  programsList: {
    gap: 12,
  },
  programCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  programCardHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  programBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  coachBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coachBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dueText: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  programObjective: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    marginTop: 2,
  },
  progHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countersBox: {
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  reviewedCounterText: {
    fontSize: 10,
    color: PLAYER_DARK.accent,
    marginTop: 1,
  },
  exercisesList: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    marginTop: 10,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  exerciseNumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
  },
  instructionsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },
  instructionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PLAYER_DARK.textMuted,
    textTransform: 'uppercase',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  instructionText: {
    fontSize: 12,
    color: PLAYER_DARK.text,
    lineHeight: 16,
    flex: 1,
  },
  diagramWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusLabel: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
  },
  coachFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  coachFeedbackText: {
    fontSize: 11,
    color: PLAYER_DARK.text,
    fontStyle: 'italic',
    flex: 1,
  },
  playerFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  playerFeedbackText: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  completeBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  feedbackToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  feedbackToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  feedbackInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveFeedbackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveFeedbackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
