import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import type { ProgressionObjective, ObjectiveCategory, ObjectivePositionFamily } from '../../models/FootballProgression';
import { OBJECTIVE_TEMPLATES } from '../../config/footballProgressionRules';
import { footballProgressionService } from '../../services/footballProgression.service';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface CoachObjectiveAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  coachUid: string;
  coachName: string;
  clubId: string;
  teamId?: string;
  playerUid: string;
  playerName: string;
  pendingReviewObjectives?: ProgressionObjective[];
  onObjectiveUpdated?: () => void;
}

export const CoachObjectiveAssignmentModal: React.FC<CoachObjectiveAssignmentModalProps> = ({
  visible,
  onClose,
  coachUid,
  coachName,
  clubId,
  teamId,
  playerUid,
  playerName,
  pendingReviewObjectives = [],
  onObjectiveUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'assign' | 'reviews'>('assign');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('obj_gk_aerial');
  const [customTitle, setCustomTitle] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAssignPredefined = async (tpl: typeof OBJECTIVE_TEMPLATES[0]) => {
    setSubmitting(true);
    try {
      await footballProgressionService.assignObjectiveByCoach({
        coach_uid: coachUid,
        coach_name: coachName,
        player_uid: playerUid,
        club_id: clubId,
        team_id: teamId,
        title: tpl.title,
        action_description: tpl.action_description,
        purpose: tpl.purpose,
        measurable_condition: tpl.measurable_condition,
        category: tpl.category,
        target_position: tpl.target_position,
        xp_reward: tpl.xp_reward,
        action_kind: tpl.action_kind,
        milestone_key: tpl.milestone_key,
      });

      prodayHaptics.confirm();
      Alert.alert('Objectif assigné', `L'objectif a été assigné à ${playerName}.`);
      onObjectiveUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’assigner l’objectif.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCustom = async () => {
    if (!customTitle.trim() || !customCondition.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner le titre et la condition mesurable.');
      return;
    }

    setSubmitting(true);
    try {
      await footballProgressionService.assignObjectiveByCoach({
        coach_uid: coachUid,
        coach_name: coachName,
        player_uid: playerUid,
        club_id: clubId,
        team_id: teamId,
        title: customTitle.trim(),
        action_description: customCondition.trim(),
        purpose: customPurpose.trim() || 'Perfectionnement ciblé défini par le coach.',
        measurable_condition: customCondition.trim(),
        category: 'technical',
        target_position: 'universal',
        xp_reward: 60,
        action_kind: 'open_individual_program',
      });

      prodayHaptics.confirm();
      Alert.alert('Objectif assigné', `L'objectif personnalisé a été assigné à ${playerName}.`);
      setCustomTitle('');
      setCustomPurpose('');
      setCustomCondition('');
      onObjectiveUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’assigner l’objectif.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDecision = async (
    objectiveId: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
  ) => {
    const feedback = reviewFeedback[objectiveId] || '';
    if (decision === 'needs_revision' && !feedback.trim()) {
      Alert.alert('Commentaire requis', 'Veuillez préciser au joueur ce qu’il doit ajuster.');
      return;
    }

    setSubmitting(true);
    try {
      await footballProgressionService.reviewObjectiveByCoach(
        objectiveId,
        coachUid,
        decision,
        feedback || 'Validé par le coach.',
      );
      prodayHaptics.confirm();
      Alert.alert(
        decision === 'approved' ? 'Objectif Validé' : decision === 'needs_revision' ? 'Retour envoyé' : 'Annulé',
        `La décision a été transmise à ${playerName}.`,
      );
      onObjectiveUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de traiter la décision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ProDayText variant="title" style={styles.headerTitle}>
                Gestion des Objectifs • {playerName}
              </ProDayText>
              <ProDayText variant="caption" style={styles.headerSubtitle}>
                Attribution & validation d’axes de développement
              </ProDayText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={PLAYER_DARK.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Segment Navigation */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'assign' && styles.tabButtonActive]}
              onPress={() => setActiveTab('assign')}
            >
              <ProDayText variant="caption" style={[styles.tabText, activeTab === 'assign' && styles.tabTextActive]}>
                Assigner une quête
              </ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <ProDayText variant="caption" style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Validations en attente ({pendingReviewObjectives.length})
              </ProDayText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'assign' ? (
              <View>
                <ProDayText variant="section" style={styles.sectionTitle}>
                  Modèles recommandés
                </ProDayText>

                {OBJECTIVE_TEMPLATES.map((tpl) => (
                  <View key={tpl.template_id} style={styles.templateCard}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <ProDayText variant="body" style={styles.tplTitle}>
                        {tpl.title}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.tplDesc}>
                        {tpl.action_description}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.tplReward}>
                        Récompense : +{tpl.xp_reward} XP • {tpl.category}
                      </ProDayText>
                    </View>
                    <TouchableOpacity
                      style={styles.assignButton}
                      disabled={submitting}
                      onPress={() => handleAssignPredefined(tpl)}
                    >
                      <ProDayText variant="caption" style={styles.assignButtonText}>
                        Assigner
                      </ProDayText>
                    </TouchableOpacity>
                  </View>
                ))}

                <ProDayText variant="section" style={[styles.sectionTitle, { marginTop: 20 }]}>
                  Créer un objectif sur-mesure
                </ProDayText>

                <View style={styles.customCard}>
                  <ProDayText variant="caption" style={styles.inputLabel}>
                    Titre de l’objectif
                  </ProDayText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Prise de balle sur pied faible sous pression"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={customTitle}
                    onChangeText={setCustomTitle}
                  />

                  <ProDayText variant="caption" style={styles.inputLabel}>
                    Finalité sportive
                  </ProDayText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Éviter les pertes de balle en zone 2"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={customPurpose}
                    onChangeText={setCustomPurpose}
                  />

                  <ProDayText variant="caption" style={styles.inputLabel}>
                    Condition mesurable de réussite
                  </ProDayText>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    multiline
                    placeholder="Ex: Réussir 8 séquences lors de la séance de mardi"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={customCondition}
                    onChangeText={setCustomCondition}
                  />

                  <TouchableOpacity
                    style={[styles.submitCustomButton, submitting && { opacity: 0.5 }]}
                    disabled={submitting}
                    onPress={handleAssignCustom}
                  >
                    <ProDayText variant="caption" style={styles.submitCustomText}>
                      Créer et assigner au joueur (+60 XP)
                    </ProDayText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {pendingReviewObjectives.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="checkmark-done-circle-outline" size={32} color="#10AC84" />
                    <ProDayText variant="body" style={styles.emptyText}>
                      Aucune soumission en attente pour ce joueur.
                    </ProDayText>
                  </View>
                ) : (
                  pendingReviewObjectives.map((obj) => (
                    <View key={obj.id} style={styles.reviewCard}>
                      <ProDayText variant="section" style={styles.reviewTitle}>
                        {obj.title}
                      </ProDayText>
                      <ProDayText variant="body" style={styles.reviewDesc}>
                        Condition : {obj.measurable_condition}
                      </ProDayText>

                      {obj.player_notes ? (
                        <View style={styles.playerNotesBox}>
                          <ProDayText variant="caption" style={styles.notesLabel}>
                            Ressenti du joueur :
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.notesContent}>
                            « {obj.player_notes} »
                          </ProDayText>
                        </View>
                      ) : null}

                      <TextInput
                        style={[styles.input, { height: 60, marginTop: 10 }]}
                        multiline
                        placeholder="Commentaire du coach (conseils, ajustements)..."
                        placeholderTextColor={PLAYER_DARK.textMuted}
                        value={reviewFeedback[obj.id] || ''}
                        onChangeText={(t) => setReviewFeedback((prev) => ({ ...prev, [obj.id]: t }))}
                      />

                      <View style={styles.reviewActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleReviewDecision(obj.id, 'approved')}
                        >
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <ProDayText variant="caption" style={styles.actionBtnText}>
                            Valider (+{obj.xp_reward} XP)
                          </ProDayText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.reviseBtn]}
                          onPress={() => handleReviewDecision(obj.id, 'needs_revision')}
                        >
                          <Ionicons name="create-outline" size={14} color="#FF9F43" style={{ marginRight: 4 }} />
                          <ProDayText variant="caption" style={[styles.actionBtnText, { color: '#FF9F43' }]}>
                            Demander révision
                          </ProDayText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: PLAYER_DARK.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 210, 211, 0.1)',
  },
  tabText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#00D2D3',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 18,
  },
  sectionTitle: {
    color: PLAYER_DARK.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 12,
    marginBottom: 10,
  },
  tplTitle: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '700',
  },
  tplDesc: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  tplReward: {
    color: '#00D2D3',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  assignButton: {
    backgroundColor: '#003399',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  customCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 14,
    marginBottom: 20,
  },
  inputLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitCustomButton: {
    backgroundColor: '#003399',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  submitCustomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.3)',
    padding: 14,
    marginBottom: 14,
  },
  reviewTitle: {
    color: PLAYER_DARK.text,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewDesc: {
    color: PLAYER_DARK.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  playerNotesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  notesLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  notesContent: {
    color: PLAYER_DARK.text,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  approveBtn: {
    backgroundColor: '#10AC84',
  },
  reviseBtn: {
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.4)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
