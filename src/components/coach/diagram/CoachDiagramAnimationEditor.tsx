import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachExerciseDiagramRenderer } from './CoachExerciseDiagramRenderer';
import type {
  DiagramElement,
  DiagramEquipmentElement,
  DiagramPlayerElement,
  ExerciseDiagramData,
} from '../../../models/ExerciseDiagram';
import {
  createDefaultAnimationStage,
  createEmptyAnimationData,
  DEFAULT_STAGE_DURATION_MS,
  type ElementMovementAction,
  type ExerciseAnimationStage,
  type ExerciseDiagramAnimationData,
  type MovementActionType,
  type TrajectoryPoint,
} from '../../../models/ExerciseDiagramAnimation';
import {
  convertStaticArrowsToAnimationStage,
  computeStageInterpolation,
} from '../../../utils/diagramAnimationEngine';
import { PressableSpring } from '../../../components/motion/PressableSpring';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { proRadius, proSemantic } from '../../../theme/professionalDesign';
import { withAlpha } from '../../../utils/coachTeamTheme';

export interface CoachDiagramAnimationEditorProps {
  visible: boolean;
  diagram: ExerciseDiagramData;
  onClose: () => void;
  onSaveAnimation: (animation: ExerciseDiagramAnimationData) => void;
}

export const CoachDiagramAnimationEditor: React.FC<CoachDiagramAnimationEditorProps> = ({
  visible,
  diagram,
  onClose,
  onSaveAnimation,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  // Initialisation des données d'animation
  const [animationData, setAnimationData] = useState<ExerciseDiagramAnimationData>(() => {
    if (diagram.animation && diagram.animation.stages && diagram.animation.stages.length > 0) {
      return diagram.animation;
    }
    const empty = createEmptyAnimationData();
    empty.stages = [createDefaultAnimationStage(0, 'Phase 1 : Lancement')];
    return empty;
  });

  const [stages, setStages] = useState<ExerciseAnimationStage[]>(animationData.stages || []);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);

  // État de l'assistant / wizard de création
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<TrajectoryPoint | null>(null);
  const [movementType, setMovementType] = useState<MovementActionType>('run');
  const [startDelayMs, setStartDelayMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(1500);
  const [isSimultaneous, setIsSimultaneous] = useState<boolean>(true);
  const [isCurved, setIsCurved] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<1 | 2 | 3 | 4>(1);

  // Prévisualisation instantanée
  const [previewTimeMs, setPreviewTimeMs] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  // Historique Undo / Redo
  const [undoStack, setUndoStack] = useState<ExerciseAnimationStage[][]>([]);
  const [redoStack, setRedoStack] = useState<ExerciseAnimationStage[][]>([]);

  // Synchronisation lors de l'ouverture
  useEffect(() => {
    if (visible) {
      let init = diagram.animation;
      if (!init || !init.stages || init.stages.length === 0) {
        init = createEmptyAnimationData();
        init.stages = [createDefaultAnimationStage(0, 'Phase 1 : Lancement')];
      }
      setAnimationData(init);
      setStages(init.stages);
      setCurrentStageIdx(0);
      setSelectedActorId(null);
      setDestinationPoint(null);
      setUndoStack([]);
      setRedoStack([]);
      setStepIndex(1);
      setIsPreviewPlaying(false);
      setPreviewTimeMs(0);
    }
  }, [visible, diagram]);

  const currentStage: ExerciseAnimationStage = useMemo(() => {
    if (stages[currentStageIdx]) return stages[currentStageIdx];
    return createDefaultAnimationStage(0);
  }, [stages, currentStageIdx]);

  const pushStagesChange = useCallback(
    (newStages: ExerciseAnimationStage[]) => {
      setUndoStack((prev) => [stages, ...prev.slice(0, 19)]);
      setRedoStack([]);
      setStages(newStages);
    },
    [stages],
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [previous, ...rest] = undoStack;
    setRedoStack((fut) => [stages, ...fut]);
    setStages(previous);
    setUndoStack(rest);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    setUndoStack((past) => [stages, ...past]);
    setStages(next);
    setRedoStack(rest);
  };

  // Liste des acteurs éligibles (joueurs + ballons)
  const baseElements = diagram.elements || [];
  const actors = useMemo(() => {
    const players = baseElements.filter((el): el is DiagramPlayerElement => el.type === 'player');
    const balls = baseElements.filter(
      (el): el is DiagramEquipmentElement => el.type === 'equipment' && el.equipmentType === 'ball',
    );
    return [...players, ...balls];
  }, [baseElements]);

  // Position actuelle de l'acteur sélectionné
  const selectedActorPos: TrajectoryPoint | null = useMemo(() => {
    if (!selectedActorId) return null;
    const actor = actors.find((a) => a.id === selectedActorId);
    if (!actor) return null;
    if (currentStage.initialPositions && currentStage.initialPositions[selectedActorId]) {
      return currentStage.initialPositions[selectedActorId];
    }
    return { x: actor.x, y: actor.y };
  }, [selectedActorId, actors, currentStage.initialPositions]);

  // Clic sur le terrain ou sur un élément
  const handlePitchTap = (element: DiagramElement | null) => {
    if (element && (element.type === 'player' || (element.type === 'equipment' && element.equipmentType === 'ball'))) {
      setSelectedActorId(element.id);
      if (element.type === 'equipment' && element.equipmentType === 'ball') {
        setMovementType('pass');
      } else {
        setMovementType('run');
      }
      setStepIndex(3); // Passer à la sélection de destination
    }
  };

  // Ajout du mouvement à l'étape courante
  const handleAddMovement = () => {
    if (!selectedActorId || !selectedActorPos || !destinationPoint) {
      Alert.alert('Configuration incomplète', 'Veuillez sélectionner un joueur/ballon et un point d’arrivée.');
      return;
    }

    const isBall = actors.find((a) => a.id === selectedActorId)?.type === 'equipment';
    const hasBall = !isBall && (movementType === 'dribble');

    // Calcul du point de contrôle si courbe
    let controlPoint: TrajectoryPoint | undefined = undefined;
    if (isCurved) {
      const midX = (selectedActorPos.x + destinationPoint.x) / 2;
      const midY = (selectedActorPos.y + destinationPoint.y) / 2;
      controlPoint = {
        x: midX - (destinationPoint.y - selectedActorPos.y) * 0.25,
        y: midY + (destinationPoint.x - selectedActorPos.x) * 0.25,
      };
    }

    // Calcul du startDelay selon simultané ou consécutif
    let delay = startDelayMs;
    if (!isSimultaneous && currentStage.movements.length > 0) {
      const last = currentStage.movements[currentStage.movements.length - 1];
      delay = last.startDelayMs + last.durationMs;
    }

    const newMovement: ElementMovementAction = {
      id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      elementId: selectedActorId,
      actionType: movementType,
      from: { ...selectedActorPos },
      to: { ...destinationPoint },
      controlPoint,
      startDelayMs: delay,
      durationMs,
      hasBall,
    };

    const nextDuration = Math.max(currentStage.durationMs, delay + durationMs + 400);

    const updatedStage: ExerciseAnimationStage = {
      ...currentStage,
      durationMs: nextDuration,
      movements: [...currentStage.movements, newMovement],
    };

    const nextStages = stages.map((st, i) => (i === currentStageIdx ? updatedStage : st));
    pushStagesChange(nextStages);

    // Réinitialiser pour le mouvement suivant
    setDestinationPoint(null);
    setStepIndex(2);
  };

  // Suppression d'un mouvement
  const handleDeleteMovement = (mvId: string) => {
    const updatedStage: ExerciseAnimationStage = {
      ...currentStage,
      movements: currentStage.movements.filter((m) => m.id !== mvId),
    };
    const nextStages = stages.map((st, i) => (i === currentStageIdx ? updatedStage : st));
    pushStagesChange(nextStages);
  };

  // Convertir les flèches statiques du schéma en animation automatique
  const handleConvertStaticArrows = () => {
    const converted = convertStaticArrowsToAnimationStage(
      diagram.elements,
      `Phase 1 : ${diagram.name || 'Animation tactique'}`,
    );
    if (converted.movements.length === 0) {
      Alert.alert(
        'Aucune flèche détectée',
        'Tracez d’abord des flèches sur le terrain ou ajoutez directement des mouvements dans cet éditeur.',
      );
      return;
    }
    pushStagesChange([converted]);
    setCurrentStageIdx(0);
    Alert.alert('Succès', `${converted.movements.length} déplacement(s) converti(s) en animation.`);
  };

  // Gestion des étapes
  const handleAddStage = () => {
    const newIdx = stages.length;
    // Les positions initiales de la nouvelle étape = positions finales de l'étape précédente
    const lastStage = stages[stages.length - 1];
    const finalInterp = computeStageInterpolation(lastStage, lastStage.durationMs, baseElements);
    const initialPositions: Record<string, TrajectoryPoint> = {};
    for (const el of finalInterp.elements) {
      if ('x' in el && 'y' in el) {
        initialPositions[el.id] = { x: el.x, y: el.y };
      }
    }

    const newStage: ExerciseAnimationStage = {
      id: `stage-${Date.now()}`,
      stageIndex: newIdx,
      title: `Phase ${newIdx + 1}`,
      instruction: 'Suite de l’exercice',
      durationMs: DEFAULT_STAGE_DURATION_MS,
      pauseAfterMs: 600,
      movements: [],
      initialPositions,
    };

    pushStagesChange([...stages, newStage]);
    setCurrentStageIdx(newIdx);
  };

  const handleDuplicateStage = () => {
    const dup: ExerciseAnimationStage = {
      ...currentStage,
      id: `stage-${Date.now()}`,
      stageIndex: stages.length,
      title: `${currentStage.title} (Copie)`,
      movements: currentStage.movements.map((m) => ({
        ...m,
        id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    pushStagesChange([...stages, dup]);
    setCurrentStageIdx(stages.length);
  };

  const handleDeleteStage = () => {
    if (stages.length <= 1) {
      Alert.alert('Action impossible', 'Une animation doit comporter au moins une étape.');
      return;
    }
    const nextStages = stages.filter((_, i) => i !== currentStageIdx);
    pushStagesChange(nextStages);
    setCurrentStageIdx(Math.max(0, currentStageIdx - 1));
  };

  // Prévisualisation en boucle
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;

    const loopTick = (now: number) => {
      if (!isPreviewPlaying) return;
      if (lastTime === null) lastTime = now;
      const delta = now - lastTime;
      lastTime = now;

      setPreviewTimeMs((prev) => {
        const next = prev + delta;
        const total = currentStage.durationMs + (currentStage.pauseAfterMs || 0);
        if (next >= total) {
          return 0; // Boucle au début de l'étape
        }
        return next;
      });

      animId = requestAnimationFrame(loopTick);
    };

    if (isPreviewPlaying) {
      lastTime = null;
      animId = requestAnimationFrame(loopTick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPreviewPlaying, currentStage]);

  // Éléments interpolés pour l'affichage en direct
  const renderedElements = useMemo(() => {
    if (isPreviewPlaying) {
      return computeStageInterpolation(currentStage, previewTimeMs, baseElements).elements;
    }
    return baseElements;
  }, [isPreviewPlaying, previewTimeMs, currentStage, baseElements]);

  // Sauvegarde finale
  const handleSave = () => {
    const finalAnim: ExerciseDiagramAnimationData = {
      version: 1,
      stages,
      loop: animationData.loop,
      playbackSpeed: animationData.playbackSpeed || 1.0,
      autoPauseBetweenStages: animationData.autoPauseBetweenStages || false,
    };
    onSaveAnimation(finalAnim);
  };

  const pitchW = Math.min(winWidth - 32, 540);
  const pitchH = Math.round((pitchW * 64) / 100);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        {/* ——— En-tête Éditeur Animation ——— */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ÉDITEUR D’ANIMATION</Text>
            </View>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {currentStage.title}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <PressableSpring
              onPress={handleUndo}
              disabled={undoStack.length === 0}
              scaleTo={0.9}
              haptic
              style={[styles.miniBtn, undoStack.length === 0 && styles.miniBtnDisabled]}
              accessibilityLabel="Annuler"
            >
              <Ionicons
                name="arrow-undo"
                size={17}
                color={undoStack.length === 0 ? tokens.muted : tokens.foreground}
              />
            </PressableSpring>

            <PressableSpring
              onPress={handleRedo}
              disabled={redoStack.length === 0}
              scaleTo={0.9}
              haptic
              style={[styles.miniBtn, redoStack.length === 0 && styles.miniBtnDisabled]}
              accessibilityLabel="Rétablir"
            >
              <Ionicons
                name="arrow-redo"
                size={17}
                color={redoStack.length === 0 ? tokens.muted : tokens.foreground}
              />
            </PressableSpring>

            <PressableSpring
              onPress={handleSave}
              scaleTo={0.94}
              haptic
              style={styles.saveBtn}
              accessibilityLabel="Sauvegarder l’animation"
            >
              <Ionicons name="checkmark" size={17} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </PressableSpring>

            <PressableSpring
              onPress={onClose}
              scaleTo={0.9}
              haptic
              style={styles.closeBtn}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color={tokens.foreground} />
            </PressableSpring>
          </View>
        </View>

        {/* ——— Barre des Étapes (Onglets Phase 1, Phase 2...) ——— */}
        <View style={styles.stageTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsScroll}>
            {stages.map((st, idx) => (
              <PressableSpring
                key={st.id}
                onPress={() => {
                  setCurrentStageIdx(idx);
                  setIsPreviewPlaying(false);
                  setPreviewTimeMs(0);
                }}
                scaleTo={0.95}
                haptic
                style={[styles.stageTab, currentStageIdx === idx && styles.stageTabActive]}
              >
                <Text
                  style={[
                    styles.stageTabText,
                    currentStageIdx === idx && styles.stageTabTextActive,
                  ]}
                >
                  {st.title || `Phase ${idx + 1}`}
                </Text>
                {st.movements.length > 0 ? (
                  <View style={styles.movementCountBadge}>
                    <Text style={styles.movementCountText}>{st.movements.length}</Text>
                  </View>
                ) : null}
              </PressableSpring>
            ))}

            <PressableSpring onPress={handleAddStage} scaleTo={0.92} haptic style={styles.addStageTab}>
              <Ionicons name="add" size={16} color={tokens.accent} />
              <Text style={styles.addStageTabText}>Nouvelle phase</Text>
            </PressableSpring>
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* ——— Terrain de Démonstration & Tracé (Tactical Slate) ——— */}
          <View
            style={[styles.pitchContainer, { width: pitchW, height: pitchH }]}
            onTouchEnd={(event) => {
              if (isPreviewPlaying) return;
              const { locationX, locationY } = event.nativeEvent;
              const normX = Math.round(Math.max(4, Math.min(96, (locationX / pitchW) * 100)));
              const normY = Math.round(Math.max(4, Math.min(60, (locationY / pitchH) * 64)));
              if (selectedActorId) {
                setDestinationPoint({ x: normX, y: normY });
              }
            }}
          >
            <CoachExerciseDiagramRenderer
              diagram={diagram}
              activeElements={renderedElements}
              activeMovements={
                destinationPoint && selectedActorId && selectedActorPos
                  ? [
                      ...currentStage.movements,
                      {
                        id: 'preview-target',
                        elementId: selectedActorId,
                        actionType: movementType,
                        from: selectedActorPos,
                        to: destinationPoint,
                        startDelayMs: 0,
                        durationMs: 1500,
                      },
                    ]
                  : currentStage.movements
              }
              selectedElementId={selectedActorId}
              onSelectElement={handlePitchTap}
              isInteractive={!isPreviewPlaying}
              width="100%"
              height="100%"
            />

            {/* Bouton de prévisualisation flottant */}
            <PressableSpring
              onPress={() => setIsPreviewPlaying(!isPreviewPlaying)}
              scaleTo={0.92}
              haptic
              style={[styles.previewToggleBtn, isPreviewPlaying && styles.previewToggleBtnActive]}
            >
              <Ionicons
                name={isPreviewPlaying ? 'pause' : 'play'}
                size={16}
                color={isPreviewPlaying ? '#FFFFFF' : tokens.bg}
              />
              <Text style={[styles.previewToggleText, isPreviewPlaying && { color: '#FFFFFF' }]}>
                {isPreviewPlaying ? 'Arrêter' : 'Tester la phase'}
              </Text>
            </PressableSpring>
          </View>

          {/* ——— Bouton d'action express : Convertir les flèches du schéma ——— */}
          {stages.length === 1 && stages[0].movements.length === 0 ? (
            <PressableSpring
              onPress={handleConvertStaticArrows}
              scaleTo={0.95}
              haptic
              style={styles.convertBanner}
            >
              <MaterialCommunityIcons name="auto-fix" size={20} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.convertTitle}>Animer à partir des flèches statiques</Text>
                <Text style={styles.convertSub}>
                  Convertit automatiquement les flèches tracées sur votre schéma en animations.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
            </PressableSpring>
          ) : null}

          {/* ——— Assistant de Création de Mouvement (5 étapes simples) ——— */}
          <View style={styles.wizardCard}>
            <Text style={styles.wizardTitle}>AJOUTER UN DÉPLACEMENT TACTIQUE</Text>

            {/* Choix 1 : Sélection de l'acteur */}
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1. Acteur à déplacer :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actorRow}>
                {actors.map((actor) => {
                  const isPlayer = actor.type === 'player';
                  const label = isPlayer
                    ? `J${actor.num ?? ''} ${actor.label ? `(${actor.label})` : ''}`
                    : 'Ballon';
                  const isSelected = selectedActorId === actor.id;

                  return (
                    <PressableSpring
                      key={actor.id}
                      onPress={() => {
                        setSelectedActorId(actor.id);
                        if (!isPlayer) setMovementType('pass');
                      }}
                      scaleTo={0.92}
                      haptic
                      style={[styles.actorChip, isSelected && styles.actorChipSelected]}
                    >
                      <View
                        style={[
                          styles.actorDot,
                          {
                            backgroundColor: isPlayer
                              ? (actor as DiagramPlayerElement).color || tokens.accent
                              : '#FFFFFF',
                          },
                        ]}
                      />
                      <Text style={[styles.actorChipText, isSelected && styles.actorChipTextSelected]}>
                        {label}
                      </Text>
                    </PressableSpring>
                  );
                })}
              </ScrollView>
            </View>

            {/* Choix 2 : Destination */}
            <View style={styles.formRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>2. Destination :</Text>
                {destinationPoint ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                      Cible ({destinationPoint.x}%, {destinationPoint.y}%)
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 11, color: tokens.muted, fontStyle: 'italic' }}>
                    Touchez directement le terrain pour cibler
                  </Text>
                )}
              </View>
              <View style={styles.destPickerRow}>
                {[
                  { label: 'Avant centre', pt: { x: 50, y: 18 } },
                  { label: 'Aile gauche', pt: { x: 20, y: 22 } },
                  { label: 'Aile droite', pt: { x: 80, y: 22 } },
                  { label: 'Surface', pt: { x: 50, y: 12 } },
                  { label: 'Point de départ', pt: { x: 50, y: 40 } },
                ].map((dest) => (
                  <PressableSpring
                    key={dest.label}
                    onPress={() => setDestinationPoint(dest.pt)}
                    scaleTo={0.92}
                    haptic
                    style={[
                      styles.destChip,
                      destinationPoint?.x === dest.pt.x &&
                        destinationPoint?.y === dest.pt.y &&
                        styles.destChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.destChipText,
                        destinationPoint?.x === dest.pt.x &&
                          destinationPoint?.y === dest.pt.y &&
                          styles.destChipTextSelected,
                      ]}
                    >
                      {dest.label}
                    </Text>
                  </PressableSpring>
                ))}
              </View>
            </View>

            {/* Choix 3 : Type d'action */}
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>3. Action tactique :</Text>
              <View style={styles.actionTypeRow}>
                {[
                  { id: 'run', label: 'Course' },
                  { id: 'pass', label: 'Passe' },
                  { id: 'dribble', label: 'Conduite' },
                  { id: 'shot', label: 'Tir au but' },
                ].map((act) => (
                  <PressableSpring
                    key={act.id}
                    onPress={() => setMovementType(act.id as MovementActionType)}
                    scaleTo={0.92}
                    haptic
                    style={[
                      styles.actionTypeChip,
                      movementType === act.id && styles.actionTypeChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionTypeText,
                        movementType === act.id && styles.actionTypeTextSelected,
                      ]}
                    >
                      {act.label}
                    </Text>
                  </PressableSpring>
                ))}
              </View>
            </View>

            {/* Choix 4 : Synchronisation & Vitesse */}
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>4. Synchronisation :</Text>
              <View style={styles.syncRow}>
                <PressableSpring
                  onPress={() => setIsSimultaneous(true)}
                  scaleTo={0.94}
                  haptic
                  style={[styles.syncBtn, isSimultaneous && styles.syncBtnActive]}
                >
                  <Text style={[styles.syncBtnText, isSimultaneous && styles.syncBtnTextActive]}>
                    Simultané (en même temps)
                  </Text>
                </PressableSpring>
                <PressableSpring
                  onPress={() => setIsSimultaneous(false)}
                  scaleTo={0.94}
                  haptic
                  style={[styles.syncBtn, !isSimultaneous && styles.syncBtnActive]}
                >
                  <Text style={[styles.syncBtnText, !isSimultaneous && styles.syncBtnTextActive]}>
                    Consécutif (après l'action)
                  </Text>
                </PressableSpring>
              </View>
            </View>

            {/* Option trajectoire courbée */}
            <View style={styles.formRow}>
              <PressableSpring
                onPress={() => setIsCurved(!isCurved)}
                scaleTo={0.94}
                haptic
                style={[styles.curveToggle, isCurved && styles.curveToggleActive]}
              >
                <Ionicons
                  name={isCurved ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={isCurved ? tokens.accent : tokens.muted}
                />
                <Text style={styles.curveToggleText}>Trajectoire courbée (course d'appel / centre enroulé)</Text>
              </PressableSpring>
            </View>

            {/* Bouton de confirmation du mouvement */}
            <PressableSpring
              onPress={handleAddMovement}
              scaleTo={0.94}
              haptic
              style={styles.addMovementBtn}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addMovementBtnText}>Ajouter ce déplacement à la phase</Text>
            </PressableSpring>
          </View>

          {/* ——— Liste des Mouvements de l'Étape Courante ——— */}
          <View style={styles.movementsListCard}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listTitle}>
                DÉPLACEMENTS DE LA PHASE ({currentStage.movements.length})
              </Text>
              <View style={styles.stageActionsRow}>
                <PressableSpring onPress={handleDuplicateStage} scaleTo={0.92} haptic style={styles.actionChip}>
                  <Feather name="copy" size={13} color={tokens.foreground} />
                  <Text style={styles.actionChipText}>Dupliquer</Text>
                </PressableSpring>
                <PressableSpring onPress={handleDeleteStage} scaleTo={0.92} haptic style={styles.actionChipDanger}>
                  <Feather name="trash-2" size={13} color={proSemantic.danger} />
                  <Text style={styles.actionChipDangerText}>Supprimer</Text>
                </PressableSpring>
              </View>
            </View>

            {currentStage.movements.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucun déplacement dans cette phase. Utilisez l'assistant ci-dessus pour ajouter des courses et passes.
              </Text>
            ) : (
              currentStage.movements.map((mv, i) => (
                <View key={mv.id} style={styles.movementItem}>
                  <View style={styles.mvIndexBadge}>
                    <Text style={styles.mvIndexText}>{i + 1}</Text>
                  </View>
                  <View style={styles.mvInfo}>
                    <Text style={styles.mvName}>
                      {mv.actionType === 'pass'
                        ? 'Passe du ballon'
                        : mv.actionType === 'dribble'
                          ? 'Conduite avec ballon'
                          : mv.actionType === 'shot'
                            ? 'Frappe au but'
                            : 'Course de joueur'}
                    </Text>
                    <Text style={styles.mvTiming}>
                      Départ : {(mv.startDelayMs / 1000).toFixed(1)}s • Durée : {(mv.durationMs / 1000).toFixed(1)}s
                      {mv.controlPoint ? ' • Courbe' : ''}
                    </Text>
                  </View>
                  <PressableSpring
                    onPress={() => handleDeleteMovement(mv.id)}
                    scaleTo={0.9}
                    haptic
                    style={styles.mvDeleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={proSemantic.danger} />
                  </PressableSpring>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B130E',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleRow: {
    flex: 1,
    marginRight: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(proSemantic.info, 0.15),
    borderColor: withAlpha(proSemantic.info, 0.3),
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: proRadius.xs,
    marginBottom: 2,
  },
  badgeText: {
    color: proSemantic.info,
    fontSize: 9,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnDisabled: {
    opacity: 0.3,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: proSemantic.success,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: proRadius.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTabsContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
  },
  stageTabsScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stageTabActive: {
    backgroundColor: proSemantic.info,
    borderColor: proSemantic.info,
  },
  stageTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  stageTabTextActive: {
    color: '#FFFFFF',
  },
  movementCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  movementCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addStageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: proRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
  },
  addStageTabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  pitchContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewToggleBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  previewToggleBtnActive: {
    backgroundColor: proSemantic.danger,
  },
  previewToggleText: {
    color: '#0B130E',
    fontSize: 12,
    fontWeight: '800',
  },
  convertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: proRadius.md,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  convertTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  convertSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  wizardCard: {
    padding: 16,
    borderRadius: proRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  wizardTitle: {
    color: proSemantic.info,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  formRow: {
    gap: 6,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  actorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  actorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actorChipSelected: {
    borderColor: proSemantic.info,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  actorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actorChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  actorChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  destPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  destChipSelected: {
    backgroundColor: proSemantic.info,
    borderColor: proSemantic.info,
  },
  destChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  destChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionTypeChipSelected: {
    backgroundColor: proSemantic.success,
    borderColor: proSemantic.success,
  },
  actionTypeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  syncRow: {
    flexDirection: 'row',
    gap: 8,
  },
  syncBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  syncBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: proSemantic.info,
  },
  syncBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  syncBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  curveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  curveToggleActive: {},
  curveToggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  addMovementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: proSemantic.success,
    paddingVertical: 12,
    borderRadius: proRadius.md,
    marginTop: 4,
  },
  addMovementBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  movementsListCard: {
    padding: 16,
    borderRadius: proRadius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stageActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: proRadius.xs,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  actionChipDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: proRadius.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionChipDangerText: {
    color: proSemantic.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  mvIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  mvInfo: {
    flex: 1,
  },
  mvName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mvTiming: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 1,
  },
  mvDeleteBtn: {
    padding: 6,
  },
});
