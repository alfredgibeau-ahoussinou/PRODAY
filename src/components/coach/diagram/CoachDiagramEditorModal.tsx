import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachExerciseDiagramRenderer } from './CoachExerciseDiagramRenderer';
import { CoachDiagramAnimationEditor } from './CoachDiagramAnimationEditor';
import {
  createDefaultAnimationStage,
  type ExerciseDiagramAnimationData,
} from '../../../models/ExerciseDiagramAnimation';
import {
  computeStageInterpolation,
  buildStagedAnimationFromArrows,
} from '../../../utils/diagramAnimationEngine';
import {
  createEmptyDiagram,
  createPresetDiagram,
  cloneDiagram,
  DEFAULT_ARROW_COLORS,
  DEFAULT_EQUIPMENT_COLORS,
  DEFAULT_TEAM_COLORS,
  type ArrowKind,
  type DiagramArrowElement,
  type DiagramElement,
  type DiagramEquipmentElement,
  type DiagramPlayerElement,
  type DiagramTextElement,
  type DiagramZoneElement,
  type EquipmentType,
  type ExerciseDiagramData,
  type ExerciseStage,
  type PitchTemplate,
  type TeamSide,
} from '../../../models/ExerciseDiagram';
import { PressableSpring } from '../../../components/motion/PressableSpring';
import { useCoachTheme, useCoachThemedStyles } from '../../../features/coach/shell/CoachThemeContext';
import { proRadius, proSemantic } from '../../../theme/professionalDesign';
import { withAlpha } from '../../../utils/coachTeamTheme';
import type { CoachComponentTokens } from '../../../features/coach/theme/coachPitchTokens';

export type EditorToolTab = 'select' | 'equipment' | 'players' | 'arrows' | 'zones' | 'template';

export interface CoachDiagramEditorModalProps {
  visible: boolean;
  initialDiagram?: ExerciseDiagramData | null;
  drillType?: string;
  exerciseTitle?: string;
  isAttachedToSession?: boolean;
  onClose: () => void;
  onSave: (savedDiagram: ExerciseDiagramData, mode: 'save_original' | 'create_copy') => void;
}

export const CoachDiagramEditorModal: React.FC<CoachDiagramEditorModalProps> = ({
  visible,
  initialDiagram,
  drillType,
  exerciseTitle,
  isAttachedToSession = false,
  onClose,
  onSave,
}) => {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  // ——— État de base du schéma ———
  const [diagram, setDiagram] = useState<ExerciseDiagramData>(() => {
    if (initialDiagram) return initialDiagram;
    if (drillType) return createPresetDiagram(drillType, exerciseTitle);
    return createEmptyDiagram(exerciseTitle || 'Nouveau schéma');
  });

  const [elements, setElements] = useState<DiagramElement[]>(() => diagram.elements || []);
  const [pitchTemplate, setPitchTemplate] = useState<PitchTemplate>(diagram.pitchTemplate || 'half');
  const [diagramName, setDiagramName] = useState<string>(diagram.name || 'Schéma d’atelier');
  const [isSharedWithTeam, setIsSharedWithTeam] = useState<boolean>(Boolean(diagram.isSharedWithTeam));
  const [currentAnimation, setCurrentAnimation] = useState<ExerciseDiagramAnimationData | undefined>(
    diagram.animation,
  );
  const [showAnimationEditor, setShowAnimationEditor] = useState<boolean>(false);

  // ——— Gestion des étapes ———
  const [stages, setStages] = useState<ExerciseStage[]>(diagram.stages || []);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);

  // ——— Sélection & Outils ———
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorToolTab>('equipment');
  const [toolsCollapsed, setToolsCollapsed] = useState<boolean>(false);

  // Sous-options d'outils
  const [playerTeam, setPlayerTeam] = useState<TeamSide>('home');
  const [playerNum, setPlayerNum] = useState<string>('7');
  const [playerLabel, setPlayerLabel] = useState<string>('');

  const [equipmentType, setEquipmentType] = useState<EquipmentType>('cone');
  const [equipmentColor, setEquipmentColor] = useState<string>('#FF6B00');
  const [arrowKind, setArrowKind] = useState<ArrowKind>('movement');
  const [isCurvedArrow, setIsCurvedArrow] = useState<boolean>(false);
  const [arrowStartPoint, setArrowStartPoint] = useState<{ x: number; y: number } | null>(null);

  const [zoneLabel, setZoneLabel] = useState<string>('Zone');
  const [textInputVal, setTextInputVal] = useState<string>('Consigne');

  // Animation intégrée en direct
  const [isEditorPlaying, setIsEditorPlaying] = useState<boolean>(false);
  const [editorPreviewTimeMs, setEditorPreviewTimeMs] = useState<number>(0);

  // ——— Historique Undo / Redo ———
  const [historyPast, setHistoryPast] = useState<DiagramElement[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<DiagramElement[][]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Synchronisation lors de l'ouverture
  useEffect(() => {
    if (visible) {
      const init = initialDiagram
        ? initialDiagram
        : drillType
          ? createPresetDiagram(drillType, exerciseTitle)
          : createEmptyDiagram(exerciseTitle || 'Nouveau schéma');
      setDiagram(init);
      setElements(init.elements || []);
      setPitchTemplate(init.pitchTemplate || 'half');
      setDiagramName(init.name || 'Schéma d’atelier');
      setIsSharedWithTeam(Boolean(init.isSharedWithTeam));
      setStages(init.stages || []);
      setCurrentAnimation(init.animation);
      setShowAnimationEditor(false);
      setIsEditorPlaying(false);
      setEditorPreviewTimeMs(0);
      setCurrentStageIdx(0);
      setSelectedId(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setHasUnsavedChanges(false);
      setArrowStartPoint(null);
    }
  }, [visible, initialDiagram, drillType, exerciseTitle]);

  // Boucle d'animation en direct dans l'éditeur
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;

    if (!isEditorPlaying) {
      setEditorPreviewTimeMs(0);
      return;
    }

    const currentAnim =
      currentAnimation && currentAnimation.stages && currentAnimation.stages.length > 0
        ? currentAnimation
        : buildStagedAnimationFromArrows(elements);

    const activeStage = currentAnim?.stages?.[0];
    const totalDuration = (activeStage?.durationMs || 2500) + (activeStage?.pauseAfterMs || 600);

    const loopTick = (now: number) => {
      if (lastTime === null) lastTime = now;
      const delta = now - lastTime;
      lastTime = now;

      setEditorPreviewTimeMs((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) return 0;
        return next;
      });

      animId = requestAnimationFrame(loopTick);
    };

    animId = requestAnimationFrame(loopTick);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isEditorPlaying, currentAnimation, elements]);

  // Éléments interpolés pendant la lecture en direct
  const displayElements = useMemo(() => {
    if (!isEditorPlaying) return elements;
    const currentAnim =
      currentAnimation && currentAnimation.stages && currentAnimation.stages.length > 0
        ? currentAnimation
        : buildStagedAnimationFromArrows(elements);
    const activeStage = currentAnim?.stages?.[0];
    if (!activeStage) return elements;
    return computeStageInterpolation(activeStage, editorPreviewTimeMs, elements).elements;
  }, [isEditorPlaying, editorPreviewTimeMs, currentAnimation, elements]);

  const handleGenerateAnimationFromArrows = useCallback(() => {
    const generated = buildStagedAnimationFromArrows(elements);
    setCurrentAnimation(generated);
    setHasUnsavedChanges(true);
    setIsEditorPlaying(true);
  }, [elements]);

  const pushHistory = useCallback(
    (newElements: DiagramElement[]) => {
      setHistoryPast((prev) => [elements, ...prev.slice(0, 24)]);
      setHistoryFuture([]);
      setElements(newElements);
      setHasUnsavedChanges(true);
    },
    [elements],
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const [previous, ...rest] = historyPast;
    setHistoryFuture((fut) => [elements, ...fut]);
    setElements(previous);
    setHistoryPast(rest);
    setHasUnsavedChanges(true);
  }, [historyPast, elements]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const [next, ...rest] = historyFuture;
    setHistoryPast((past) => [elements, ...past]);
    setElements(next);
    setHistoryFuture(rest);
    setHasUnsavedChanges(true);
  }, [historyFuture, elements]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId],
  );

  // Nudge / Déplacement fin
  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (!selectedId) return;
      const updated = elements.map((el) => {
        if (el.id !== selectedId) return el;
        if (el.type === 'arrow') {
          return {
            ...el,
            fromX: Math.max(0, Math.min(100, el.fromX + dx)),
            fromY: Math.max(0, Math.min(64, el.fromY + dy)),
            toX: Math.max(0, Math.min(100, el.toX + dx)),
            toY: Math.max(0, Math.min(64, el.toY + dy)),
            controlX: el.controlX != null ? Math.max(0, Math.min(100, el.controlX + dx)) : undefined,
            controlY: el.controlY != null ? Math.max(0, Math.min(64, el.controlY + dy)) : undefined,
          };
        }
        return {
          ...el,
          x: Math.max(0, Math.min(100, el.x + dx)),
          y: Math.max(0, Math.min(64, el.y + dy)),
        };
      });
      pushHistory(updated);
    },
    [selectedId, elements, pushHistory],
  );

  // Rotation de l'élément sélectionné
  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = elements.map((el) => {
      if (el.id !== selectedId) return el;
      if (el.type === 'equipment') {
        const nextRot = ((el.rotation || 0) + 45) % 360;
        return { ...el, rotation: nextRot };
      }
      return el;
    });
    pushHistory(updated);
  }, [selectedId, elements, pushHistory]);

  // Duplication de l'élément sélectionné
  const duplicateSelected = useCallback(() => {
    if (!selectedElement) return;
    const newId = `${selectedElement.id}_dup_${Date.now()}`;
    let cloned: DiagramElement;
    if (selectedElement.type === 'arrow') {
      cloned = {
        ...selectedElement,
        id: newId,
        fromX: Math.min(95, selectedElement.fromX + 4),
        fromY: Math.min(60, selectedElement.fromY + 4),
        toX: Math.min(95, selectedElement.toX + 4),
        toY: Math.min(60, selectedElement.toY + 4),
      };
    } else {
      cloned = {
        ...selectedElement,
        id: newId,
        x: Math.min(95, selectedElement.x + 4),
        y: Math.min(60, selectedElement.y + 4),
      };
    }
    pushHistory([...elements, cloned]);
    setSelectedId(newId);
  }, [selectedElement, elements, pushHistory]);

  // Suppression de l'élément sélectionné
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, elements, pushHistory]);

  // Interaction tactile sur le canevas du terrain (Style Tactical Slate)
  const handlePitchTouch = (event: GestureResponderEvent) => {
    if (isEditorPlaying) {
      setIsEditorPlaying(false);
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const normX = Math.round(Math.max(4, Math.min(96, (locationX / pitchWidth) * 100)));
    const normY = Math.round(Math.max(4, Math.min(60, (locationY / pitchHeight) * 64)));

    if (activeTab === 'arrows') {
      if (!arrowStartPoint) {
        setArrowStartPoint({ x: normX, y: normY });
      } else {
        const newArrow: DiagramArrowElement = {
          id: `arrow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'arrow',
          kind: arrowKind,
          fromX: arrowStartPoint.x,
          fromY: arrowStartPoint.y,
          toX: normX,
          toY: normY,
          controlX: isCurvedArrow
            ? Math.round((arrowStartPoint.x + normX) / 2 + (normY > arrowStartPoint.y ? 8 : -8))
            : undefined,
          controlY: isCurvedArrow
            ? Math.round((arrowStartPoint.y + normY) / 2 + (normX > arrowStartPoint.x ? -8 : 8))
            : undefined,
          color: DEFAULT_ARROW_COLORS[arrowKind],
        };
        pushHistory([...elements, newArrow]);
        setArrowStartPoint(null);
      }
      return;
    }

    // Mode Curseur / Déplacement : si un élément est sélectionné, on le déplace
    if (activeTab === 'select' && selectedId) {
      const updated = elements.map((el) => {
        if (el.id !== selectedId) return el;
        if (el.type === 'arrow') return el;
        return { ...el, x: normX, y: normY };
      });
      pushHistory(updated);
      return;
    }

    // Mode Plots & Matériel : chaque tap ajoute un nouvel équipement sans téléporter les précédents
    if (activeTab === 'equipment') {
      const newEq: DiagramEquipmentElement = {
        id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'equipment',
        equipmentType,
        x: normX,
        y: normY,
        width: equipmentType === 'goal' ? 24 : equipmentType === 'mini_goal' ? 6 : undefined,
        height: equipmentType === 'goal' ? 4 : equipmentType === 'mini_goal' ? 10 : undefined,
        color: equipmentColor || DEFAULT_EQUIPMENT_COLORS[equipmentType],
      };
      pushHistory([...elements, newEq]);
      // En mode ajout continu de plots, on ne bloque pas les prochains taps
      setSelectedId(null);
      return;
    }

    // Mode Joueurs : chaque tap ajoute un joueur sur le terrain
    if (activeTab === 'players') {
      const num = parseInt(playerNum, 10);
      const newPlayer: DiagramPlayerElement = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'player',
        x: normX,
        y: normY,
        num: Number.isFinite(num) ? num : undefined,
        label: playerLabel.trim() || undefined,
        team: playerTeam,
        color: DEFAULT_TEAM_COLORS[playerTeam],
      };
      pushHistory([...elements, newPlayer]);
      setSelectedId(null);
      return;
    }

    // Mode Zones
    if (activeTab === 'zones') {
      const newZone: DiagramZoneElement = {
        id: `zone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'zone',
        x: Math.max(4, normX - 15),
        y: Math.max(4, normY - 10),
        width: 30,
        height: 20,
        label: zoneLabel.trim() || undefined,
        color: proSemantic.success,
        style: 'dashed',
        fillOpacity: 0.1,
      };
      pushHistory([...elements, newZone]);
      setSelectedId(null);
      return;
    }

    // Tap dans le vide sans outil d'ajout : désélectionne
    setSelectedId(null);
  };

  // Dimensions réactives du terrain
  const maxPitchWidth = Math.min(winWidth - 28, 560);
  const pitchWidth = maxPitchWidth;
  const pitchHeight = Math.round((pitchWidth * 64) / 100);

  // Sauvegarde avec gestion des options (original vs copie)
  const handleSaveRequest = () => {
    const finalDiagram: ExerciseDiagramData = {
      ...diagram,
      name: diagramName.trim() || 'Schéma d’atelier',
      pitchTemplate,
      elements,
      stages,
      animation: currentAnimation,
      isSharedWithTeam,
      updatedAt: new Date().toISOString(),
    };

    if (isAttachedToSession && initialDiagram && !initialDiagram.isTemplate) {
      Alert.alert(
        'Enregistrer le schéma',
        'Souhaitez-vous modifier l’original dans votre bibliothèque ou enregistrer une copie propre à cet atelier ?',
        [
          {
            text: 'Modifier l’original',
            onPress: () => {
              setHasUnsavedChanges(false);
              onSave(finalDiagram, 'save_original');
            },
          },
          {
            text: 'Créer une copie pour cette séance',
            onPress: () => {
              const copy = cloneDiagram(finalDiagram);
              setHasUnsavedChanges(false);
              onSave(copy, 'create_copy');
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ],
      );
    } else {
      setHasUnsavedChanges(false);
      onSave(finalDiagram, 'save_original');
    }
  };

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Modifications non enregistrées',
        'Voulez-vous quitter l’éditeur ? Les modifications apportées seront perdues.',
        [
          { text: 'Continuer l’édition', style: 'cancel' },
          { text: 'Quitter sans enregistrer', style: 'destructive', onPress: onClose },
        ],
      );
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  // Ajout d'une étape
  const addStage = () => {
    const newStage: ExerciseStage = {
      id: `stage_${Date.now()}`,
      name: `Étape ${stages.length + 1}`,
      instructions: 'Consignes de cette étape',
      elements: [...elements],
    };
    setStages([...stages, newStage]);
    setCurrentStageIdx(stages.length);
    setHasUnsavedChanges(true);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        {/* ——— Barre Supérieure : Titre, Undo/Redo & Enregistrement ——— */}
        <View style={styles.headerBar}>
          <PressableSpring onPress={handleClose} scaleTo={0.9} haptic style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={tokens.foreground} />
          </PressableSpring>

          <View style={styles.titleInputWrap}>
            <TextInput
              style={styles.titleInput}
              value={diagramName}
              onChangeText={(text) => {
                setDiagramName(text);
                setHasUnsavedChanges(true);
              }}
              placeholder="Nom du schéma d’atelier"
              placeholderTextColor={tokens.muted}
            />
          </View>

          <View style={styles.topActions}>
            <PressableSpring
              onPress={() => setShowAnimationEditor(true)}
              scaleTo={0.94}
              haptic
              style={styles.animateToolBtn}
              accessibilityLabel="Animer le schéma"
            >
              <MaterialCommunityIcons
                name="movie-play-outline"
                size={16}
                color={tokens.accent}
              />
              <Text style={[styles.animateToolBtnText, { color: tokens.accent }]}>
                {currentAnimation && currentAnimation.stages && currentAnimation.stages.length > 0
                  ? `Animé (${currentAnimation.stages.length})`
                  : 'Animer'}
              </Text>
            </PressableSpring>

            <PressableSpring
              onPress={handleUndo}
              disabled={historyPast.length === 0}
              scaleTo={0.9}
              haptic
              style={[styles.historyBtn, historyPast.length === 0 && styles.disabledBtn]}
            >
              <Ionicons name="arrow-undo" size={16} color={tokens.foreground} />
            </PressableSpring>

            <PressableSpring
              onPress={handleRedo}
              disabled={historyFuture.length === 0}
              scaleTo={0.9}
              haptic
              style={[styles.historyBtn, historyFuture.length === 0 && styles.disabledBtn]}
            >
              <Ionicons name="arrow-redo" size={16} color={tokens.foreground} />
            </PressableSpring>

            <PressableSpring
              onPress={handleSaveRequest}
              scaleTo={0.96}
              haptic
              style={[styles.saveBtn, { backgroundColor: tokens.accent }]}
            >
              <Feather name="check" size={15} color={tokens.onAccent} />
              <Text style={[styles.saveBtnText, { color: tokens.onAccent }]}>Enregistrer</Text>
            </PressableSpring>
          </View>
        </View>

        {/* ——— Terrain de dessin ——— */}
        <View style={styles.canvasContainer}>
          {/* Sélecteur direct de gabarit de terrain (Tactical Slate) */}
          <View style={styles.pitchTemplateSegmented}>
            {[
              { id: 'full', label: 'Grand terrain', icon: 'soccer-field' },
              { id: 'half', label: 'Demi-terrain', icon: 'crop-portrait' },
              { id: 'box', label: 'Surface / Boîte', icon: 'vector-square' },
              { id: 'blank', label: 'Espace libre', icon: 'layers-outline' },
            ].map((tpl) => {
              const active = pitchTemplate === tpl.id;
              return (
                <PressableSpring
                  key={tpl.id}
                  onPress={() => {
                    setPitchTemplate(tpl.id as PitchTemplate);
                    setHasUnsavedChanges(true);
                  }}
                  scaleTo={0.95}
                  haptic
                  style={[styles.tplBtn, active && styles.tplBtnActive]}
                >
                  <MaterialCommunityIcons
                    name={tpl.icon as any}
                    size={14}
                    color={active ? tokens.accent : tokens.muted}
                  />
                  <Text style={[styles.tplBtnText, active && styles.tplBtnTextActive]}>
                    {tpl.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>

          <View
            style={[
              styles.pitchWrap,
              { width: pitchWidth, height: pitchHeight, borderColor: tokens.border },
            ]}
            onTouchEnd={handlePitchTouch}
          >
            <CoachExerciseDiagramRenderer
              diagram={{
                ...diagram,
                pitchTemplate,
                elements: isEditorPlaying ? displayElements : elements,
              }}
              width="100%"
              height="100%"
              selectedElementId={selectedId}
              onSelectElement={(el) => {
                if (isEditorPlaying) setIsEditorPlaying(false);
                setSelectedId(el ? el.id : null);
              }}
              isInteractive={!isEditorPlaying}
            />

            {/* Barre flottante d'animation Tacticslot directement sur le terrain */}
            <View style={styles.floatingPitchBar}>
              <PressableSpring
                onPress={() => setIsEditorPlaying(!isEditorPlaying)}
                scaleTo={0.92}
                haptic
                style={[styles.playPitchBtn, isEditorPlaying && styles.playPitchBtnActive]}
              >
                <Ionicons
                  name={isEditorPlaying ? 'pause' : 'play'}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.playPitchBtnText}>
                  {isEditorPlaying ? 'Arrêter' : 'Tester l’animation'}
                </Text>
              </PressableSpring>

              {elements.some((el) => el.type === 'arrow') ? (
                <PressableSpring
                  onPress={handleGenerateAnimationFromArrows}
                  scaleTo={0.92}
                  haptic
                  style={styles.syncArrowsBtn}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color="#F59E0B" />
                  <Text style={styles.syncArrowsBtnText}>Générer animation</Text>
                </PressableSpring>
              ) : null}
            </View>
          </View>

          {/* Contrôles de réglage fin de l'objet sélectionné (Nudge, Rotation, Duplication, Poubelle) */}
          {selectedElement ? (
            <View style={styles.selectionToolbar}>
              <View style={styles.nudgeGrid}>
                <PressableSpring
                  onPress={() => nudgeSelected(0, -2)}
                  scaleTo={0.88}
                  haptic
                  style={styles.nudgeBtn}
                >
                  <Ionicons name="caret-up" size={16} color={tokens.foreground} />
                </PressableSpring>
                <View style={styles.nudgeRow}>
                  <PressableSpring
                    onPress={() => nudgeSelected(-2, 0)}
                    scaleTo={0.88}
                    haptic
                    style={styles.nudgeBtn}
                  >
                    <Ionicons name="caret-back" size={16} color={tokens.foreground} />
                  </PressableSpring>
                  <PressableSpring
                    onPress={() => nudgeSelected(2, 0)}
                    scaleTo={0.88}
                    haptic
                    style={styles.nudgeBtn}
                  >
                    <Ionicons name="caret-forward" size={16} color={tokens.foreground} />
                  </PressableSpring>
                </View>
                <PressableSpring
                  onPress={() => nudgeSelected(0, 2)}
                  scaleTo={0.88}
                  haptic
                  style={styles.nudgeBtn}
                >
                  <Ionicons name="caret-down" size={16} color={tokens.foreground} />
                </PressableSpring>
              </View>

              <View style={styles.actionCol}>
                {selectedElement.type === 'equipment' ? (
                  <PressableSpring
                    onPress={rotateSelected}
                    scaleTo={0.92}
                    haptic
                    style={styles.toolActionBtn}
                  >
                    <MaterialCommunityIcons name="rotate-right" size={16} color={tokens.accent} />
                    <Text style={[styles.toolActionText, { color: tokens.accent }]}>Pivoter</Text>
                  </PressableSpring>
                ) : null}

                <PressableSpring
                  onPress={duplicateSelected}
                  scaleTo={0.92}
                  haptic
                  style={styles.toolActionBtn}
                >
                  <Feather name="copy" size={14} color={tokens.accent} />
                  <Text style={[styles.toolActionText, { color: tokens.accent }]}>Dupliquer</Text>
                </PressableSpring>

                <PressableSpring
                  onPress={deleteSelected}
                  scaleTo={0.92}
                  haptic
                  style={[styles.toolActionBtn, styles.deleteActionBtn]}
                >
                  <Ionicons name="trash-outline" size={15} color={proSemantic.danger} />
                  <Text style={[styles.toolActionText, { color: proSemantic.danger }]}>Suppr.</Text>
                </PressableSpring>

                <PressableSpring
                  onPress={() => setSelectedId(null)}
                  scaleTo={0.92}
                  haptic
                  style={styles.toolActionBtn}
                >
                  <Ionicons name="close" size={14} color={tokens.muted} />
                  <Text style={[styles.toolActionText, { color: tokens.muted }]}>Terminer</Text>
                </PressableSpring>
              </View>
            </View>
          ) : (
            <View style={styles.hintBar}>
              <Ionicons name="hand-left-outline" size={14} color={tokens.muted} />
              <Text style={styles.hintText}>
                {activeTab === 'equipment'
                  ? 'Touchez le terrain pour poser un plot ou équipement (plusieurs d’affilée possible)'
                  : activeTab === 'players'
                    ? 'Touchez le terrain pour poser un joueur'
                    : activeTab === 'arrows' && arrowStartPoint
                      ? 'Touchez la destination pour terminer le tracé de la flèche'
                      : activeTab === 'select'
                        ? 'Touchez un élément sur le terrain pour le sélectionner ou le déplacer'
                        : 'Touchez le terrain pour placer l’élément choisi ci-dessous'}
              </Text>
            </View>
          )}
        </View>

        {/* ——— Palette d'outils rétractable ——— */}
        <View style={styles.paletteContainer}>
          {/* Onglets de la boîte à outils */}
          <View style={styles.tabsRow}>
            {(
              [
                { id: 'select', icon: 'cursor-default-outline', label: 'Curseur' },
                { id: 'equipment', icon: 'cone', label: 'Plots & Matériel' },
                { id: 'players', icon: 'account-group', label: 'Joueurs' },
                { id: 'arrows', icon: 'vector-line', label: 'Tracés' },
                { id: 'zones', icon: 'selection-drag', label: 'Zones' },
                { id: 'template', icon: 'soccer-field', label: 'Terrain' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <PressableSpring
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setArrowStartPoint(null);
                  }}
                  scaleTo={0.94}
                  haptic
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as never}
                    size={16}
                    color={active ? tokens.accent : tokens.muted}
                  />
                  <Text style={[styles.tabLabel, { color: active ? tokens.accent : tokens.muted }]}>
                    {tab.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>

          {/* Contenu de l'onglet actif */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContent}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'select' && (
              <View style={styles.subToolRow}>
                <Text style={styles.hintSubText}>
                  Touchez un joueur ou plot sur le terrain pour le sélectionner, le déplacer ou le supprimer.
                </Text>
              </View>
            )}

            {activeTab === 'players' && (
              <View style={styles.subToolRow}>
                {(['home', 'away', 'neutral', 'gk'] as TeamSide[]).map((team) => (
                  <PressableSpring
                    key={team}
                    onPress={() => setPlayerTeam(team)}
                    scaleTo={0.94}
                    haptic
                    style={[
                      styles.paletteChip,
                      playerTeam === team && { borderColor: DEFAULT_TEAM_COLORS[team] },
                    ]}
                  >
                    <View
                      style={[styles.colorDot, { backgroundColor: DEFAULT_TEAM_COLORS[team] }]}
                    />
                    <Text style={styles.paletteChipText}>
                      {team === 'home'
                        ? 'Bleus'
                        : team === 'away'
                          ? 'Rouges'
                          : team === 'gk'
                            ? 'Gardien'
                            : 'Joker'}
                    </Text>
                  </PressableSpring>
                ))}
                <TextInput
                  style={styles.miniInput}
                  value={playerNum}
                  onChangeText={setPlayerNum}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="N°"
                  placeholderTextColor={tokens.muted}
                />
              </View>
            )}

            {activeTab === 'equipment' && (
              <View style={styles.subToolRow}>
                {(
                  [
                    { id: 'cone', label: 'Plot / Cône' },
                    { id: 'disc_cone', label: 'Coupelle' },
                    { id: 'ball', label: 'Ballon' },
                    { id: 'mini_goal', label: 'Mini-but' },
                    { id: 'goal', label: 'Grand but' },
                    { id: 'mannequin', label: 'Mannequin' },
                    { id: 'ladder', label: 'Échelle' },
                    { id: 'hurdle', label: 'Haie' },
                  ] as { id: EquipmentType; label: string }[]
                ).map((eq) => (
                  <PressableSpring
                    key={eq.id}
                    onPress={() => setEquipmentType(eq.id)}
                    scaleTo={0.94}
                    haptic
                    style={[styles.paletteChip, equipmentType === eq.id && styles.paletteChipActive]}
                  >
                    <Text
                      style={[
                        styles.paletteChipText,
                        equipmentType === eq.id && { color: tokens.accent },
                      ]}
                    >
                      {eq.label}
                    </Text>
                  </PressableSpring>
                ))}

                {/* Sélecteur de couleur des plots */}
                <View style={styles.colorPickerInline}>
                  {[
                    { color: '#FF6B00', label: 'Orange' },
                    { color: '#FACC15', label: 'Jaune' },
                    { color: '#EF4444', label: 'Rouge' },
                    { color: '#FFFFFF', label: 'Blanc' },
                    { color: '#3B82F6', label: 'Bleu' },
                  ].map((c) => (
                    <PressableSpring
                      key={c.color}
                      onPress={() => setEquipmentColor(c.color)}
                      style={[
                        styles.colorDotBtn,
                        { backgroundColor: c.color },
                        equipmentColor === c.color && styles.colorDotBtnActive,
                      ]}
                    >
                      <View />
                    </PressableSpring>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'arrows' && (
              <View style={styles.subToolRow}>
                {(
                  [
                    { id: 'movement', label: 'Course (vert)' },
                    { id: 'pass', label: 'Passe (cyan)' },
                    { id: 'dribble', label: 'Dribble (ambre)' },
                    { id: 'shot', label: 'Tir au but (rouge)' },
                  ] as { id: ArrowKind; label: string }[]
                ).map((arr) => (
                  <PressableSpring
                    key={arr.id}
                    onPress={() => setArrowKind(arr.id)}
                    scaleTo={0.94}
                    haptic
                    style={[styles.paletteChip, arrowKind === arr.id && styles.paletteChipActive]}
                  >
                    <Text
                      style={[
                        styles.paletteChipText,
                        arrowKind === arr.id && { color: tokens.accent },
                      ]}
                    >
                      {arr.label}
                    </Text>
                  </PressableSpring>
                ))}
                <PressableSpring
                  onPress={() => setIsCurvedArrow(!isCurvedArrow)}
                  scaleTo={0.94}
                  haptic
                  style={[styles.paletteChip, isCurvedArrow && styles.paletteChipActive]}
                >
                  <Text
                    style={[
                      styles.paletteChipText,
                      isCurvedArrow && { color: tokens.accent, fontWeight: '800' },
                    ]}
                  >
                    {isCurvedArrow ? '✓ Courbé' : 'Droit'}
                  </Text>
                </PressableSpring>
              </View>
            )}

            {activeTab === 'zones' && (
              <View style={styles.subToolRow}>
                <TextInput
                  style={[styles.miniInput, { width: 100 }]}
                  value={zoneLabel}
                  onChangeText={setZoneLabel}
                  placeholder="Nom de zone"
                  placeholderTextColor={tokens.muted}
                />
                <Text style={styles.hintSubText}>
                  Touchez le terrain pour placer une zone d'exercice délimitée
                </Text>
              </View>
            )}

            {activeTab === 'template' && (
              <View style={styles.subToolRow}>
                {(
                  [
                    { id: 'half', label: 'Demi-terrain' },
                    { id: 'full', label: 'Terrain complet' },
                    { id: 'box', label: 'Zone cadrée' },
                    { id: 'blank', label: 'Espace libre' },
                  ] as { id: PitchTemplate; label: string }[]
                ).map((tpl) => (
                  <PressableSpring
                    key={tpl.id}
                    onPress={() => {
                      setPitchTemplate(tpl.id);
                      setHasUnsavedChanges(true);
                    }}
                    scaleTo={0.94}
                    haptic
                    style={[
                      styles.paletteChip,
                      pitchTemplate === tpl.id && styles.paletteChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paletteChipText,
                        pitchTemplate === tpl.id && { color: tokens.accent },
                      ]}
                    >
                      {tpl.label}
                    </Text>
                  </PressableSpring>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bas : Partage équipe et gestion des étapes */}
          <View style={styles.footerRow}>
            <PressableSpring
              onPress={() => {
                setIsSharedWithTeam(!isSharedWithTeam);
                setHasUnsavedChanges(true);
              }}
              scaleTo={0.96}
              haptic
              style={styles.shareToggle}
            >
              <Ionicons
                name={isSharedWithTeam ? 'checkbox' : 'square-outline'}
                size={18}
                color={isSharedWithTeam ? tokens.accent : tokens.muted}
              />
              <Text style={styles.shareToggleText}>Partager avec l'équipe</Text>
            </PressableSpring>

            <PressableSpring onPress={addStage} scaleTo={0.96} haptic style={styles.stageAddBtn}>
              <Ionicons name="add" size={15} color={tokens.accent} />
              <Text style={[styles.stageAddText, { color: tokens.accent }]}>
                {stages.length > 0 ? `Ajouter étape (${stages.length + 1})` : 'Créer une étape 2'}
              </Text>
            </PressableSpring>
          </View>
        </View>

        {/* Modal d'édition d'animation vectorielle */}
        <CoachDiagramAnimationEditor
          visible={showAnimationEditor}
          diagram={{
            ...diagram,
            name: diagramName,
            pitchTemplate,
            elements,
            stages,
            animation: currentAnimation,
          }}
          onClose={() => setShowAnimationEditor(false)}
          onSaveAnimation={(savedAnim) => {
            setCurrentAnimation(savedAnim);
            setHasUnsavedChanges(true);
            setShowAnimationEditor(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (tokens: CoachComponentTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.surface,
      gap: 8,
    },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    titleInputWrap: {
      flex: 1,
    },
    titleInput: {
      fontSize: 14,
      fontWeight: '700',
      color: tokens.foreground,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    animateToolBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: withAlpha(tokens.accent, 0.1),
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.35),
    },
    animateToolBtnText: {
      fontSize: 11,
      fontWeight: '700',
    },
    historyBtn: {
      width: 32,
      height: 32,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    disabledBtn: {
      opacity: 0.35,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: proRadius.md,
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '800',
    },
    canvasContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 10,
    },
    pitchTemplateSegmented: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
      backgroundColor: tokens.elevated,
      padding: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    tplBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
    },
    tplBtnActive: {
      backgroundColor: withAlpha(tokens.accent, 0.16),
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    tplBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: tokens.muted,
    },
    tplBtnTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    floatingPitchBar: {
      position: 'absolute',
      bottom: 8,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    playPitchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#15803D',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    playPitchBtnActive: {
      backgroundColor: '#DC2626',
    },
    playPitchBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },
    syncArrowsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    syncArrowsBtnText: {
      color: '#F59E0B',
      fontSize: 11,
      fontWeight: '700',
    },
    colorPickerInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 6,
      paddingLeft: 6,
      borderLeftWidth: 1,
      borderLeftColor: tokens.border,
    },
    colorDotBtn: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    colorDotBtnActive: {
      borderWidth: 2,
      borderColor: '#FFFFFF',
      transform: [{ scale: 1.2 }],
    },
    pitchWrap: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    selectionToolbar: {
      position: 'absolute',
      bottom: 12,
      right: 14,
      backgroundColor: withAlpha(tokens.surface, 0.95),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
    },
    nudgeGrid: {
      alignItems: 'center',
    },
    nudgeRow: {
      flexDirection: 'row',
      gap: 4,
      marginVertical: 2,
    },
    nudgeBtn: {
      width: 28,
      height: 28,
      borderRadius: 4,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    actionCol: {
      gap: 5,
    },
    toolActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tokens.elevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    deleteActionBtn: {
      borderColor: withAlpha(proSemantic.danger, 0.4),
    },
    toolActionText: {
      fontSize: 11,
      fontWeight: '700',
    },
    hintBar: {
      position: 'absolute',
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: withAlpha(tokens.surface, 0.85),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    hintText: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '600',
    },
    paletteContainer: {
      backgroundColor: tokens.surface,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      paddingBottom: 6,
    },
    tabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: withAlpha(tokens.border, 0.5),
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 9,
    },
    tabBtnActive: {
      borderBottomWidth: 2,
      borderBottomColor: tokens.accent,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '700',
    },
    optionsContent: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      gap: 8,
    },
    subToolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paletteChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    paletteChipActive: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.12),
    },
    paletteChipText: {
      fontSize: 12,
      color: tokens.foreground,
      fontWeight: '600',
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    miniInput: {
      width: 44,
      height: 32,
      borderRadius: 6,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '800',
      color: tokens.foreground,
    },
    hintSubText: {
      fontSize: 11,
      color: tokens.muted,
      marginLeft: 6,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: withAlpha(tokens.border, 0.3),
    },
    shareToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    shareToggleText: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '600',
    },
    stageAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.4),
      backgroundColor: withAlpha(tokens.accent, 0.08),
    },
    stageAddText: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
