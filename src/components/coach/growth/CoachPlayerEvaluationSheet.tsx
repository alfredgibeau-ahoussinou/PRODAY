import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import type { User } from '../../../models/User';
import type { CoachPlayerEvaluation } from '../../../models/CoachEvaluation';
import type { CoachSeasonObjective } from '../../../models/CoachSeasonObjective';
import { coachEvaluationsService } from '../../../services/coachEvaluations.service';
import { coachObjectivesService } from '../../../services/coachObjectives.service';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import {
  COACH_RATING_FIELDS,
  clampCoachRating,
  formatCoachRating,
  type CoachRatingField,
} from '../../../utils/coachEvaluationRatings';
import { withAlpha } from '../../../utils/coachTeamTheme';
import { proForm, proRadius, proSemantic } from '../../../theme/professionalDesign';
import { PressableSpring } from '../../motion';
import { CoachText } from '../coachPortalUi';

export interface CoachPlayerEvaluationSheetProps {
  visible: boolean;
  onClose: () => void;
  player: User;
  onSaved?: (evaluationId: string) => void;
}

export const CoachPlayerEvaluationSheet: React.FC<CoachPlayerEvaluationSheetProps> = ({
  visible,
  onClose,
  player,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const { tokens, teamId } = useCoachTheme();
  const session = useSessionProfile();

  const coachUid = session?.uid || 'coach';
  const coachName = session?.display_name || 'Coach';
  const clubId = player.profile.club_id || session?.profile.club_id || '';

  // Rating scores state (/10)
  const [overall, setOverall] = useState<number>(7.0);
  const [technical, setTechnical] = useState<number>(7.0);
  const [tactical, setTactical] = useState<number>(7.0);
  const [physical, setPhysical] = useState<number>(7.0);
  const [mental, setMental] = useState<number>(7.0);

  // Qualitative notes
  const [notes, setNotes] = useState<string>('');
  const [ratingExplanation, setRatingExplanation] = useState<string>('');

  // Visibility toggles
  const [visibleToPlayer, setVisibleToPlayer] = useState<boolean>(true);
  const [visibleToParent, setVisibleToParent] = useState<boolean>(false);

  // Objectives state
  const [objectives, setObjectives] = useState<CoachSeasonObjective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState<boolean>(false);
  const [showAddObjective, setShowAddObjective] = useState<boolean>(false);
  const [newObjectiveTitle, setNewObjectiveTitle] = useState<string>('');
  const [newObjectiveDescription, setNewObjectiveDescription] = useState<string>('');
  const [newObjectiveProgress, setNewObjectiveProgress] = useState<number>(0);
  const [savingObjective, setSavingObjective] = useState<boolean>(false);

  // Saving evaluation state
  const [savingEvaluation, setSavingEvaluation] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!player.uid) return;
    setLoadingInitial(true);
    setLoadingObjectives(true);
    try {
      const [evals, playerObjectives] = await Promise.all([
        coachEvaluationsService.listForPlayer(player.uid, 5),
        coachObjectivesService.listForPlayer(player.uid, 15),
      ]);
      setObjectives(playerObjectives);

      // Pre-fill with the latest evaluation if present
      const latest = evals[0];
      if (latest) {
        if (typeof latest.ratings.overall === 'number') setOverall(latest.ratings.overall);
        if (typeof latest.ratings.technical === 'number') setTechnical(latest.ratings.technical);
        if (typeof latest.ratings.tactical === 'number') setTactical(latest.ratings.tactical);
        if (typeof latest.ratings.physical === 'number') setPhysical(latest.ratings.physical);
        if (typeof latest.ratings.mental === 'number') setMental(latest.ratings.mental);
        if (latest.notes) setNotes(latest.notes);
        if (latest.rating_explanation) setRatingExplanation(latest.rating_explanation);
        setVisibleToPlayer(latest.visible_to_player === true);
        setVisibleToParent(latest.visible_to_parent === true);
      } else {
        // Reset defaults
        setOverall(7.0);
        setTechnical(7.0);
        setTactical(7.0);
        setPhysical(7.0);
        setMental(7.0);
        setNotes('');
        setRatingExplanation('');
        setVisibleToPlayer(true);
        setVisibleToParent(false);
      }
    } catch {
      // Keep defaults on failure
    } finally {
      setLoadingInitial(false);
      setLoadingObjectives(false);
    }
  }, [player.uid]);

  useEffect(() => {
    if (visible) {
      void loadData();
      setShowAddObjective(false);
      setNewObjectiveTitle('');
      setNewObjectiveDescription('');
      setNewObjectiveProgress(0);
    }
  }, [visible, loadData]);

  const handleStepRating = (
    field: CoachRatingField,
    delta: number,
  ) => {
    const updateMap: Record<CoachRatingField, (updater: (prev: number) => number) => void> = {
      overall: (fn) => setOverall((prev) => clampCoachRating(fn(prev))),
      technical: (fn) => setTechnical((prev) => clampCoachRating(fn(prev))),
      tactical: (fn) => setTactical((prev) => clampCoachRating(fn(prev))),
      physical: (fn) => setPhysical((prev) => clampCoachRating(fn(prev))),
      mental: (fn) => setMental((prev) => clampCoachRating(fn(prev))),
    };
    updateMap[field]((v) => Math.round((v + delta) * 10) / 10);
  };

  const handleSaveEvaluation = async () => {
    if (!clubId) {
      Alert.alert('Erreur', 'Identifiant de club manquant.');
      return;
    }
    setSavingEvaluation(true);
    try {
      const evaluationId = await coachEvaluationsService.create(coachUid, coachName, {
        club_id: clubId,
        team_id: teamId,
        player_uid: player.uid,
        player_name: player.display_name,
        context: 'season',
        ratings: {
          overall,
          technical,
          tactical,
          physical,
          mental,
        },
        notes: notes.trim() || undefined,
        rating_explanation: ratingExplanation.trim() || undefined,
        visible_to_player: visibleToPlayer,
        visible_to_parent: visibleToParent,
      });

      Alert.alert('Évaluation enregistrée', `Le bilan 360° pour ${player.display_name} a été sauvegardé avec succès.`);
      onSaved?.(evaluationId);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de sauvegarder l’évaluation.';
      Alert.alert('Erreur', message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleCreateObjective = async () => {
    if (!newObjectiveTitle.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un titre pour l’objectif.');
      return;
    }
    setSavingObjective(true);
    try {
      await coachObjectivesService.create(coachUid, {
        club_id: clubId,
        team_id: teamId,
        scope: 'player',
        player_uid: player.uid,
        player_name: player.display_name,
        title: newObjectiveTitle.trim(),
        description: newObjectiveDescription.trim() || undefined,
        progress: newObjectiveProgress,
        season_label: 'Saison en cours',
      });
      setNewObjectiveTitle('');
      setNewObjectiveDescription('');
      setNewObjectiveProgress(0);
      setShowAddObjective(false);
      // Reload objectives list
      const reloaded = await coachObjectivesService.listForPlayer(player.uid, 15);
      setObjectives(reloaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer l’objectif.';
      Alert.alert('Erreur', message);
    } finally {
      setSavingObjective(false);
    }
  };

  const handleUpdateObjectiveProgress = async (objectiveId: string, newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    setObjectives((prev) =>
      prev.map((o) => (o.id === objectiveId ? { ...o, progress: clamped } : o)),
    );
    try {
      await coachObjectivesService.setProgress(objectiveId, clamped);
    } catch {
      // Reload on failure
      const reloaded = await coachObjectivesService.listForPlayer(player.uid, 15);
      setObjectives(reloaded);
    }
  };

  const renderRatingRow = (
    field: CoachRatingField,
    label: string,
    value: number,
    icon: 'star' | 'lightning-bolt' | 'chess-knight' | 'run' | 'brain',
  ) => {
    return (
      <View key={field} style={[styles.ratingRow, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
        <View style={styles.ratingLabelGroup}>
          <View style={[styles.ratingIconBadge, { backgroundColor: withAlpha(tokens.accent, 0.12) }]}>
            <MaterialCommunityIcons name={icon} size={18} color={tokens.accent} />
          </View>
          <View>
            <CoachText variant="body" style={styles.ratingTitle}>{label}</CoachText>
            <CoachText variant="caption" muted>Notation sur 10</CoachText>
          </View>
        </View>

        <View style={styles.ratingControls}>
          <PressableSpring
            style={[styles.stepButton, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            onPress={() => handleStepRating(field, -0.5)}
            accessibilityLabel={`Diminuer ${label}`}
          >
            <CoachText variant="body" style={styles.stepBtnText}>−</CoachText>
          </PressableSpring>

          <View style={[styles.scoreBadge, { backgroundColor: withAlpha(tokens.accent, 0.15) }]}>
            <CoachText variant="section" style={[styles.scoreText, { color: tokens.accent }]}>
              {formatCoachRating(value)}
            </CoachText>
          </View>

          <PressableSpring
            style={[styles.stepButton, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            onPress={() => handleStepRating(field, +0.5)}
            accessibilityLabel={`Augmenter ${label}`}
          >
            <CoachText variant="body" style={styles.stepBtnText}>+</CoachText>
          </PressableSpring>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalRoot, { backgroundColor: tokens.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Top Header */}
        <View style={[styles.modalHeader, { borderBottomColor: tokens.border, paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerPlayerInfo}>
            <View style={[styles.playerAvatarCircle, { backgroundColor: withAlpha(tokens.accent, 0.2) }]}>
              <CoachText variant="section" style={{ color: tokens.accent, fontWeight: '800' }}>
                {player.display_name.slice(0, 2).toUpperCase()}
              </CoachText>
            </View>
            <View style={{ flex: 1 }}>
              <CoachText variant="section" style={styles.modalTitle} numberOfLines={1}>
                {player.display_name}
              </CoachText>
              <CoachText variant="caption" muted>
                {player.profile.position || 'Poste non renseigné'} · {player.profile.category || 'Équipe'}
              </CoachText>
            </View>
          </View>

          <PressableSpring
            style={[styles.closeButton, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            onPress={onClose}
            accessibilityLabel="Fermer la fiche"
          >
            <Ionicons name="close" size={20} color={tokens.foreground} />
          </PressableSpring>
        </View>

        {loadingInitial ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={tokens.accent} />
            <CoachText variant="caption" muted style={{ marginTop: 12 }}>
              Chargement du dossier joueur...
            </CoachText>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1 : Critères /10 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="bar-chart-2" size={18} color={tokens.accent} />
                <CoachText variant="section" style={styles.sectionTitle}>
                  Évaluation 360° du Joueur
                </CoachText>
              </View>
              <CoachText variant="caption" muted style={{ marginBottom: 12 }}>
                Attribuez une note globale et détaillez les 4 dimensions athlétiques et cognitives.
              </CoachText>

              {renderRatingRow('overall', 'Note Globale', overall, 'star')}
              {renderRatingRow('technical', 'Technique', technical, 'lightning-bolt')}
              {renderRatingRow('tactical', 'Tactique', tactical, 'chess-knight')}
              {renderRatingRow('physical', 'Physique', physical, 'run')}
              {renderRatingRow('mental', 'Mental', mental, 'brain')}
            </View>

            {/* Section 2 : Appréciations & Axes de travail */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="edit-3" size={18} color={tokens.accent} />
                <CoachText variant="section" style={styles.sectionTitle}>
                  Appréciations & Axes de Travail
                </CoachText>
              </View>

              <View style={styles.inputGroup}>
                <CoachText variant="body" style={styles.inputLabel}>
                  Points forts et appréciations
                </CoachText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.foreground,
                    },
                  ]}
                  placeholder="Ex : Excellente vision de jeu, bon premier contrôle sous pression..."
                  placeholderTextColor={tokens.muted}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <CoachText variant="body" style={styles.inputLabel}>
                  Axes de travail & progression
                </CoachText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.foreground,
                    },
                  ]}
                  placeholder="Ex : Travailler le pied faible, améliorer le repli à la perte de balle..."
                  placeholderTextColor={tokens.muted}
                  multiline
                  numberOfLines={3}
                  value={ratingExplanation}
                  onChangeText={setRatingExplanation}
                />
              </View>
            </View>

            {/* Section 3 : Commutateurs de visibilité */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="shield-account-outline" size={20} color={tokens.accent} />
                <CoachText variant="section" style={styles.sectionTitle}>
                  Visibilité & Partage
                </CoachText>
              </View>
              <CoachText variant="caption" muted style={{ marginBottom: 12 }}>
                Gérez la confidentialité des retours envers le joueur et ses représentants légaux.
              </CoachText>

              {/* Toggle Joueur */}
              <View style={[styles.switchRow, { borderBottomColor: tokens.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={styles.switchLabelWithBadge}>
                    <CoachText variant="body" style={styles.switchTitle}>Visible par le joueur</CoachText>
                    {visibleToPlayer && (
                      <View style={[styles.microBadge, { backgroundColor: proSemantic.successSoft }]}>
                        <CoachText variant="caption" style={{ color: proSemantic.success, fontWeight: '700' }}>Actif</CoachText>
                      </View>
                    )}
                  </View>
                  <CoachText variant="caption" muted>
                    Le joueur peut consulter son bilan dans son espace Joueur.
                  </CoachText>
                </View>
                <Switch
                  value={visibleToPlayer}
                  onValueChange={setVisibleToPlayer}
                  trackColor={{ false: tokens.elevated, true: tokens.accent }}
                  thumbColor={Platform.OS === 'android' ? tokens.foreground : undefined}
                />
              </View>

              {/* Toggle Parent */}
              <View style={[styles.switchRow, { paddingTop: 12 }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={styles.switchLabelWithBadge}>
                    <CoachText variant="body" style={styles.switchTitle}>Visible par les parents</CoachText>
                    {visibleToParent && (
                      <View style={[styles.microBadge, { backgroundColor: proSemantic.successSoft }]}>
                        <CoachText variant="caption" style={{ color: proSemantic.success, fontWeight: '700' }}>Actif</CoachText>
                      </View>
                    )}
                  </View>
                  <CoachText variant="caption" muted>
                    Accessible sur l’espace parent pour les joueurs mineurs.
                  </CoachText>
                </View>
                <Switch
                  value={visibleToParent}
                  onValueChange={setVisibleToParent}
                  trackColor={{ false: tokens.elevated, true: tokens.accent }}
                  thumbColor={Platform.OS === 'android' ? tokens.foreground : undefined}
                />
              </View>
            </View>

            {/* Section 4 : Objectifs de saison */}
            <View style={styles.sectionCard}>
              <View style={[styles.sectionHeaderRow, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="target" size={18} color={tokens.accent} />
                  <CoachText variant="section" style={styles.sectionTitle}>
                    Objectifs de Saison
                  </CoachText>
                </View>

                <PressableSpring
                  style={[styles.addObjectiveBtn, { backgroundColor: withAlpha(tokens.accent, 0.15) }]}
                  onPress={() => setShowAddObjective((prev) => !prev)}
                >
                  <Ionicons
                    name={showAddObjective ? 'close' : 'add'}
                    size={16}
                    color={tokens.accent}
                  />
                  <CoachText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                    {showAddObjective ? 'Annuler' : 'Ajouter'}
                  </CoachText>
                </PressableSpring>
              </View>

              {/* Add objective inline form */}
              {showAddObjective && (
                <View style={[styles.objectiveFormBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                  <CoachText variant="body" style={{ fontWeight: '700', marginBottom: 8, color: tokens.foreground }}>
                    Nouvel Objectif Individuel
                  </CoachText>

                  <TextInput
                    style={[
                      styles.inputField,
                      { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground },
                    ]}
                    placeholder="Titre de l’objectif (ex : Améliorer le replacement défensif)"
                    placeholderTextColor={tokens.muted}
                    value={newObjectiveTitle}
                    onChangeText={setNewObjectiveTitle}
                  />

                  <TextInput
                    style={[
                      styles.textArea,
                      { backgroundColor: tokens.elevated, borderColor: tokens.border, color: tokens.foreground, marginTop: 8 },
                    ]}
                    placeholder="Description et critères de réussite (optionnel)"
                    placeholderTextColor={tokens.muted}
                    multiline
                    numberOfLines={2}
                    value={newObjectiveDescription}
                    onChangeText={setNewObjectiveDescription}
                  />

                  {/* Progress slider selector */}
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <CoachText variant="caption" muted>Progression initiale :</CoachText>
                      <CoachText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                        {newObjectiveProgress}%
                      </CoachText>
                    </View>
                    <View style={styles.progressPillsRow}>
                      {[0, 25, 50, 75, 100].map((step) => (
                        <PressableSpring
                          key={step}
                          style={[
                            styles.progressPill,
                            newObjectiveProgress === step
                              ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                              : { backgroundColor: tokens.elevated, borderColor: tokens.border },
                          ]}
                          onPress={() => setNewObjectiveProgress(step)}
                        >
                          <CoachText
                            variant="caption"
                            style={{
                              color: newObjectiveProgress === step ? tokens.bg : tokens.foreground,
                              fontWeight: '700',
                            }}
                          >
                            {step}%
                          </CoachText>
                        </PressableSpring>
                      ))}
                    </View>
                  </View>

                  <PressableSpring
                    style={[styles.saveObjectiveCta, { backgroundColor: tokens.accent }]}
                    onPress={handleCreateObjective}
                    disabled={savingObjective}
                  >
                    {savingObjective ? (
                      <ActivityIndicator size="small" color={tokens.bg} />
                    ) : (
                      <CoachText variant="body" style={[styles.saveObjectiveCtaText, { color: tokens.bg }]}>
                        Valider l’objectif
                      </CoachText>
                    )}
                  </PressableSpring>
                </View>
              )}

              {/* Objectives List */}
              {loadingObjectives ? (
                <ActivityIndicator size="small" color={tokens.accent} style={{ marginVertical: 16 }} />
              ) : objectives.length === 0 ? (
                <View style={styles.emptyObjectivesBox}>
                  <Feather name="info" size={16} color={tokens.muted} />
                  <CoachText variant="caption" muted>
                    Aucun objectif individuel enregistré pour ce joueur.
                  </CoachText>
                </View>
              ) : (
                objectives.map((obj) => (
                  <View
                    key={obj.id}
                    style={[styles.objectiveCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  >
                    <View style={styles.objectiveCardHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <CoachText variant="body" style={styles.objectiveTitle}>
                          {obj.title}
                        </CoachText>
                        {obj.description ? (
                          <CoachText variant="caption" muted style={{ marginTop: 2 }}>
                            {obj.description}
                          </CoachText>
                        ) : null}
                      </View>
                      <View style={[styles.objectiveProgressBadge, { backgroundColor: withAlpha(tokens.accent, 0.15) }]}>
                        <CoachText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                          {obj.progress}%
                        </CoachText>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.progressBarBg, { backgroundColor: tokens.elevated }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${obj.progress}%`,
                            backgroundColor: obj.progress === 100 ? proSemantic.success : tokens.accent,
                          },
                        ]}
                      />
                    </View>

                    {/* Quick progress adjustment steppers */}
                    <View style={styles.progressActionsRow}>
                      <CoachText variant="caption" muted>Ajuster :</CoachText>
                      <View style={styles.progressBtnsGroup}>
                        <PressableSpring
                          style={[styles.progressQuickBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                          onPress={() => handleUpdateObjectiveProgress(obj.id, obj.progress - 10)}
                        >
                          <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>-10%</CoachText>
                        </PressableSpring>
                        <PressableSpring
                          style={[styles.progressQuickBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                          onPress={() => handleUpdateObjectiveProgress(obj.id, obj.progress + 10)}
                        >
                          <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>+10%</CoachText>
                        </PressableSpring>
                        {obj.progress < 100 && (
                          <PressableSpring
                            style={[styles.progressQuickBtn, { backgroundColor: withAlpha(proSemantic.success, 0.15), borderColor: proSemantic.success }]}
                            onPress={() => handleUpdateObjectiveProgress(obj.id, 100)}
                          >
                            <Ionicons name="checkmark" size={12} color={proSemantic.success} />
                            <CoachText variant="caption" style={{ color: proSemantic.success, fontWeight: '700' }}>100%</CoachText>
                          </PressableSpring>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {/* Bottom Floating Action Bar */}
        <View style={[styles.bottomActionBar, { backgroundColor: tokens.bg, borderTopColor: tokens.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <PressableSpring
            style={[styles.cancelBtn, { borderColor: tokens.border, backgroundColor: tokens.elevated }]}
            onPress={onClose}
          >
            <CoachText variant="body" style={{ color: tokens.foreground, fontWeight: '600' }}>
              Fermer
            </CoachText>
          </PressableSpring>

          <PressableSpring
            style={[styles.saveBtn, { backgroundColor: tokens.accent }]}
            onPress={handleSaveEvaluation}
            disabled={savingEvaluation}
          >
            {savingEvaluation ? (
              <ActivityIndicator size="small" color={tokens.bg} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={tokens.bg} />
                <CoachText variant="body" style={[styles.saveBtnText, { color: tokens.bg }]}>
                  Enregistrer l’évaluation
                </CoachText>
              </>
            )}
          </PressableSpring>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: proRadius.lg,
    padding: 14,
    backgroundColor: 'transparent',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: proRadius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  ratingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ratingIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  ratingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreBadge: {
    minWidth: 54,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  scoreText: {
    fontWeight: '800',
    fontSize: 14,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textArea: {
    borderRadius: proRadius.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputField: {
    borderRadius: proRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: proForm.fieldHeight,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  switchTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  microBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addObjectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minHeight: 32,
  },
  objectiveFormBox: {
    padding: 12,
    borderRadius: proRadius.md,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  progressPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveObjectiveCta: {
    marginTop: 12,
    height: 44,
    borderRadius: proRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveObjectiveCtaText: {
    fontWeight: '700',
    fontSize: 13,
  },
  emptyObjectivesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  objectiveCard: {
    borderRadius: proRadius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  objectiveCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  objectiveTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  objectiveProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressQuickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: proRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: proRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
