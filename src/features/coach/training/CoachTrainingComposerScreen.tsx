import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import type { TranslateFn } from '../../../i18n/types';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { TrainingText as CoachText, useCoachTrainingTheme } from './coachTrainingTheme';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { teamEventsService } from '../../../services/teamEvents.service';
import { usersService } from '../../../services/users.service';
import { membershipsService } from '../../../services/memberships.service';
import { teamsService } from '../../../services/teams.service';
import { buildCoachSquadPlayers } from '../../../utils/coachSquadRoster';
import { spacing } from '../../../theme/designTokens';
import { Icon } from '../../../components/ui/Icon';
import {
  LIBRARY_CATEGORIES,
  categoryLabel,
  searchLibrary,
  type LibraryCategoryId,
  type LibraryExercise,
} from './trainingLibrary';
import { ExerciseYouTubePlayer } from '../../../components/video/ExerciseYouTubePlayer';
import { TacticalSchemaPreview } from './TacticalSchemaPreview';
import { CoachTacticalSchemaEditor } from './CoachTacticalSchemaEditor';
import {
  TACTICAL_STARTER_SCHEMAS,
  tacticalSceneForCustomExercise,
  tacticalSceneForLibraryExercise,
} from '../../tactics/engine/tacticalStarterSchemas';
import type { TacticalScene } from '../../tactics/engine/tacticalTimeline';
import {
  TRAINING_DURATION_MAX,
  TRAINING_DURATION_MIN,
  TRAINING_EXERCISE_MINUTES_MAX,
  TRAINING_PHASE_LABELS,
  emptyTrainingDraft,
  exercisesTotalMinutes,
  toCreateTrainingEventInput,
  todayIsoDate,
  type TrainingDraft,
  type TrainingDraftExercise,
  type TrainingPhase,
} from './trainingDraft';
import { useCoachWorkspace } from '../shell/CoachWorkspaceContext';
import { coachPaneBottomPad } from '../theme/coachDesignSystem';

const DURATION_CHOICES = [60, 75, 90, 105, 120];

export type ComposerStep =
  | 'seance'
  | 'objectifs'
  | 'duree'
  | 'effectif'
  | 'exercices'
  | 'organisation';

function buildStepsOrder(t: TranslateFn): Array<{ id: ComposerStep; label: string; icon: string }> {
  return [
  { id: 'seance', label: t('club.trainings.seance'), icon: 'document-text' },
  { id: 'objectifs', label: 'Objectif', icon: 'trophy' },
  { id: 'duree', label: t('coach.composer.duree'), icon: 'timer' },
  { id: 'effectif', label: 'Effectif', icon: 'people' },
  { id: 'exercices', label: 'Exercices', icon: 'football' },
  { id: 'organisation', label: 'Validation', icon: 'checkmark-circle' },
];
}

type Props = {
  onDone?: (eventId: string) => void;
  onCancel?: () => void;
  initialDraft?: TrainingDraft;
  initialStep?: ComposerStep;
  maxPlayers?: number;
  source?: 'ai' | 'free' | 'wizard';
};

export function CoachTrainingComposerScreen({
  onDone,
  onCancel,
  initialDraft,
  initialStep,
  maxPlayers,
  source,
}: Props) {
  const { t } = useTranslation();
  const STEPS_ORDER = useMemo(() => buildStepsOrder(t), [t]);
  const { tokens, teamName } = useCoachTrainingTheme();
  const workspace = useCoachWorkspace();
  const profile = useSessionProfile();
  const clubId = profile?.profile?.club_id;
  const styles = useMemo(
    () => createStyles(tokens, workspace.desktop),
    [tokens, workspace.desktop],
  );

  const [currentStep, setCurrentStep] = useState<ComposerStep>(() => initialStep ?? (initialDraft ? 'organisation' : 'seance'));
  const [draft, setDraft] = useState<TrainingDraft>(() => initialDraft ?? emptyTrainingDraft(todayIsoDate()));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Effectif du club
  const [members, setMembers] = useState<Array<{ uid: string; display_name: string; number?: number; role?: string }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Bibliothèque : Module actif (échauffement, technique, etc.)
  const [selectedModule, setSelectedModule] = useState<LibraryCategoryId>('echauffement');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [expandedVideoIds, setExpandedVideoIds] = useState<Record<string, boolean>>({});
  // Atelier actuellement sélectionné dans l'étape d'organisation
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);

  // Constructeur d'exercice personnalisé complet
  const [customName, setCustomName] = useState('');
  const [customMinutes, setCustomMinutes] = useState('15');
  const [customPhase, setCustomPhase] = useState<TrainingPhase>('main');
  const [customObjective, setCustomObjective] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customScene, setCustomScene] = useState<TacticalScene | null>(null);
  const [customErrors, setCustomErrors] = useState<string[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showTacticalEditor, setShowTacticalEditor] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setMembersLoading(true);

    Promise.all([
      usersService.listMembersByClubId(clubId),
      membershipsService.listByClub(clubId),
      teamsService.listByClubId(clubId),
    ])
      .then(([clubMembers, memberships, teams]) => {
        if (cancelled) return;
        const roster = buildCoachSquadPlayers({
          members: clubMembers,
          memberships,
          teams,
          event: null,
        });
        setMembers(
          roster
            .filter((player) => player.id !== profile?.uid)
            .map((player) => ({
              uid: player.id,
              display_name: player.name,
              number: player.num ?? undefined,
              role: player.pos ?? undefined,
            })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clubId, profile?.uid]);

  const update = (patch: Partial<TrainingDraft>) =>
    setDraft((curr) => ({ ...curr, ...patch }));

  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Sélection rapide / désélection des joueurs avec respect du plafond IA si défini
  const isAiRestricted = source === 'ai' && typeof maxPlayers === 'number' && maxPlayers > 0;

  const togglePlayer = (uid: string) => {
    setLimitWarning(null);
    setDraft((curr) => {
      const alreadySelected = curr.inviteeUids.includes(uid);
      if (alreadySelected) {
        return {
          ...curr,
          inviteeUids: curr.inviteeUids.filter((id) => id !== uid),
        };
      }
      if (isAiRestricted && curr.inviteeUids.length >= maxPlayers) {
        setLimitWarning(`Séance IA configurée pour ${maxPlayers} joueur${maxPlayers > 1 ? 's' : ''} maximum. Décochez un joueur pour en ajouter un autre.`);
        return curr;
      }
      return {
        ...curr,
        inviteeUids: [...curr.inviteeUids, uid],
      };
    });
  };

  const selectAllPlayers = () => {
    setLimitWarning(null);
    if (isAiRestricted && members.length > maxPlayers) {
      // Sélectionne les N premiers joueurs jusqu'au plafond
      setDraft((curr) => ({
        ...curr,
        inviteeUids: members.slice(0, maxPlayers).map((m) => m.uid),
      }));
      setLimitWarning(`Séance IA limitée à ${maxPlayers} joueurs : les ${maxPlayers} premiers joueurs ont été sélectionnés.`);
    } else {
      setDraft((curr) => ({
        ...curr,
        inviteeUids: members.map((m) => m.uid),
      }));
    }
  };

  const deselectAllPlayers = () => {
    setLimitWarning(null);
    setDraft((curr) => ({
      ...curr,
      inviteeUids: [],
    }));
  };

  // Ajout depuis la bibliothèque
  const handleAddLibraryExercise = (ex: LibraryExercise) => {
    const id = `ex_${Date.now()}_${draft.exercises.length}`;
    const scene =
      (ex.schemaId ? TACTICAL_STARTER_SCHEMAS.find((s) => s.id === ex.schemaId)?.scene : undefined) ??
      tacticalSceneForLibraryExercise(ex.id) ??
      tacticalSceneForCustomExercise(ex.name, ex.instructions);

    const newEx: TrainingDraftExercise = {
      id,
      name: ex.name,
      minutes: ex.defaultMinutes,
      phase: ex.phase,
      objective: ex.objective,
      instructions: ex.instructions,
      youtubeId: ex.youtubeId,
      tacticalScene: scene,
    };
    update({ exercises: [...draft.exercises, newEx] });
  };

  // Ajout d'exercice personnalisé
  const handleSaveCustomExercise = () => {
    if (!customName.trim()) {
      setCustomErrors([t('coach.composer.veuillez.donner.un.nom.a.votre')]);
      return;
    }
    const mins = Number.parseInt(customMinutes, 10);
    if (Number.isNaN(mins) || mins < 1 || mins > TRAINING_EXERCISE_MINUTES_MAX) {
      setCustomErrors([`La durée doit être comprise entre 1 et ${TRAINING_EXERCISE_MINUTES_MAX} min.`]);
      return;
    }

    const id = `ex_custom_${Date.now()}`;
    const newEx: TrainingDraftExercise = {
      id,
      name: customName.trim(),
      minutes: mins,
      phase: customPhase,
      objective: customObjective.trim() || undefined,
      instructions: customInstructions.trim() || undefined,
      youtubeId: customYoutubeUrl.trim() || undefined,
      tacticalScene: customScene ?? tacticalSceneForCustomExercise(customName.trim(), customInstructions.trim()),
    };

    update({ exercises: [...draft.exercises, newEx] });
    setCustomName('');
    setCustomObjective('');
    setCustomInstructions('');
    setCustomYoutubeUrl('');
    setCustomScene(null);
    setCustomErrors([]);
    setShowCustomModal(false);
  };

  const removeExercise = (index: number) => {
    update({ exercises: draft.exercises.filter((_, i) => i !== index) });
  };

  const moveExercise = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= draft.exercises.length) return;
    const next = [...draft.exercises];
    [next[index], next[target]] = [next[target], next[index]];
    update({ exercises: next });
  };

  // Enregistrement final
  const handleLaunchSession = async () => {
    if (!profile) {
      setErrors([t('coach.composer.connectez.vous.pour.enregistrer.cette.seance')]);
      return;
    }
    const result = toCreateTrainingEventInput(draft, {
      uid: profile.uid,
      name: profile.display_name ?? 'Coach',
      clubId,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    setErrors([]);
    try {
      const eventId = await teamEventsService.create(result.input);
      onDone?.(eventId);
    } catch {
      setErrors([t('coach.composer.impossible.d.enregistrer.la.seance.verifiez')]);
    } finally {
      setSaving(false);
    }
  };

  // Navigation dans les étapes
  const currentIndex = STEPS_ORDER.findIndex((s) => s.id === currentStep);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEPS_ORDER.length - 1;

  const goNext = () => {
    setErrors([]);
    if (currentStep === 'seance' && !draft.title.trim()) {
      setErrors([t('coach.composer.veuillez.indiquer.un.titre.pour.votre')]);
      return;
    }
    if (canGoNext) {
      setCurrentStep(STEPS_ORDER[currentIndex + 1].id);
    }
  };

  const goBack = () => {
    setErrors([]);
    if (canGoBack) {
      setCurrentStep(STEPS_ORDER[currentIndex - 1].id);
    } else {
      onCancel?.();
    }
  };

  // Exercices filtrés par le module actif
  const moduleExercises = useMemo(() => {
    return searchLibrary('', selectedModule);
  }, [selectedModule]);

  return (
    <View style={styles.root} testID="coach-training-composer">
      {/* Barre de navigation d'étapes (Stepper visuel) */}
      <View style={styles.stepperContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperContent}
        >
          {STEPS_ORDER.map((item, index) => {
            const isActive = item.id === currentStep;
            const isCompleted = index < currentIndex;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentStep(item.id)}
                style={[
                  styles.stepTab,
                  isActive && styles.stepTabActive,
                  isCompleted && styles.stepTabCompleted,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Étape ${index + 1} : ${item.label}`}
              >
                <View style={[styles.stepIconWrap, isActive && styles.stepIconWrapActive]}>
                  <Icon
                    name={item.icon as any}
                    size={16}
                    color={isActive ? tokens.onAccent : isCompleted ? tokens.accent : tokens.muted}
                  />
                </View>
                <CoachText
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                >
                  {index + 1}. {item.label}
                </CoachText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Corps dynamique de l'étape courante */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ÉTAPE 1 : LA SÉANCE */}
        {currentStep === 'seance' && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <CoachText variant="caption" accent>ÉTAPE 1 / 6</CoachText>
              <CoachText variant="title">Détails de la séance</CoachText>
              <CoachText muted>Nommez votre séance et planifiez sa date et son lieu.</CoachText>
            </View>

            <View style={styles.cardBox}>
              <Field
                label={t('coach.composer.titre.de.la.seance')}
                placeholder={t('coach.composer.ex.seance.de.perfectionnement.finition')}
                value={draft.title}
                onChangeText={(title) => update({ title })}
                tokens={tokens}
              />
              <View style={styles.rowTwoCols}>
                <Field
                  label="Date (AAAA-MM-JJ)"
                  placeholder="2026-10-18"
                  value={draft.date}
                  onChangeText={(date) => update({ date })}
                  tokens={tokens}
                />
                <Field
                  label="Heure de rendez-vous"
                  placeholder="18:30"
                  value={draft.time}
                  onChangeText={(time) => update({ time })}
                  tokens={tokens}
                />
              </View>
              <Field
                label={t('coach.composer.lieu.ou.terrain')}
                placeholder="Ex. Stade municipal - Terrain d'Honneur"
                value={draft.locationLabel}
                onChangeText={(locationLabel) => update({ locationLabel })}
                tokens={tokens}
              />
              <Field
                label="Ville"
                placeholder="Ex. Corbeil-Essonnes"
                value={draft.city}
                onChangeText={(city) => update({ city })}
                tokens={tokens}
              />
            </View>
          </View>
        )}

        {/* ÉTAPE 2 : OBJECTIF */}
        {currentStep === 'objectifs' && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <CoachText variant="caption" accent>ÉTAPE 2 / 6</CoachText>
              <CoachText variant="title">Objectif & Consignes</CoachText>
              <CoachText muted>Quel est le focus tactique et pédagogique de cette séance ?</CoachText>
            </View>

            <View style={styles.cardBox}>
              <Field
                label="Objectif principal"
                placeholder={t('coach.composer.ex.travail.de.la.transition.offensive')}
                value={draft.focus}
                onChangeText={(focus) => update({ focus })}
                tokens={tokens}
              />
              <Field
                label={t('coach.composer.consignes.et.recommandations.pour.le.groupe')}
                placeholder={t('coach.composer.ex.insister.sur.la.premiere.touche')}
                value={draft.notes}
                multiline
                onChangeText={(notes) => update({ notes })}
                tokens={tokens}
              />
            </View>
          </View>
        )}

        {/* ÉTAPE 3 : DURÉE */}
        {currentStep === 'duree' && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <CoachText variant="caption" accent>ÉTAPE 3 / 6</CoachText>
              <CoachText variant="title">Durée de l'entraînement</CoachText>
              <CoachText muted>Choisissez le temps total imparti pour vos ateliers sur la pelouse.</CoachText>
            </View>

            <View style={styles.cardBox}>
              <View style={styles.durationChoicesRow}>
                {DURATION_CHOICES.map((mins) => {
                  const isSel = draft.durationMin === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => update({ durationMin: mins })}
                      style={[styles.durationCard, isSel && styles.durationCardSelected]}
                      accessibilityRole="button"
                    >
                      <Icon
                        name="timer"
                        size={28}
                        color={isSel ? tokens.accent : tokens.muted}
                      />
                      <CoachText style={[styles.durationNumber, isSel && styles.durationNumberSelected]}>
                        {mins}
                      </CoachText>
                      <CoachText variant="caption" muted={!isSel} accent={isSel}>
                        minutes
                      </CoachText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.durationTipBox}>
                <Icon name="alert-circle" size={18} color={tokens.accent} />
                <CoachText variant="caption" style={{ flex: 1, color: tokens.foreground }}>
                  La durée officielle recommandée par la FFF en séance type est de 75 à 90 minutes pour maintenir un niveau d'intensité maximal.
                </CoachText>
              </View>
            </View>
          </View>
        )}

        {/* ÉTAPE 4 : EFFECTIF & JOUEURS */}
        {currentStep === 'effectif' && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <CoachText variant="caption" accent>ÉTAPE 4 / 6</CoachText>
              <CoachText variant="title">Effectif convoqué</CoachText>
              <CoachText muted>
                {isAiRestricted
                  ? `Séance calibrée par l'IA pour ${maxPlayers} joueurs maximum (${draft.inviteeUids.length}/${maxPlayers} sélectionné(s)).`
                  : `Sélectionnez les joueurs qui participent à cette séance (${draft.inviteeUids.length} sélectionné(s)).`}
              </CoachText>
            </View>

            {limitWarning ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: spacing.sm,
                  backgroundColor: 'rgba(255, 149, 0, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 149, 0, 0.4)',
                  borderRadius: 10,
                  marginBottom: spacing.sm,
                }}
              >
                <Icon name="alert-circle" size={18} color="#FF9500" />
                <CoachText variant="caption" style={{ flex: 1, color: '#FF9500', fontWeight: '600' }}>
                  {limitWarning}
                </CoachText>
              </View>
            ) : null}

            <View style={styles.cardBox}>
              {/* Bouton principal : Sélectionner toute l'équipe (ou jusqu'au quota IA) */}
              <View style={styles.teamSelectHeroBox}>
                <TouchableOpacity
                  onPress={
                    draft.inviteeUids.length > 0 &&
                    (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers))
                      ? deselectAllPlayers
                      : selectAllPlayers
                  }
                  style={[
                    styles.selectAllTeamBtn,
                    draft.inviteeUids.length > 0 &&
                      (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers)) &&
                      styles.selectAllTeamBtnActive,
                  ]}
                  accessibilityRole="button"
                >
                  <Icon
                    name={
                      draft.inviteeUids.length > 0 &&
                      (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers))
                        ? 'checkmark-circle'
                        : 'people'
                    }
                    size={20}
                    color={
                      draft.inviteeUids.length > 0 &&
                      (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers))
                        ? tokens.accent
                        : tokens.onAccent
                    }
                  />
                  <CoachText
                    style={[
                      styles.selectAllTeamBtnText,
                      draft.inviteeUids.length > 0 &&
                        (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers)) &&
                        styles.selectAllTeamBtnActive,
                    ]}
                  >
                    {draft.inviteeUids.length > 0 &&
                    (draft.inviteeUids.length === members.length || (isAiRestricted && draft.inviteeUids.length === maxPlayers))
                      ? t('coach.composer.effectif.complet.selectionne.cliquer.pour.deselectionner')
                      : isAiRestricted && members.length > maxPlayers
                      ? `Sélectionner le quota IA (${maxPlayers} joueurs max)`
                      : `Sélectionner l'équipe entière (${members.length} joueurs)`}
                  </CoachText>
                </TouchableOpacity>

                <View style={styles.playersSubHeaderRow}>
                  <CoachText variant="caption" muted>
                    Ou sélectionnez les joueurs un par un {isAiRestricted ? `(max ${maxPlayers})` : ''} :
                  </CoachText>
                  {draft.inviteeUids.length > 0 ? (
                    <TouchableOpacity onPress={deselectAllPlayers} style={styles.pillSmallBtn}>
                      <CoachText variant="caption" muted>Tout désélectionner</CoachText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {membersLoading ? (
                <CoachText muted style={{ padding: spacing.md, textAlign: 'center' }}>
                  Chargement des joueurs du club…
                </CoachText>
              ) : members.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="people" size={32} color={tokens.muted} />
                  <CoachText muted style={{ textAlign: 'center' }}>
                    Aucun joueur trouvé pour le moment.
                  </CoachText>
                </View>
              ) : (
                <View style={styles.playersGrid}>
                  {members.map((player) => {
                    const isSelected = draft.inviteeUids.includes(player.uid);
                    const isQuotaFull = isAiRestricted && !isSelected && draft.inviteeUids.length >= maxPlayers;
                    return (
                      <TouchableOpacity
                        key={player.uid}
                        onPress={() => togglePlayer(player.uid)}
                        style={[
                          styles.playerCard,
                          isSelected && styles.playerCardSelected,
                          isQuotaFull && { opacity: 0.45 },
                        ]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected, disabled: isQuotaFull }}
                      >
                        <View style={[styles.playerAvatar, isSelected && styles.playerAvatarSelected]}>
                          <CoachText style={[styles.playerAvatarText, isSelected && styles.playerAvatarTextSelected]}>
                            {player.number ? String(player.number) : player.display_name.charAt(0)}
                          </CoachText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <CoachText style={[styles.playerName, isSelected && styles.playerNameSelected]} numberOfLines={1}>
                            {player.display_name}
                          </CoachText>
                          {player.role ? (
                            <CoachText variant="caption" muted={!isSelected} accent={isSelected} numberOfLines={1}>
                              {player.role}
                            </CoachText>
                          ) : null}
                        </View>
                        <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                          {isSelected ? <Icon name="checkmark-circle" size={14} color={tokens.onAccent} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ÉTAPE 5 : EXERCICES PAR MODULES & PERSONNALISATION */}
        {currentStep === 'exercices' && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <CoachText variant="caption" accent>ÉTAPE 5 / 6</CoachText>
              <CoachText variant="title">Choix des ateliers</CoachText>
              <CoachText muted>
                Cliquez sur un module pour afficher ses exercices dédiés, ou créez un atelier sur mesure.
              </CoachText>
            </View>

            {/* Barre des modules cliquables : Échauffement, Technique, Tactique, etc. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modulesScroll}
            >
              {LIBRARY_CATEGORIES.map((cat) => {
                const isSelected = selectedModule === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedModule(cat.id)}
                    style={[styles.moduleTab, isSelected && styles.moduleTabActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Module ${cat.label}`}
                  >
                    <CoachText
                      style={[styles.moduleTabText, isSelected && styles.moduleTabTextActive]}
                    >
                      {cat.label}
                    </CoachText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bouton pour ouvrir la création personnalisée */}
            <TouchableOpacity
              onPress={() => setShowCustomModal(true)}
              style={styles.createCustomBtn}
              accessibilityRole="button"
            >
              <View style={styles.createCustomIconWrap}>
                <Icon name="add" size={20} color={tokens.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <CoachText style={styles.createCustomTitle}>Créer un exercice personnalisé</CoachText>
                <CoachText variant="caption" muted>
                  Définissez vos propres consignes, durée, schéma animé ou lien vidéo YouTube
                </CoachText>
              </View>
              <Icon name="chevron-forward" size={18} color={tokens.muted} />
            </TouchableOpacity>

            {/* Exercices du module actif */}
            <View style={styles.moduleHeading}>
              <CoachText variant="section">
                Ateliers {categoryLabel(selectedModule)} ({moduleExercises.length})
              </CoachText>
            </View>

            <View style={styles.exercisesGrid}>
              {moduleExercises.map((item) => {
                const isExpanded = expandedExerciseId === item.id;
                const isAlreadyInDraft = draft.exercises.some((e) => e.name === item.name);

                return (
                  <View key={item.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseCardHeader}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <CoachText style={styles.exerciseCardName}>{item.name}</CoachText>
                        <CoachText variant="caption" muted>
                          {categoryLabel(item.category)} · {item.defaultMinutes} min · {TRAINING_PHASE_LABELS[item.phase]}
                        </CoachText>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleAddLibraryExercise(item)}
                        style={[
                          styles.addExerciseBtn,
                          isAlreadyInDraft && styles.addExerciseBtnAdded,
                        ]}
                        accessibilityRole="button"
                      >
                        <Icon
                          name={isAlreadyInDraft ? 'checkmark-circle' : 'add'}
                          size={16}
                          color={isAlreadyInDraft ? tokens.accent : tokens.onAccent}
                        />
                        <CoachText
                          style={[
                            styles.addExerciseBtnText,
                            isAlreadyInDraft && styles.addExerciseBtnTextAdded,
                          ]}
                        >
                          {isAlreadyInDraft ? t('coach.composer.ajoute') : 'Ajouter'}
                        </CoachText>
                      </TouchableOpacity>
                    </View>

                    {/* Schéma tactique animé comme élément PRINCIPAL */}
                    {(() => {
                      const scene = tacticalSceneForLibraryExercise(item.id);
                      return scene ? (
                        <View style={{ marginTop: spacing.sm, borderRadius: 12, overflow: 'hidden' }}>
                          <TacticalSchemaPreview scene={scene} />
                        </View>
                      ) : null;
                    })()}

                    {/* Vidéo YouTube en ressource complémentaire optionnelle (repliée par défaut) */}
                    {item.youtubeId ? (
                      <View style={{ marginTop: spacing.xs }}>
                        <TouchableOpacity
                          onPress={() =>
                            setExpandedVideoIds((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            alignSelf: 'flex-start',
                          }}
                          accessibilityRole="button"
                        >
                          <Icon name="videocam" size={14} color={tokens.muted} />
                          <CoachText variant="caption" muted>
                            {expandedVideoIds[item.id]
                              ? t('coach.composer.masquer.la.video.complementaire')
                              : t('coach.composer.voir.la.video.complementaire.optionnel')}
                          </CoachText>
                          <Icon
                            name={expandedVideoIds[item.id] ? 'chevron-up' : 'chevron-down'}
                            size={12}
                            color={tokens.muted}
                          />
                        </TouchableOpacity>

                        {expandedVideoIds[item.id] ? (
                          <View style={styles.videoPreviewSmall}>
                            <ExerciseYouTubePlayer videoIdOrUrl={item.youtubeId} autoPlay={false} />
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Déroulé complet */}
                    <TouchableOpacity
                      onPress={() => setExpandedExerciseId(isExpanded ? null : item.id)}
                      style={styles.expandToggle}
                    >
                      <CoachText variant="caption" accent>
                        {isExpanded ? t('coach.composer.masquer.les.consignes') : t('coach.composer.voir.les.consignes')}
                      </CoachText>
                      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={tokens.accent} />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.exerciseExpandedContent}>
                        <View style={styles.detailRow}>
                          <CoachText variant="caption" accent>OBJECTIF :</CoachText>
                          <CoachText style={{ color: tokens.foreground }}>{item.objective}</CoachText>
                        </View>
                        <View style={styles.detailRow}>
                          <CoachText variant="caption" accent>CONSIGNES :</CoachText>
                          <CoachText style={{ color: tokens.foreground }}>{item.instructions}</CoachText>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ÉTAPE 6 : VALIDATION & ORGANISATION — desktop = layout session (déroulé | preview) */}
        {currentStep === 'organisation' && (() => {
          const activeEx = draft.exercises[activeReviewIndex];
          const activeScene = activeEx
            ? activeEx.tacticalScene ??
              tacticalSceneForLibraryExercise(activeEx.id) ??
              tacticalSceneForCustomExercise(activeEx.name, activeEx.instructions)
            : null;
          const deroule = (
            <View style={styles.sessionDeroule}>
              <View style={styles.stepHeader}>
                <CoachText variant="caption" accent>ÉTAPE 6 / 6</CoachText>
                <CoachText variant="title">Organisation & Validation</CoachText>
                <CoachText muted>
                  Vérifiez le déroulement ({exercisesTotalMinutes(draft)} min / {draft.durationMin} min).
                </CoachText>
              </View>

              <View style={styles.cardBox}>
                <View style={styles.recapBanner}>
                  <View>
                    <CoachText style={{ fontWeight: '800', fontSize: 16, color: tokens.foreground }}>
                      {draft.focus || draft.title || t('coach.composer.seance.prete.a.adapter')}
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {draft.durationMin} minutes · {draft.locationLabel || t('coach.composer.terrain.du.club')}
                    </CoachText>
                  </View>
                  <View style={styles.recapBadge}>
                    <CoachText style={{ color: tokens.accent, fontWeight: '700', fontSize: 12 }}>
                      {draft.inviteeUids.length} joueurs convoqués
                    </CoachText>
                  </View>
                </View>

                <View style={styles.derouleHeader}>
                  <CoachText variant="section" style={{ marginVertical: 0 }}>
                    Déroulé ({draft.exercises.length})
                  </CoachText>
                  <TouchableOpacity
                    onPress={() => setCurrentStep('exercices')}
                    style={styles.addExercisePill}
                    accessibilityRole="button"
                    accessibilityLabel={t('coach.composer.ajouter.un.exercice')}
                  >
                    <Icon name="add" size={16} color={tokens.accent} />
                    <CoachText style={{ color: tokens.accent, fontWeight: '700', fontSize: 13 }}>
                      Ajouter un exercice
                    </CoachText>
                  </TouchableOpacity>
                </View>

                {draft.exercises.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <CoachText muted>Ajoutez des exercices depuis la bibliothèque.</CoachText>
                  </View>
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    {draft.exercises.map((ex, index) => {
                      const isCurrent = activeReviewIndex === index;
                      return (
                        <TouchableOpacity
                          key={ex.id}
                          onPress={() => setActiveReviewIndex(index)}
                          style={[
                            styles.selectedExerciseRow,
                            isCurrent && styles.selectedExerciseRowActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Atelier ${index + 1} : ${ex.name}`}
                        >
                          <View
                            style={[
                              styles.selectedOrderBadge,
                              !isCurrent && { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                            ]}
                          >
                            <CoachText
                              style={{
                                color: isCurrent ? tokens.onAccent : tokens.foreground,
                                fontWeight: '800',
                                fontSize: 12,
                              }}
                            >
                              {index + 1}
                            </CoachText>
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <CoachText
                              style={{
                                fontWeight: '700',
                                color: isCurrent ? tokens.accent : tokens.foreground,
                                fontSize: 14,
                              }}
                            >
                              {ex.name}
                            </CoachText>
                            <CoachText variant="caption" muted>
                              {TRAINING_PHASE_LABELS[ex.phase]} · {ex.minutes} minutes
                            </CoachText>
                          </View>
                          <View style={styles.reorderButtonsGroup}>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                moveExercise(index, -1);
                                if (activeReviewIndex === index && index > 0) setActiveReviewIndex(index - 1);
                              }}
                              disabled={index === 0}
                              style={[styles.reorderBtn, index === 0 && { opacity: 0.3 }]}
                            >
                              <Icon name="arrow-up" size={14} color={tokens.foreground} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                moveExercise(index, 1);
                                if (activeReviewIndex === index && index < draft.exercises.length - 1) {
                                  setActiveReviewIndex(index + 1);
                                }
                              }}
                              disabled={index === draft.exercises.length - 1}
                              style={[
                                styles.reorderBtn,
                                index === draft.exercises.length - 1 && { opacity: 0.3 },
                              ]}
                            >
                              <Icon name="arrow-down" size={14} color={tokens.foreground} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                removeExercise(index);
                                if (activeReviewIndex >= draft.exercises.length - 1) {
                                  setActiveReviewIndex(Math.max(0, draft.exercises.length - 2));
                                }
                              }}
                              style={styles.deleteExBtn}
                            >
                              <Icon name="trash" size={14} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );

          const preview = (
            <View style={styles.sessionPreview} testID="composer-session-preview">
              <CoachText variant="section">Prévisualisation de l’atelier</CoachText>
              <CoachText muted style={{ marginBottom: spacing.sm }}>
                {activeEx
                  ? `${activeEx.name} · ${activeEx.minutes} min`
                  : t('coach.composer.selectionnez.un.atelier.a.gauche')}
              </CoachText>
              {activeScene ? <TacticalSchemaPreview scene={activeScene} /> : null}
              {activeEx?.instructions ? (
                <>
                  <CoachText variant="section" style={{ marginTop: spacing.md }}>
                    Consignes du coach
                  </CoachText>
                  <CoachText>{activeEx.instructions}</CoachText>
                </>
              ) : null}
            </View>
          );

          return (
            <View
              style={[styles.stepSection, workspace.desktop && styles.desktopTrainingLayout]}
              testID="composer-organisation-desktop"
            >
              {deroule}
              {preview}
            </View>
          );
        })()}

        {/* Affichage des erreurs éventuelles */}
        {errors.map((msg, i) => (
          <CoachText key={i} style={styles.errorText}>
            {msg}
          </CoachText>
        ))}
      </ScrollView>

      {/* Barre d'action inférieure (Retour / Suivant / Lancer) */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.footerBackBtn}
          accessibilityRole="button"
        >
          <CoachText>{canGoBack ? t('coach.composer.precedent') : 'Quitter'}</CoachText>
        </TouchableOpacity>

        {currentStep === 'organisation' ? (
          <TouchableOpacity
            onPress={handleLaunchSession}
            disabled={saving || draft.exercises.length === 0}
            style={[
              styles.footerNextBtn,
              (saving || draft.exercises.length === 0) && { opacity: 0.5 },
            ]}
            accessibilityRole="button"
          >
            <CoachText style={styles.footerNextBtnText}>
              {saving ? 'Enregistrement…' : t('coach.composer.enregistrer.et.valider.la.seance')}
            </CoachText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={goNext}
            style={styles.footerNextBtn}
            accessibilityRole="button"
          >
            <CoachText style={styles.footerNextBtnText}>Continuer</CoachText>
            <Icon name="chevron-forward" size={16} color={tokens.onAccent} />
          </TouchableOpacity>
        )}
      </View>

      {/* MODALE D'AJOUT D'EXERCICE PERSONNALISÉ VRAIMENT PERSONNALISABLE */}
      {showCustomModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <CoachText variant="title">Créer un atelier personnalisé</CoachText>
                <CoachText variant="caption" muted>Personnalisez entièrement les consignes et le schéma</CoachText>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={20} color={tokens.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Field
                label="Nom de l'atelier"
                placeholder={t('coach.composer.ex.vague.dattaque.3.contre.2')}
                value={customName}
                onChangeText={setCustomName}
                tokens={tokens}
              />

              <View style={styles.rowTwoCols}>
                <Field
                  label={t('coach.composer.duree.minutes')}
                  placeholder="15"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  tokens={tokens}
                />
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" muted style={{ marginBottom: 6 }}>Phase de jeu</CoachText>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['warmup', 'main', 'game'] as TrainingPhase[]).map((p) => {
                      const isSel = customPhase === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setCustomPhase(p)}
                          style={[styles.smallPhasePill, isSel && styles.smallPhasePillSelected]}
                        >
                          <CoachText
                            variant="caption"
                            style={{
                              color: isSel ? tokens.accent : tokens.muted,
                              fontWeight: isSel ? '700' : '500',
                            }}
                          >
                            {TRAINING_PHASE_LABELS[p]}
                          </CoachText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <Field
                label={t('coach.composer.objectif.pedagogique')}
                placeholder={t('coach.composer.ex.ameliorer.la.prise.de.decision')}
                value={customObjective}
                onChangeText={setCustomObjective}
                tokens={tokens}
              />

              <Field
                label={t('coach.composer.consignes.detaillees.regles')}
                placeholder={t('coach.composer.ex.3.attaquants.partent.du.milieu')}
                value={customInstructions}
                multiline
                onChangeText={setCustomInstructions}
                tokens={tokens}
              />

              <Field
                label={t('coach.composer.lien.video.youtube.optionnel')}
                placeholder="Ex. https://www.youtube.com/watch?v=..."
                value={customYoutubeUrl}
                onChangeText={setCustomYoutubeUrl}
                tokens={tokens}
              />

              {/* Bouton pour tracer le schéma animé sur le terrain */}
              <TouchableOpacity
                onPress={() => setShowTacticalEditor(true)}
                style={styles.drawSchemaBtn}
              >
                <Icon name="create-outline" size={20} color={tokens.accent} />
                <View style={{ flex: 1 }}>
                  <CoachText style={{ fontWeight: '700', color: tokens.foreground }}>
                    {customScene ? t('coach.composer.modifier.le.schema.tactique.trace') : t('coach.composer.tracer.le.schema.anime.sur.le')}
                  </CoachText>
                  <CoachText variant="caption" muted>
                    Placez des plots, ballons et trajectoires de passes
                  </CoachText>
                </View>
                <Icon name="chevron-forward" size={16} color={tokens.muted} />
              </TouchableOpacity>

              {customScene ? (
                <View style={{ marginTop: spacing.xs, borderRadius: 12, overflow: 'hidden' }}>
                  <TacticalSchemaPreview scene={customScene} />
                </View>
              ) : null}

              {/* Erreurs de validation de l'exercice personnalisé */}
              {customErrors.map((msg, i) => (
                <CoachText key={i} style={[styles.errorText, { marginTop: 4 }]}>
                  {msg}
                </CoachText>
              ))}

              <TouchableOpacity
                onPress={handleSaveCustomExercise}
                style={styles.saveCustomSubmitBtn}
              >
                <CoachText style={{ color: tokens.onAccent, fontWeight: '800' }}>
                  Ajouter cet atelier à la séance
                </CoachText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ÉDITEUR TACTIQUE PLEIN ÉCRAN */}
      {showTacticalEditor && (
        <View style={styles.fullscreenEditorWrapper}>
          <CoachTacticalSchemaEditor
            initialScene={customScene ?? undefined}
            onSave={(scene) => {
              setCustomScene(scene);
              setShowTacticalEditor(false);
            }}
            onCancel={() => setShowTacticalEditor(false)}
          />
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  tokens,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  tokens: ReturnType<typeof useCoachTrainingTheme>['tokens'];
}) {
  return (
    <View style={fieldStyles.field}>
      <CoachText variant="caption" muted>{label}</CoachText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        multiline={multiline}
        style={[
          fieldStyles.input,
          {
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.foreground,
          },
          multiline && fieldStyles.multiline,
        ]}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  multiline: {
    minHeight: 88,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
});

function createStyles(
  tokens: ReturnType<typeof useCoachTrainingTheme>['tokens'],
  desktop = false,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    desktopTrainingLayout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    sessionDeroule: {
      flex: desktop ? 0.85 : 1,
      minWidth: desktop ? 280 : 0,
      width: '100%',
      gap: spacing.sm,
    },
    sessionPreview: {
      flex: desktop ? 1.4 : 1,
      minWidth: 0,
      width: '100%',
      borderRadius: 22,
      padding: 22,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: spacing.sm,
      marginTop: desktop ? 0 : spacing.md,
    },
    derouleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    addExercisePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: 'rgba(57, 255, 20, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(57, 255, 20, 0.35)',
    },
    selectedExerciseRowActive: {
      borderColor: tokens.accent,
      backgroundColor: 'rgba(57, 255, 20, 0.06)',
    },
    stepperContainer: {
      backgroundColor: tokens.surface,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
      paddingVertical: spacing.xs,
    },
    stepperContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    stepTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'transparent',
    },
    stepTabActive: {
      backgroundColor: 'rgba(0, 230, 118, 0.15)',
    },
    stepTabCompleted: {
      backgroundColor: 'transparent',
    },
    stepIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    stepIconWrapActive: {
      backgroundColor: tokens.accent,
    },
    stepLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.muted,
    },
    stepLabelActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    stepLabelCompleted: {
      color: tokens.foreground,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: spacing.md,
      maxWidth: 900,
      width: '100%',
      alignSelf: 'center',
      paddingBottom: coachPaneBottomPad({ desktop, extra: spacing.xl }),
    },
    stepSection: {
      gap: spacing.md,
    },
    stepHeader: {
      gap: 4,
      marginBottom: spacing.xs,
    },
    cardBox: {
      backgroundColor: tokens.surface,
      borderRadius: 20,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    rowTwoCols: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    durationChoicesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    durationCard: {
      flex: 1,
      minWidth: 90,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      gap: 4,
    },
    durationCardSelected: {
      borderColor: tokens.accent,
      backgroundColor: 'rgba(0, 230, 118, 0.10)',
    },
    durationNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: tokens.foreground,
    },
    durationNumberSelected: {
      color: tokens.accent,
    },
    durationTipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 230, 118, 0.06)',
    },
    teamSelectHeroBox: {
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    selectAllTeamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: tokens.accent,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
    },
    selectAllTeamBtnActive: {
      backgroundColor: 'rgba(0, 230, 118, 0.12)',
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    selectAllTeamBtnText: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 14,
    },
    selectAllTeamBtnTextActive: {
      color: tokens.accent,
    },
    playersSubHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    pillSmallBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    playersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '49%',
      minWidth: 150,
      padding: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      gap: 8,
    },
    playerCardSelected: {
      backgroundColor: 'rgba(0, 230, 118, 0.12)',
      borderColor: tokens.accent,
    },
    playerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    playerAvatarSelected: {
      backgroundColor: tokens.accent,
    },
    playerAvatarText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    playerAvatarTextSelected: {
      color: tokens.onAccent,
    },
    playerName: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.foreground,
    },
    playerNameSelected: {
      fontWeight: '700',
      color: tokens.accent,
    },
    checkCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleSelected: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    modulesScroll: {
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    moduleTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    moduleTabActive: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    moduleTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.muted,
    },
    moduleTabTextActive: {
      color: tokens.onAccent,
      fontWeight: '800',
    },
    createCustomBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 230, 118, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(0, 230, 118, 0.3)',
      marginTop: spacing.sm,
    },
    createCustomIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createCustomTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
    },
    moduleHeading: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    exercisesGrid: {
      gap: spacing.sm,
    },
    exerciseCard: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      gap: spacing.xs,
    },
    exerciseCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    exerciseCardName: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
    },
    addExerciseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    addExerciseBtnAdded: {
      backgroundColor: 'rgba(0, 230, 118, 0.12)',
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    addExerciseBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: tokens.onAccent,
    },
    addExerciseBtnTextAdded: {
      color: tokens.accent,
    },
    videoPreviewSmall: {
      marginTop: spacing.xs,
      borderRadius: 12,
      overflow: 'hidden',
    },
    expandToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 4,
    },
    exerciseExpandedContent: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
      gap: spacing.xs,
    },
    detailRow: {
      gap: 2,
    },
    recapBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    recapBadge: {
      backgroundColor: 'rgba(0, 230, 118, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    selectedExerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      marginBottom: spacing.xs,
    },
    selectedOrderBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderButtonsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reorderBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteExBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: 'rgba(255, 59, 48, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    emptyBox: {
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    errorText: {
      color: '#FF453A',
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    footerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: tokens.surface,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
      gap: spacing.md,
    },
    footerBackBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    footerNextBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: tokens.accent,
    },
    footerNextBtnText: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 14,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    fullscreenEditorWrapper: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.bg,
      zIndex: 10000,
    },
    modalCard: {
      width: '100%',
      maxWidth: 580,
      maxHeight: '90%',
      backgroundColor: tokens.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    modalContent: {
      padding: spacing.md,
      gap: spacing.xs,
    },
    smallPhasePill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    smallPhasePillSelected: {
      borderColor: tokens.accent,
      backgroundColor: 'rgba(0, 230, 118, 0.10)',
    },
    drawSchemaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 230, 118, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(0, 230, 118, 0.25)',
      marginVertical: spacing.xs,
    },
    saveCustomSubmitBtn: {
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: spacing.sm,
    },
  });
}
