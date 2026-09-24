/**
 * Entraînements — planificateur de séance du coach.
 *
 * Refonte : la page ne présente plus une « séance N°48 » fictive avec un RPE
 * inventé et un « générateur IA » simulé. Tout ce qui est affiché vient des
 * données du coach : équipe active, effectif conviable (adhésions réelles),
 * prochaine séance du calendrier (créée via `teamEventsService`), et génération
 * Copilote **réelle** (`aiTrainingService` + repli local partagé). La
 * bibliothèque d'ateliers est le même contenu pédagogique, déplacé dans le
 * modèle pur `utils/coachTrainingPlanner`.
 *
 * Le socle de forme est celui du pôle (`professionalDesign` + tokens) : zéro
 * couleur littérale, comme les autres écrans convertis.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import {
  CoachChapterScroll,
} from '../../components/coach/coachPortalUi';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';
import {
  CoachTrainingDrillDiagram,
  type DrillType,
} from '../../components/coach/CoachTrainingDrillDiagram';
import { CoachDiagramViewerModal } from '../../components/coach/diagram/CoachDiagramViewerModal';
import { CoachDiagramEditorModal } from '../../components/coach/diagram/CoachDiagramEditorModal';
import { coachDiagramsService } from '../../services/coachDiagrams.service';
import { createPresetDiagram, type ExerciseDiagramData } from '../../models/ExerciseDiagram';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usersService } from '../../services/users.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { aiTrainingService } from '../../services/aiTraining.service';
import {
  composedPlanFromPrompt,
  type ParsedCoachSessionPrompt,
} from '../../utils/coachSessionPrompt';
import { defaultRecommendedSessionStart } from '../../utils/coachTrainingRecommendation';
import {
  INTENSITY_LABELS,
  THEMATIC_DRILLS_LIBRARY,
  defaultSession,
  fromTemplate,
  sessionExercisesFromPhases,
  sessionExercisesFromPlan,
  sessionSummary,
  type SessionExercise,
  type SessionIntensity,
  type ThematicDrillTemplate,
} from '../../utils/coachTrainingPlanner';
import { proForm, proRadius, proSemantic, proSpace, proType } from '../../theme/professionalDesign';
import { withAlpha } from '../../components/navigation/tabBarShared';
import type { CoachComponentTokens } from '../../features/coach/theme/coachPitchTokens';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';

const DRILL_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'custom', label: 'Mes schémas' },
  { id: 'activation', label: 'Échauffement' },
  { id: 'rondo', label: 'Rondos' },
  { id: 'circuit', label: 'Circuits' },
  { id: 'finishing', label: 'Finition' },
  { id: 'pressing', label: 'Pressing' },
  { id: 'set_pieces', label: 'Coups Arrêtés' },
];

const AI_SUGGESTIONS = [
  'Pressing haut 4v3',
  'Transition rapide axiale',
  'Finition 2v1 couloirs',
];

/** Type de atelier sélectionnable — sous-union affichable en puces. */
const DRILL_TYPES: DrillType[] = ['rondo', 'circuit', 'finishing', 'possession', 'pressing', 'generic'];

const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  rondo: 'Rondo',
  circuit: 'Circuit',
  finishing: 'Finition',
  possession: 'Possession',
  pressing: 'Pressing',
  generic: 'Atelier',
};

const INTENSITY_TONE: Record<SessionIntensity, string> = {
  low: proSemantic.success,
  medium: proSemantic.warning,
  high: proSemantic.danger,
};

export const CoachTrainingPlannerScreen: React.FC = () => {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const { width: winWidth } = useWindowDimensions();
  const cardPitchW = Math.max(260, Math.min(winWidth - 56, 460));
  const cardPitchH = Math.round((cardPitchW * 64) / 100);
  const profile = useSessionProfile();
  const clubId = profile?.profile.club_id ?? null;

  // ——— Données réelles : effectif conviable + prochaine séance ———
  const [players, setPlayers] = useState<User[]>([]);
  const [nextSession, setNextSession] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clubId) {
      setPlayers([]);
      setNextSession(null);
      setLoading(false);
      return;
    }
    try {
      const [memberList, eventList] = await Promise.all([
        usersService.listMembersByClubId(clubId),
        teamEventsService.listForClub(clubId, 60),
      ]);
      setPlayers(memberList.filter((member) => member.role === 'player'));
      const now = Date.now();
      setNextSession(
        eventList
          .filter((event) => event.event_type === 'training' && event.starts_at.getTime() >= now)
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null,
      );
    } catch {
      setPlayers([]);
      setNextSession(null);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // ——— Séance en cours d'édition ———
  const [exercises, setExercises] = useState<SessionExercise[]>(() => defaultSession());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ——— Schémas d'exercice : Visualiseur, Présentation & Créateur ———
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerDiagram, setViewerDiagram] = useState<ExerciseDiagramData | null>(null);
  const [viewerExercise, setViewerExercise] = useState<SessionExercise | null>(null);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorDiagram, setEditorDiagram] = useState<ExerciseDiagramData | null>(null);
  const [editorTargetExerciseId, setEditorTargetExerciseId] = useState<string | null>(null);
  const [customDiagrams, setCustomDiagrams] = useState<ExerciseDiagramData[]>([]);

  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSource, setAiSource] = useState<'cloud' | 'local' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => sessionSummary(exercises), [exercises]);
  const playerCount = players.length;

  const loadCustomDiagrams = useCallback(async () => {
    if (!profile) return;
    try {
      const list = await coachDiagramsService.listDiagrams({
        uid: profile.uid,
        clubId: clubId || undefined,
      });
      setCustomDiagrams(list);
    } catch {
      setCustomDiagrams([]);
    }
  }, [profile, clubId]);

  React.useEffect(() => {
    void loadCustomDiagrams();
  }, [loadCustomDiagrams]);

  const updateExercise = useCallback((id: string, patch: Partial<SessionExercise>) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const handleOpenViewer = useCallback(
    (exercise: SessionExercise) => {
      const diag =
        exercise.diagram ||
        createPresetDiagram(exercise.drillType, exercise.name, profile?.uid || 'coach-local');
      setViewerDiagram(diag);
      setViewerExercise(exercise);
      setViewerVisible(true);
    },
    [profile?.uid],
  );

  const handleOpenEditor = useCallback(
    (exercise: SessionExercise) => {
      const diag =
        exercise.diagram ||
        createPresetDiagram(exercise.drillType, exercise.name, profile?.uid || 'coach-local');
      setEditorDiagram(diag);
      setEditorTargetExerciseId(exercise.id);
      setEditorVisible(true);
    },
    [profile?.uid],
  );

  const handleCreateNewDiagram = useCallback(() => {
    setEditorDiagram(null);
    setEditorTargetExerciseId(null);
    setEditorVisible(true);
  }, []);

  const handleSaveDiagram = useCallback(
    async (saved: ExerciseDiagramData, mode: 'save_original' | 'create_copy') => {
      try {
        if (mode === 'save_original') {
          await coachDiagramsService.saveDiagram(saved, {
            uid: profile?.uid || 'coach-local',
            clubId: clubId || undefined,
          });
        }
        if (editorTargetExerciseId) {
          updateExercise(editorTargetExerciseId, {
            diagram: saved,
            name: saved.name || undefined,
            objective: saved.objective || undefined,
            instructions: saved.instructions || undefined,
          });
        } else {
          await coachDiagramsService.saveDiagram(saved, {
            uid: profile?.uid || 'coach-local',
            clubId: clubId || undefined,
          });
          const created: SessionExercise = {
            id: `diag-ex-${Date.now()}`,
            name: saved.name || 'Nouvel atelier tactique',
            durationMin: 20,
            drillType: 'generic',
            intensity: 'medium',
            playerCount: Math.max(2, playerCount),
            objective: saved.objective || 'Objectif tactique',
            instructions: saved.instructions || 'Mise en place et principes de jeu.',
            diagram: saved,
            stages: saved.stages,
          };
          setExercises((prev) => [...prev, created]);
          setExpandedId(created.id);
        }
        await loadCustomDiagrams();
      } catch {
        // Enregistrement sécurisé
      } finally {
        setEditorVisible(false);
        setEditorDiagram(null);
        setEditorTargetExerciseId(null);
      }
    },
    [editorTargetExerciseId, profile?.uid, clubId, updateExercise, playerCount, loadCustomDiagrams],
  );

  const addDrill = useCallback((template: ThematicDrillTemplate) => {
    const created = fromTemplate(template);
    setExercises((prev) => [...prev, created]);
    setExpandedId(created.id);
  }, []);

  const addManualExercise = useCallback(() => {
    const created: SessionExercise = {
      id: `manual-${Date.now()}`,
      name: 'Nouvel atelier',
      durationMin: 15,
      drillType: 'rondo',
      intensity: 'medium',
      playerCount: Math.max(2, playerCount),
      objective: 'Objectif à préciser',
      instructions: 'Définissez les règles, dimensions et rotations.',
    };
    setExercises((prev) => [...prev, created]);
    setExpandedId(created.id);
  }, [playerCount]);

  const deleteExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const moveExercise = useCallback((index: number, direction: -1 | 1) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // ——— Copilote : génération réelle (cloud) + repli local partagé ———
  const generateSession = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      let created: SessionExercise[] | null = null;
      if (clubId) {
        try {
          const res = await aiTrainingService.generateCollective({
            club_id: clubId,
            objective: 'technique',
            duration_min: 90,
            level: 'intermediate',
            player_count: Math.max(1, playerCount),
            coach_notes: prompt,
          });
          if (res?.phases?.length) {
            created = sessionExercisesFromPhases(res.phases, {
              playerCount: Math.max(1, playerCount),
            });
            setAiSource('cloud');
          }
        } catch {
          // Repli local — le même moteur que le Copilote hors cloud.
        }
      }
      if (!created) {
        created = sessionExercisesFromPlan(composedPlanFromPrompt(prompt), {
          playerCount: Math.max(1, playerCount),
        });
        setAiSource('local');
      }
      setExercises(created);
      setExpandedId(null);
      setShowAi(false);
      setAiPrompt('');
    } catch {
      setAiError('La génération a échoué. Décrivez à nouveau votre intention.');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, aiLoading, clubId, playerCount]);

  // ——— Programmation réelle de la séance ———
  const scheduleSession = useCallback(async () => {
    if (!profile || !clubId || saving) return;
    if (exercises.length === 0) return;
    setSaving(true);
    try {
      const startsAt = nextSession?.starts_at ?? defaultRecommendedSessionStart();
      const totalMin = summary.totalMin;
      await teamEventsService.create({
        title: nextSession?.title || 'Séance d’entraînement',
        description: `Séance planifiée depuis le planificateur.\n\nAteliers :\n${exercises
          .map((e, i) => `${i + 1}. ${e.name} (${e.durationMin} min)`)
          .join('\n')}\n\nDurée totale : ${totalMin} min`,
        event_type: 'training',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name || 'Coach',
        team_id: nextSession?.team_id,
        club_id: clubId,
        starts_at: startsAt,
        city: nextSession?.city || profile.city || 'Terrain principal',
        invitee_uids: players.map((player) => player.uid),
      });
      setNextSession(null);
      await load();
    } catch {
      // Le silence n'est pas un succès : sans repère visuel, on reste sobre.
    } finally {
      setSaving(false);
    }
  }, [profile, clubId, saving, exercises, nextSession, summary.totalMin, players, load]);

  const libraryItems = useMemo(
    () =>
      libraryFilter === 'custom'
        ? []
        : THEMATIC_DRILLS_LIBRARY.filter(
            (template) => libraryFilter === 'all' || template.theme === libraryFilter,
          ),
    [libraryFilter],
  );

  return (
    <View style={styles.root}>
      <CoachScreenHeader
        title="Entraînements"
        fallbackNavId="today"
        hasUnsavedChanges={exercises.length > 0}
      />
      <CoachChapterScroll>
        {/* ——— Séance du calendrier, si elle existe ——— */}
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="small" color={tokens.accent} />
          </View>
        ) : nextSession ? (
          <View style={styles.nextSessionCard}>
            <View style={styles.nextSessionBadge}>
              <MaterialCommunityIcons name="calendar-check" size={13} color={tokens.accent} />
              <Text style={styles.nextSessionBadgeText}>PROCHAINE SÉANCE</Text>
            </View>
            <Text style={styles.nextSessionTitle}>{nextSession.title}</Text>
            <Text style={styles.nextSessionMeta}>
              {nextSession.starts_at.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              ·{' '}
              {nextSession.starts_at.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {nextSession.location_label || nextSession.location || nextSession.city
                ? ` · ${nextSession.location_label || nextSession.location || nextSession.city}`
                : ''}
            </Text>
          </View>
        ) : clubId ? (
          <Text style={styles.honestNote}>
            Aucune séance programmée. Composez la séance ci-dessous puis ajoutez-la au calendrier.
          </Text>
        ) : null}

        {/* ——— Carte séance : résumé dérivé, rien d'inventé ——— */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionTopRow}>
            <Text style={styles.sessionTitle}>Séance en préparation</Text>
            <View style={styles.sessionChips}>
              <View style={styles.durationChip}>
                <Feather name="clock" size={12} color={tokens.muted} />
                <Text style={styles.durationChipText}>{summary.totalMin} min</Text>
              </View>
              {summary.dominant ? (
                <View
                  style={[
                    styles.intensityChip,
                    { backgroundColor: withAlpha(INTENSITY_TONE[summary.dominant], 0.14) },
                  ]}
                >
                  <Text style={[styles.intensityChipText, { color: INTENSITY_TONE[summary.dominant] }]}>
                    {INTENSITY_LABELS[summary.dominant]}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.sessionCount}>
            {summary.count} atelier{summary.count > 1 ? 's' : ''}
            {clubId && playerCount > 0 ? ` · ${playerCount} joueurs conviables` : ''}
          </Text>

          <View style={styles.sessionActionsRow}>
            <PressableSpring
              onPress={() => setShowLibrary(true)}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Ouvrir la bibliothèque d'ateliers"
              style={[styles.libraryBtn, { borderColor: withAlpha(tokens.accent, 0.4) }]}
            >
              <Icon name="bookmark" size={15} color={tokens.accent} />
              <Text style={[styles.libraryBtnText, { color: tokens.accent }]}>Bibliothèque</Text>
            </PressableSpring>
            <PressableSpring
              onPress={handleCreateNewDiagram}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Créer un schéma d'atelier personnalisé"
              style={[styles.libraryBtn, { borderColor: withAlpha(tokens.accent, 0.4) }]}
            >
              <MaterialCommunityIcons name="vector-polyline" size={15} color={tokens.accent} />
              <Text style={[styles.libraryBtnText, { color: tokens.accent }]}>Créer schéma</Text>
            </PressableSpring>
            <PressableSpring
              onPress={addManualExercise}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Ajouter un atelier manuel"
              style={[styles.libraryBtn, { borderColor: withAlpha(tokens.accent, 0.4) }]}
            >
              <Ionicons name="add" size={15} color={tokens.accent} />
              <Text style={[styles.libraryBtnText, { color: tokens.accent }]}>Atelier libre</Text>
            </PressableSpring>
          </View>
        </View>

        {/* ——— Ateliers ——— */}
        {exercises.length === 0 ? (
          <Text style={styles.honestNote}>
            Séance vide. Ajoutez des ateliers depuis la bibliothèque ou le Copilote.
          </Text>
        ) : (
          exercises.map((exercise, index) => {
            const expanded = expandedId === exercise.id;
            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <PressableSpring
                  onPress={() => setExpandedId(expanded ? null : exercise.id)}
                  scaleTo={0.99}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel={`Atelier ${exercise.name}, ${exercise.durationMin} minutes`}
                >
                  <View style={styles.exerciseRow}>
                    <View style={styles.diagramWrap}>
                      <CoachTrainingDrillDiagram
                        drillType={exercise.drillType}
                        diagramData={exercise.diagram}
                        title={exercise.name}
                        width={84}
                        height={56}
                        onPress={() => handleOpenViewer(exercise)}
                      />
                    </View>
                    <View style={styles.exerciseMain}>
                      <Text numberOfLines={2} style={styles.exerciseName}>
                        {exercise.name}
                      </Text>
                      <View style={styles.exerciseMetaRow}>
                        <Text style={styles.exerciseMeta}>{exercise.durationMin} min</Text>
                        <View style={styles.exerciseDot} />
                        <Text style={styles.exerciseMeta}>{DRILL_TYPE_LABELS[exercise.drillType]}</Text>
                        <View
                          style={[
                            styles.exerciseIntensityDot,
                            { backgroundColor: INTENSITY_TONE[exercise.intensity] },
                          ]}
                        />
                        <Text style={styles.exerciseMeta}>
                          {INTENSITY_LABELS[exercise.intensity]}
                        </Text>
                      </View>
                    </View>
                    <Feather
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={tokens.muted}
                    />
                  </View>
                </PressableSpring>

                {expanded ? (
                  <View style={styles.expandedBody}>
                    {/* 1. Titre complet sans coupure */}
                    <View style={styles.expandedHeaderRow}>
                      <Text style={styles.expandedTitle}>{exercise.name}</Text>
                    </View>

                    {/* 2. Terrain visuel grand format réactif (ratio 100:64 respecté) */}
                    <View style={styles.expandedPitchContainer}>
                      <CoachTrainingDrillDiagram
                        drillType={exercise.drillType}
                        diagramData={exercise.diagram}
                        title={exercise.name}
                        width={cardPitchW}
                        height={cardPitchH}
                        onPress={() => handleOpenViewer(exercise)}
                      />
                    </View>

                    {/* 3. Contrôles de visualisation du schéma */}
                    <View style={styles.diagramActionRow}>
                      <PressableSpring
                        onPress={() => handleOpenViewer(exercise)}
                        scaleTo={0.96}
                        haptic
                        accessibilityRole="button"
                        accessibilityLabel="Agrandir et zoomer le schéma"
                        style={styles.diagramActionBtn}
                      >
                        <Feather name="maximize-2" size={14} color={tokens.accent} />
                        <Text style={[styles.diagramActionText, { color: tokens.accent }]}>
                          Agrandir & Zoom
                        </Text>
                      </PressableSpring>

                      <PressableSpring
                        onPress={() => handleOpenViewer(exercise)}
                        scaleTo={0.96}
                        haptic
                        accessibilityRole="button"
                        accessibilityLabel="Montrer aux joueurs en mode présentation"
                        style={[styles.diagramActionBtn, styles.presentationModeBtn]}
                      >
                        <MaterialCommunityIcons name="presentation-play" size={15} color={tokens.bg} />
                        <Text style={[styles.diagramActionText, { color: tokens.bg }]}>
                          Montrer aux joueurs
                        </Text>
                      </PressableSpring>
                    </View>

                    {/* 4. Objectif et consignes STRICTEMENT sous le terrain */}
                    {exercise.objective ? (
                      <View style={styles.expandedObjectiveCard}>
                        <Text style={styles.expandedObjectiveLabel}>🎯 OBJECTIF</Text>
                        <Text style={styles.exerciseObjective}>{exercise.objective}</Text>
                      </View>
                    ) : null}

                    {exercise.instructions ? (
                      <View style={styles.expandedInstructionsCard}>
                        <Text style={styles.expandedInstructionsLabel}>📋 CONSIGNES DE MISE EN PLACE</Text>
                        <Text style={styles.exerciseInstructions}>{exercise.instructions}</Text>
                      </View>
                    ) : null}

                    {/* 5. Durée, effectif, intensité, détails */}
                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Durée</Text>
                      <Stepper
                        label={`${exercise.durationMin} min`}
                        onDecrement={() =>
                          updateExercise(exercise.id, {
                            durationMin: Math.max(5, exercise.durationMin - 5),
                          })
                        }
                        onIncrement={() =>
                          updateExercise(exercise.id, {
                            durationMin: Math.min(120, exercise.durationMin + 5),
                          })
                        }
                      />
                    </View>

                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Joueurs</Text>
                      <Stepper
                        label={`${exercise.playerCount}`}
                        onDecrement={() =>
                          updateExercise(exercise.id, {
                            playerCount: Math.max(2, exercise.playerCount - 2),
                          })
                        }
                        onIncrement={() =>
                          updateExercise(exercise.id, {
                            playerCount: Math.min(40, exercise.playerCount + 2),
                          })
                        }
                      />
                    </View>

                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Type</Text>
                      <View style={styles.typeChips}>
                        {DRILL_TYPES.map((type) => {
                          const active = exercise.drillType === type;
                          return (
                            <PressableSpring
                              key={type}
                              onPress={() => updateExercise(exercise.id, { drillType: type })}
                              scaleTo={0.94}
                              haptic
                              style={[
                                styles.typeChip,
                                active && { backgroundColor: withAlpha(tokens.accent, 0.16) },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeChipText,
                                  { color: active ? tokens.accent : tokens.muted },
                                ]}
                              >
                                {DRILL_TYPE_LABELS[type]}
                              </Text>
                            </PressableSpring>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Intensité</Text>
                      <View style={styles.typeChips}>
                        {(['low', 'medium', 'high'] as SessionIntensity[]).map((level) => {
                          const active = exercise.intensity === level;
                          return (
                            <PressableSpring
                              key={level}
                              onPress={() => updateExercise(exercise.id, { intensity: level })}
                              scaleTo={0.94}
                              haptic
                              style={[
                                styles.typeChip,
                                active && {
                                  backgroundColor: withAlpha(INTENSITY_TONE[level], 0.14),
                                  borderColor: withAlpha(INTENSITY_TONE[level], 0.5),
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeChipText,
                                  { color: active ? INTENSITY_TONE[level] : tokens.muted },
                                ]}
                              >
                                {INTENSITY_LABELS[level]}
                              </Text>
                            </PressableSpring>
                          );
                        })}
                      </View>
                    </View>

                    {/* 6. Actions atelier */}
                    <View style={styles.orderRow}>
                      <PressableSpring
                        onPress={() => handleOpenEditor(exercise)}
                        scaleTo={0.96}
                        haptic
                        accessibilityRole="button"
                        accessibilityLabel="Modifier ou créer le schéma d'atelier"
                        style={styles.editDiagramBtn}
                      >
                        <Feather name="edit-2" size={13} color={tokens.accent} />
                        <Text style={[styles.diagramActionText, { color: tokens.accent }]}>
                          {exercise.diagram ? 'Modifier schéma' : 'Créer schéma'}
                        </Text>
                      </PressableSpring>

                      <PressableSpring
                        onPress={() => moveExercise(index, -1)}
                        scaleTo={0.9}
                        haptic
                        disabled={index === 0}
                        style={styles.orderBtn}
                      >
                        <Ionicons name="arrow-up" size={15} color={tokens.muted} />
                      </PressableSpring>
                      <PressableSpring
                        onPress={() => moveExercise(index, 1)}
                        scaleTo={0.9}
                        haptic
                        disabled={index === exercises.length - 1}
                        style={styles.orderBtn}
                      >
                        <Ionicons name="arrow-down" size={15} color={tokens.muted} />
                      </PressableSpring>
                      <PressableSpring
                        onPress={() => deleteExercise(exercise.id)}
                        scaleTo={0.94}
                        haptic
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={14} color={proSemantic.danger} />
                        <Text style={[styles.deleteBtnText, { color: proSemantic.danger }]}>
                          Retirer
                        </Text>
                      </PressableSpring>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {/* ——— Copilote : une ligne qui ouvre la génération réelle ——— */}
        <PressableSpring
          onPress={() => setShowAi(true)}
          scaleTo={0.98}
          haptic
          accessibilityRole="button"
          accessibilityLabel="Générer une séance avec le Copilote"
          style={styles.aiRow}
        >
          <View style={styles.aiIconWrap}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={tokens.accent} />
          </View>
          <View style={styles.aiCopy}>
            <Text style={styles.aiTitle}>Générer avec le Copilote</Text>
            <Text numberOfLines={1} style={styles.aiSubtitle}>
              Décrivez votre intention, la séance reste modifiable
            </Text>
          </View>
          <Feather name="arrow-right" size={15} color={tokens.muted} />
        </PressableSpring>

        {clubId ? (
          <PressableSpring
            onPress={() => void scheduleSession()}
            disabled={saving || exercises.length === 0}
            scaleTo={0.98}
            haptic
            accessibilityRole="button"
            accessibilityLabel="Ajouter la séance au calendrier"
            style={[styles.scheduleBtn, { backgroundColor: tokens.accent }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={tokens.onAccent} />
            ) : (
              <MaterialCommunityIcons name="calendar-plus" size={17} color={tokens.onAccent} />
            )}
            <Text style={[styles.scheduleBtnText, { color: tokens.onAccent }]}>
              {nextSession ? 'Mettre à jour la séance' : 'Ajouter au calendrier'}
            </Text>
          </PressableSpring>
        ) : null}

        <Text style={styles.honestFooter}>
          La séance part dans le calendrier réel de l'équipe — convocations et présences suivent le
          circuit habituel.
        </Text>
      </CoachChapterScroll>

      {/* ——— Bibliothèque (feuille modale, filtres partagés) ——— */}
      <Modal visible={showLibrary} animationType="slide" onRequestClose={() => setShowLibrary(false)}>
        <View style={[styles.modalRoot, { backgroundColor: tokens.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bibliothèque d'ateliers</Text>
            <PressableSpring onPress={() => setShowLibrary(false)} scaleTo={0.9} haptic>
              <Ionicons name="close" size={20} color={tokens.foreground} />
            </PressableSpring>
          </View>
          <View style={styles.libraryFilters}>
            {DRILL_FILTERS.map((filter) => {
              const active = libraryFilter === filter.id;
              return (
                <PressableSpring
                  key={filter.id}
                  onPress={() => setLibraryFilter(filter.id)}
                  scaleTo={0.94}
                  haptic
                  style={[
                    styles.libraryChip,
                    active && { backgroundColor: withAlpha(tokens.accent, 0.16) },
                  ]}
                >
                  <Text
                    style={[
                      styles.libraryChipText,
                      { color: active ? tokens.accent : tokens.muted },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
          <ScrollView contentContainerStyle={styles.libraryList} showsVerticalScrollIndicator={false}>
            {libraryFilter === 'custom' ? (
              <View style={{ gap: proSpace.sm }}>
                <PressableSpring
                  onPress={() => {
                    setShowLibrary(false);
                    handleCreateNewDiagram();
                  }}
                  scaleTo={0.98}
                  haptic
                  style={[
                    styles.libraryBtn,
                    {
                      borderColor: withAlpha(tokens.accent, 0.5),
                      marginBottom: proSpace.sm,
                      paddingHorizontal: proSpace.md,
                    },
                  ]}
                >
                  <Ionicons name="add-circle" size={17} color={tokens.accent} />
                  <Text style={[styles.libraryBtnText, { color: tokens.accent }]}>
                    Créer un nouveau schéma d'atelier
                  </Text>
                </PressableSpring>
                {customDiagrams.length === 0 ? (
                  <Text style={styles.honestNote}>
                    Aucun schéma personnalisé créé. Appuyez sur Créer pour concevoir votre premier atelier.
                  </Text>
                ) : (
                  customDiagrams.map((diag) => (
                    <PressableSpring
                      key={diag.id}
                      onPress={() => {
                        const created: SessionExercise = {
                          id: `diag-ex-${Date.now()}-${diag.id}`,
                          name: diag.name || 'Atelier personnalisé',
                          durationMin: 20,
                          drillType: (diag.drillType as DrillType) || 'generic',
                          intensity: 'medium',
                          playerCount: Math.max(2, playerCount),
                          objective: diag.objective || 'Objectif tactique',
                          instructions: diag.instructions || 'Mise en place.',
                          diagram: diag,
                          stages: diag.stages,
                        };
                        setExercises((prev) => [...prev, created]);
                        setExpandedId(created.id);
                        setShowLibrary(false);
                      }}
                      scaleTo={0.98}
                      haptic
                      style={styles.libraryCard}
                    >
                      <View style={styles.diagramWrap}>
                        <CoachTrainingDrillDiagram diagramData={diag} width={76} height={50} showBadge={false} />
                      </View>
                      <View style={styles.libraryCopy}>
                        <Text style={styles.libraryName}>
                          {diag.name}
                        </Text>
                        <Text style={styles.libraryMeta}>
                          {diag.stages?.length ? `${diag.stages.length} étapes · ` : ''}
                          {diag.pitchTemplate === 'full'
                            ? 'Grand terrain'
                            : diag.pitchTemplate === 'half'
                              ? 'Demi-terrain'
                              : 'Zone'}
                        </Text>
                      </View>
                      <Ionicons name="add" size={16} color={tokens.accent} />
                    </PressableSpring>
                  ))
                )}
              </View>
            ) : (
              libraryItems.map((template) => (
                <PressableSpring
                  key={template.id}
                  onPress={() => {
                    addDrill(template);
                    setShowLibrary(false);
                  }}
                  scaleTo={0.98}
                  haptic
                  style={styles.libraryCard}
                >
                  <View style={styles.diagramWrap}>
                    <CoachTrainingDrillDiagram drillType={template.drillType} width={72} height={48} />
                  </View>
                  <View style={styles.libraryCopy}>
                    <Text style={styles.libraryName}>
                      {template.name}
                    </Text>
                    <Text style={styles.libraryMeta}>
                      {template.durationMin} min · {template.themeLabel}
                    </Text>
                  </View>
                  <Ionicons name="add" size={16} color={tokens.accent} />
                </PressableSpring>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ——— Copilote (modale) ——— */}
      <Modal visible={showAi} animationType="slide" onRequestClose={() => setShowAi(false)}>
        <View style={[styles.modalRoot, { backgroundColor: tokens.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Copilote — séance</Text>
            <PressableSpring onPress={() => setShowAi(false)} scaleTo={0.9} haptic>
              <Ionicons name="close" size={20} color={tokens.foreground} />
            </PressableSpring>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.aiBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.aiSuggestions}>
                {AI_SUGGESTIONS.map((suggestion) => (
                  <PressableSpring
                    key={suggestion}
                    onPress={() => setAiPrompt(suggestion)}
                    scaleTo={0.94}
                    haptic
                    style={[styles.libraryChip, { borderColor: withAlpha(tokens.accent, 0.4) }]}
                  >
                    <Text style={[styles.libraryChipText, { color: tokens.accent }]}>
                      + {suggestion}
                    </Text>
                  </PressableSpring>
                ))}
              </View>
              <TextInput
                style={styles.aiInput}
                placeholder="Ex : sortie de balle sous pressing 4v3…"
                placeholderTextColor={tokens.muted}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
              />
              {aiError ? <Text style={styles.aiErrorText}>{aiError}</Text> : null}
              {aiSource ? (
                <Text style={styles.aiSourceText}>
                  {aiSource === 'cloud'
                    ? 'Dernière séance générée par le Copilote cloud.'
                    : 'Dernière séance générée par le moteur local (cloud indisponible).'}
                </Text>
              ) : null}
              <PressableSpring
                onPress={() => void generateSession()}
                disabled={aiLoading || !aiPrompt.trim()}
                scaleTo={0.98}
                haptic
                style={[styles.scheduleBtn, { backgroundColor: tokens.accent }, styles.aiGenerateBtn]}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={tokens.onAccent} />
                ) : (
                  <MaterialCommunityIcons name="star-four-points" size={17} color={tokens.onAccent} />
                )}
                <Text style={[styles.scheduleBtnText, { color: tokens.onAccent }]}>Générer</Text>
              </PressableSpring>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ——— Visualiseur zoomable & Mode Présentation (« Montrer aux joueurs ») ——— */}
      {viewerDiagram ? (
        <CoachDiagramViewerModal
          visible={viewerVisible}
          diagram={viewerDiagram}
          exerciseName={viewerExercise?.name}
          objective={viewerExercise?.objective}
          instructions={viewerExercise?.instructions}
          durationMin={viewerExercise?.durationMin}
          intensity={viewerExercise ? INTENSITY_LABELS[viewerExercise.intensity] : undefined}
          onClose={() => {
            setViewerVisible(false);
            setViewerDiagram(null);
            setViewerExercise(null);
          }}
          onEdit={
            viewerExercise
              ? () => {
                  setViewerVisible(false);
                  handleOpenEditor(viewerExercise);
                }
              : undefined
          }
        />
      ) : null}

      {/* ——— Créateur / Éditeur visuel de schéma ——— */}
      <CoachDiagramEditorModal
        visible={editorVisible}
        initialDiagram={editorDiagram}
        exerciseTitle={
          editorTargetExerciseId
            ? exercises.find((e) => e.id === editorTargetExerciseId)?.name
            : 'Nouveau schéma'
        }
        isAttachedToSession={Boolean(editorTargetExerciseId)}
        onClose={() => {
          setEditorVisible(false);
          setEditorDiagram(null);
          setEditorTargetExerciseId(null);
        }}
        onSave={handleSaveDiagram}
      />
    </View>
  );
};

function Stepper({
  label,
  onIncrement,
  onDecrement,
}: {
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  return (
    <View style={styles.stepper}>
      <PressableSpring onPress={onDecrement} scaleTo={0.9} haptic style={styles.stepperBtn}>
        <Ionicons name="remove" size={14} color={tokens.foreground} />
      </PressableSpring>
      <Text style={styles.stepperLabel}>{label}</Text>
      <PressableSpring onPress={onIncrement} scaleTo={0.9} haptic style={styles.stepperBtn}>
        <Ionicons name="add" size={14} color={tokens.foreground} />
      </PressableSpring>
    </View>
  );
}

const createStyles = (tokens: CoachComponentTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    centerBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: proSpace.xl,
    },
    honestNote: {
      ...proType.caption,
      color: tokens.muted,
      textAlign: 'center',
      paddingHorizontal: proSpace.lg,
      paddingVertical: proSpace.md,
    },
    honestFooter: {
      ...proType.caption,
      color: tokens.muted,
      textAlign: 'center',
      paddingHorizontal: proSpace.xl,
      paddingBottom: proSpace.xl,
    },
    nextSessionCard: {
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      padding: proSpace.lg,
      gap: 4,
    },
    nextSessionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    nextSessionBadgeText: {
      ...proType.caption,
      color: tokens.accent,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    nextSessionTitle: {
      ...proType.h3,
      color: tokens.foreground,
    },
    nextSessionMeta: {
      ...proType.caption,
      color: tokens.muted,
    },
    sessionCard: {
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      padding: proSpace.lg,
      gap: proSpace.xs,
    },
    sessionTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: proSpace.sm,
    },
    sessionTitle: {
      ...proType.h3,
      color: tokens.foreground,
      flex: 1,
    },
    sessionChips: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    durationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: proForm.chipRadius,
    },
    durationChipText: {
      ...proType.caption,
      color: tokens.foreground,
      fontWeight: '700',
    },
    intensityChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: proForm.chipRadius,
    },
    intensityChipText: {
      ...proType.caption,
      fontWeight: '800',
    },
    sessionCount: {
      ...proType.caption,
      color: tokens.muted,
    },
    sessionActionsRow: {
      flexDirection: 'row',
      gap: proSpace.sm,
      marginTop: proSpace.sm,
    },
    libraryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: proForm.actionMinHeight,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      backgroundColor: tokens.surface,
    },
    libraryBtnText: {
      ...proType.body,
      fontWeight: '700',
    },
    exerciseCard: {
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      padding: proSpace.md,
    },
    diagramWrap: {
      borderRadius: proRadius.sm,
      overflow: 'hidden',
      backgroundColor: tokens.elevated,
    },
    exerciseMain: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    exerciseName: {
      ...proType.body,
      color: tokens.foreground,
      fontWeight: '700',
    },
    exerciseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    exerciseMeta: {
      ...proType.caption,
      color: tokens.muted,
    },
    exerciseDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: tokens.muted,
    },
    exerciseIntensityDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    expandedBody: {
      paddingHorizontal: proSpace.md,
      paddingBottom: proSpace.md,
      gap: proSpace.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      paddingTop: proSpace.md,
    },
    expandedHeaderRow: {
      marginBottom: 2,
    },
    expandedTitle: {
      ...proType.body,
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 16,
    },
    expandedPitchContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: withAlpha(tokens.surface, 0.5),
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: withAlpha(tokens.border, 0.4),
    },
    expandedObjectiveCard: {
      backgroundColor: withAlpha(tokens.accent, 0.08),
      borderLeftWidth: 3,
      borderLeftColor: tokens.accent,
      padding: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.2),
      gap: 4,
    },
    expandedObjectiveLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
      letterSpacing: 0.5,
    },
    expandedInstructionsCard: {
      backgroundColor: tokens.elevated,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
    },
    expandedInstructionsLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.muted,
      letterSpacing: 0.5,
    },
    exerciseObjective: {
      ...proType.caption,
      color: tokens.foreground,
      fontWeight: '600',
      lineHeight: 18,
    },
    exerciseInstructions: {
      ...proType.caption,
      color: tokens.foreground,
      lineHeight: 18,
    },
    controlRow: {
      gap: 6,
    },
    controlLabel: {
      ...proType.caption,
      color: tokens.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
    },
    stepperBtn: {
      width: proForm.chipHeight,
      height: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    stepperLabel: {
      ...proType.body,
      color: tokens.foreground,
      fontWeight: '700',
      minWidth: 56,
      textAlign: 'center',
    },
    typeChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    typeChip: {
      paddingHorizontal: proSpace.md,
      paddingVertical: 6,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    typeChipText: {
      ...proType.caption,
      fontWeight: '700',
    },
    diagramActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      marginTop: proSpace.xs,
    },
    diagramActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.4),
      backgroundColor: tokens.elevated,
    },
    presentationModeBtn: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    diagramActionText: {
      ...proType.caption,
      fontWeight: '800',
    },
    editDiagramBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.4),
      backgroundColor: tokens.elevated,
    },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
    },
    orderBtn: {
      width: proForm.chipHeight,
      height: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      paddingHorizontal: proSpace.md,
      paddingVertical: 6,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: withAlpha(proSemantic.danger, 0.4),
    },
    deleteBtnText: {
      ...proType.caption,
      fontWeight: '700',
    },
    aiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      padding: proSpace.lg,
    },
    aiIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(tokens.accent, 0.12),
    },
    aiCopy: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    aiTitle: {
      ...proType.body,
      color: tokens.foreground,
      fontWeight: '700',
    },
    aiSubtitle: {
      ...proType.caption,
      color: tokens.muted,
    },
    scheduleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      minHeight: proForm.actionMinHeight,
      borderRadius: proForm.chipRadius,
      marginHorizontal: proSpace.lg,
    },
    scheduleBtnText: {
      ...proType.body,
      fontWeight: '800',
    },
    modalRoot: {
      flex: 1,
      paddingTop: proSpace.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: proSpace.lg,
      paddingBottom: proSpace.md,
    },
    modalTitle: {
      ...proType.h3,
      color: tokens.foreground,
    },
    libraryFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: proSpace.lg,
      paddingBottom: proSpace.md,
    },
    libraryChip: {
      paddingHorizontal: proSpace.md,
      paddingVertical: 6,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    libraryChipText: {
      ...proType.caption,
      fontWeight: '700',
    },
    libraryList: {
      paddingHorizontal: proSpace.lg,
      paddingBottom: proSpace.xl,
      gap: proSpace.sm,
    },
    libraryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      padding: proSpace.md,
    },
    libraryCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    libraryName: {
      ...proType.caption,
      color: tokens.foreground,
      fontWeight: '700',
    },
    libraryMeta: {
      ...proType.caption,
      color: tokens.muted,
    },
    aiBody: {
      flex: 1,
      paddingHorizontal: proSpace.lg,
      gap: proSpace.md,
    },
    aiSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    aiInput: {
      minHeight: 88,
      borderRadius: proRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      color: tokens.foreground,
      padding: proSpace.md,
      textAlignVertical: 'top',
      ...proType.body,
    },
    aiErrorText: {
      ...proType.caption,
      color: proSemantic.danger,
    },
    aiSourceText: {
      ...proType.caption,
      color: tokens.muted,
    },
    aiGenerateBtn: {
      marginHorizontal: 0,
      alignSelf: 'stretch',
    },
  });

export default CoachTrainingPlannerScreen;
