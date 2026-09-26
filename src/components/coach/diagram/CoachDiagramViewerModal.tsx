import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachExerciseDiagramRenderer } from './CoachExerciseDiagramRenderer';
import {
  type ExerciseDiagramData,
} from '../../../models/ExerciseDiagram';
import { PressableSpring } from '../../../components/motion/PressableSpring';
import { exportOrPrintDiagram } from '../../../utils/coachDiagramExport';
import { CoachDiagramPlayerPresentationModal } from './CoachDiagramPlayerPresentationModal';
import { useDiagramAnimationPlayback } from '../../../hooks/useDiagramAnimationPlayback';
import { useCoachTheme, useCoachThemedStyles } from '../../../features/coach/shell/CoachThemeContext';
import { proRadius, proSemantic, proSpace } from '../../../theme/professionalDesign';
import { withAlpha } from '../../../utils/coachTeamTheme';
import type { CoachComponentTokens } from '../../../features/coach/theme/coachPitchTokens';

export interface CoachDiagramViewerModalProps {
  visible: boolean;
  diagram: ExerciseDiagramData;
  exerciseName?: string;
  objective?: string;
  instructions?: string;
  durationMin?: number;
  intensity?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export const CoachDiagramViewerModal: React.FC<CoachDiagramViewerModalProps> = ({
  visible,
  diagram,
  exerciseName,
  objective,
  instructions,
  durationMin,
  intensity,
  onClose,
  onEdit,
}) => {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Mode présentation (« Montrer aux joueurs »)
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Étape courante de l'exercice
  const [stageIndex, setStageIndex] = useState(0);

  // Zoom & Pan
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Suivi tactile multi-points (Pinch-to-zoom & Pan)
  const [touchState, setTouchState] = useState<{
    lastX: number;
    lastY: number;
    initialDistance: number | null;
    initialScale: number;
  }>({
    lastX: 0,
    lastY: 0,
    initialDistance: null,
    initialScale: 1,
  });

  const stages = diagram.stages || [];
  const hasStages = stages.length > 0;
  const currentStage = hasStages ? stages[Math.min(stageIndex, stages.length - 1)] : null;

  const hasAnimation = Boolean(
    diagram.animation && diagram.animation.stages && diagram.animation.stages.length > 0,
  );
  const [isAnimatedMode, setIsAnimatedMode] = useState<boolean>(hasAnimation);
  const [showPlayerPresentation, setShowPlayerPresentation] = useState<boolean>(false);

  const [animState, animActions] = useDiagramAnimationPlayback(diagram, {
    autoPlay: false,
    initialSpeed: 1.0,
  });

  const activeElements =
    isAnimatedMode && hasAnimation
      ? animState.interpolatedElements
      : currentStage && currentStage.elements && currentStage.elements.length > 0
        ? currentStage.elements
        : diagram.elements;

  const activeMovements = isAnimatedMode && hasAnimation ? animState.activeMovements : undefined;

  const displayTitle = exerciseName || diagram.name || 'Atelier d’entraînement';
  const displayObjective = objective || diagram.objective || '';
  const displayInstructions =
    (currentStage?.instructions ? `${currentStage.instructions}\n\n` : '') +
    (instructions || diagram.instructions || '');

  // Calcul du conteneur de terrain (ratio 100:64)
  const isLandscape = winWidth > winHeight;
  const maxPitchW = isPresentationMode
    ? Math.min(winWidth - 24, isLandscape ? winHeight * 1.5 : winWidth)
    : Math.min(winWidth - 32, 640);
  const pitchH = Math.round((maxPitchW * 64) / 100);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(3.5, Number((s + 0.35).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(0.8, Number((s - 0.35).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Détection du geste tactile (Pinch et Pan)
  const handleTouchStart = (e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      setTouchState({
        lastX: (t1.pageX + t2.pageX) / 2,
        lastY: (t1.pageY + t2.pageY) / 2,
        initialDistance: dist,
        initialScale: scale,
      });
    } else if (touches.length === 1) {
      setTouchState((prev) => ({
        ...prev,
        lastX: touches[0].pageX,
        lastY: touches[0].pageY,
        initialDistance: null,
      }));
    }
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2 && touchState.initialDistance) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const factor = dist / touchState.initialDistance;
      const newScale = Math.min(3.5, Math.max(0.8, touchState.initialScale * factor));
      setScale(Number(newScale.toFixed(2)));

      const centerX = (t1.pageX + t2.pageX) / 2;
      const centerY = (t1.pageY + t2.pageY) / 2;
      const dx = centerX - touchState.lastX;
      const dy = centerY - touchState.lastY;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      setTouchState((prev) => ({ ...prev, lastX: centerX, lastY: centerY }));
    } else if (touches.length === 1 && scale > 1.05) {
      const t = touches[0];
      const dx = t.pageX - touchState.lastX;
      const dy = t.pageY - touchState.lastY;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      setTouchState((prev) => ({ ...prev, lastX: t.pageX, lastY: t.pageY }));
    }
  };

  // Support molette / trackpad sur Web
  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault?.();
      const delta = e.deltaY;
      if (delta < 0) handleZoomIn();
      else handleZoomOut();
    }
  };

  const handleExport = async () => {
    await exportOrPrintDiagram(diagram, {
      exerciseName: displayTitle,
      objective: displayObjective,
      instructions: displayInstructions,
      durationMin,
      intensity,
    });
  };

  const nextStage = () => {
    if (stageIndex < stages.length - 1) {
      setStageIndex(stageIndex + 1);
    }
  };

  const prevStage = () => {
    if (stageIndex > 0) {
      setStageIndex(stageIndex - 1);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView
        style={[styles.modalRoot, isPresentationMode && styles.modalRootPresentation]}
      >
        {/* ——— Barre d'en-tête responsive : Titre complet + Fermer ——— */}
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {isPresentationMode ? 'CAUSERIE VESTIAIRE' : 'SCHÉMA D’ATELIER'}
                </Text>
              </View>
              {durationMin ? (
                <Text style={styles.metaDuration}>⏱ {durationMin} min</Text>
              ) : null}
              {intensity ? (
                <View style={[styles.badge, styles.intensityBadge]}>
                  <Text style={styles.intensityBadgeText}>{intensity}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.modalTitle}>
              {displayTitle}
            </Text>
          </View>

          <PressableSpring
            onPress={onClose}
            scaleTo={0.92}
            haptic
            accessibilityRole="button"
            accessibilityLabel="Fermer le visualiseur"
            style={[styles.iconBtn, styles.closeBtn]}
          >
            <Ionicons name="close" size={20} color={tokens.foreground} />
          </PressableSpring>
        </View>

        {/* ——— Défilement vertical unifié pour mobile & tablette ——— */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. Canevas de terrain zoomable & panoramique (100:64 respecté) */}
          <View
            style={styles.viewportContainer}
            onStartShouldSetResponder={() => scale > 1.05}
            onMoveShouldSetResponder={() => scale > 1.05}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            // @ts-ignore onWheel supported in React Native Web
            onWheel={handleWheel}
          >
            <View
              style={[
                styles.pitchTransformWrap,
                {
                  width: maxPitchW,
                  height: pitchH,
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale },
                  ],
                },
              ]}
            >
              <CoachExerciseDiagramRenderer
                diagram={diagram}
                activeElements={activeElements}
                activeMovements={activeMovements}
                showTrajectories={true}
                width="100%"
                height="100%"
              />
            </View>

            {/* Contrôles de zoom flottants discrets */}
            <View style={styles.floatingZoomBar}>
              <PressableSpring
                onPress={handleZoomIn}
                scaleTo={0.9}
                haptic
                style={styles.zoomBtn}
                accessibilityLabel="Zoom avant"
              >
                <Ionicons name="add" size={18} color={tokens.foreground} />
              </PressableSpring>
              <PressableSpring
                onPress={handleZoomOut}
                scaleTo={0.9}
                haptic
                style={styles.zoomBtn}
                accessibilityLabel="Zoom arrière"
              >
                <Ionicons name="remove" size={18} color={tokens.foreground} />
              </PressableSpring>
              {scale !== 1 || pan.x !== 0 || pan.y !== 0 ? (
                <PressableSpring
                  onPress={resetView}
                  scaleTo={0.9}
                  haptic
                  style={[styles.zoomBtn, styles.resetViewBtn]}
                  accessibilityLabel="Réinitialiser l'affichage"
                >
                  <Feather name="maximize-2" size={14} color={tokens.accent} />
                  <Text style={styles.zoomLevelText}>{Math.round(scale * 100)}%</Text>
                </PressableSpring>
              ) : null}
            </View>
          </View>

          {/* 2. Contrôles de lecture d'animation ou Barre d'étapes */}
          {isAnimatedMode && hasAnimation ? (
            <View style={styles.playbackBarContainer}>
              <View style={styles.scrubberRow}>
                <Text style={styles.scrubberTimeText}>
                  {(animState.totalElapsedMs / 1000).toFixed(1)}s
                </Text>
                <View
                  style={styles.scrubberTrack}
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={(e) => {
                    const { locationX } = e.nativeEvent;
                    const ratio = Math.max(0, Math.min(1, locationX / 240));
                    animActions.seekToTotalProgress(ratio);
                  }}
                >
                  <View
                    style={[
                      styles.scrubberProgress,
                      { width: `${Math.round(animState.totalProgress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.scrubberTimeText}>
                  {(animState.totalDurationMs / 1000).toFixed(1)}s
                </Text>
              </View>

              <View style={styles.playbackButtonsRow}>
                <PressableSpring
                  onPress={() => {
                    const speeds = [0.5, 1.0, 1.5, 2.0];
                    const next = speeds[(speeds.indexOf(animState.playbackSpeed) + 1) % speeds.length];
                    animActions.setPlaybackSpeed(next);
                  }}
                  scaleTo={0.92}
                  haptic
                  style={styles.playbackSpeedBtn}
                  accessibilityLabel="Changer la vitesse"
                >
                  <Text style={styles.playbackSpeedText}>{animState.playbackSpeed}x</Text>
                </PressableSpring>

                <PressableSpring
                  onPress={animActions.restart}
                  scaleTo={0.92}
                  haptic
                  style={styles.playbackIconBtn}
                  accessibilityLabel="Recommencer"
                >
                  <Ionicons name="refresh" size={17} color={tokens.foreground} />
                </PressableSpring>

                <PressableSpring
                  onPress={animActions.prevStage}
                  scaleTo={0.92}
                  haptic
                  style={styles.playbackIconBtn}
                  accessibilityLabel="Étape précédente"
                >
                  <Ionicons name="play-skip-back" size={17} color={tokens.foreground} />
                </PressableSpring>

                <PressableSpring
                  onPress={animActions.togglePlay}
                  scaleTo={0.92}
                  haptic
                  style={[
                    styles.mainPlayBtn,
                    animState.isPlaying && styles.mainPlayBtnActive,
                  ]}
                  accessibilityLabel={animState.isPlaying ? 'Mettre en pause' : 'Lancer l’animation'}
                >
                  <Ionicons
                    name={animState.isPlaying ? 'pause' : 'play'}
                    size={20}
                    color={animState.isPlaying ? '#FFFFFF' : '#0B130E'}
                    style={{ marginLeft: animState.isPlaying ? 0 : 2 }}
                  />
                </PressableSpring>

                <PressableSpring
                  onPress={animActions.nextStage}
                  disabled={animState.currentStageIndex >= animState.stageCount - 1}
                  scaleTo={0.92}
                  haptic
                  style={[
                    styles.playbackIconBtn,
                    animState.currentStageIndex >= animState.stageCount - 1 && { opacity: 0.35 },
                  ]}
                  accessibilityLabel="Étape suivante"
                >
                  <Ionicons name="play-skip-forward" size={17} color={tokens.foreground} />
                </PressableSpring>

                <PressableSpring
                  onPress={() => animActions.setIsLooping(!animState.isLooping)}
                  scaleTo={0.92}
                  haptic
                  style={[styles.playbackIconBtn, animState.isLooping && styles.loopBtnActive]}
                  accessibilityLabel={animState.isLooping ? 'Boucle active' : 'Boucle inactive'}
                >
                  <Feather
                    name="repeat"
                    size={15}
                    color={animState.isLooping ? tokens.accent : tokens.muted}
                  />
                </PressableSpring>
              </View>
            </View>
          ) : hasStages ? (
            <View style={styles.stageBar}>
              <PressableSpring
                onPress={prevStage}
                disabled={stageIndex === 0}
                scaleTo={0.94}
                haptic
                style={[styles.stageNavBtn, stageIndex === 0 && styles.stageNavBtnDisabled]}
                accessibilityLabel="Étape précédente"
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={stageIndex === 0 ? tokens.muted : tokens.foreground}
                />
                <Text
                  style={[
                    styles.stageNavText,
                    { color: stageIndex === 0 ? tokens.muted : tokens.foreground },
                  ]}
                >
                  Précédent
                </Text>
              </PressableSpring>

              <View style={styles.stageIndicator}>
                <Text style={styles.stageNumber}>
                  Étape {stageIndex + 1} / {stages.length}
                </Text>
                <Text style={styles.stageName}>
                  {currentStage?.name || `Étape ${stageIndex + 1}`}
                </Text>
              </View>

              <PressableSpring
                onPress={nextStage}
                disabled={stageIndex === stages.length - 1}
                scaleTo={0.94}
                haptic
                style={[
                  styles.stageNavBtn,
                  stageIndex === stages.length - 1 && styles.stageNavBtnDisabled,
                ]}
                accessibilityLabel="Étape suivante"
              >
                <Text
                  style={[
                    styles.stageNavText,
                    { color: stageIndex === stages.length - 1 ? tokens.muted : tokens.foreground },
                  ]}
                >
                  Suivant
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={stageIndex === stages.length - 1 ? tokens.muted : tokens.foreground}
                />
              </PressableSpring>
            </View>
          ) : null}

          {/* 3. Consignes & Objectif STRICTEMENT EN DESSOUS DU TERRAIN */}
          {displayObjective ? (
            <View style={styles.objectiveCard}>
              <Text style={styles.objectiveLabel}>🎯 OBJECTIF DE L'ATELIER</Text>
              <Text style={styles.objectiveText}>{displayObjective}</Text>
            </View>
          ) : null}

          {displayInstructions ? (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsLabel}>📋 CONSIGNES DE MISE EN PLACE & RÈGLES</Text>
              <Text style={styles.instructionsText}>{displayInstructions}</Text>
            </View>
          ) : null}

          {/* 4. Légende & détails */}
          {diagram.legend && diagram.legend.length > 0 ? (
            <View style={styles.legendCard}>
              <Text style={styles.legendSectionTitle}>LÉGENDE DU SCHÉMA</Text>
              <View style={styles.legendRow}>
                {diagram.legend.map((item) => (
                  <View key={item.id} style={styles.legendChip}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 5. Actions principales accessibles */}
          <View style={styles.actionsSection}>
            <PressableSpring
              onPress={() => setShowPlayerPresentation(true)}
              scaleTo={0.98}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Montrer aux joueurs en plein écran causerie"
              style={styles.presentationActionBtn}
            >
              <MaterialCommunityIcons
                name="projector-screen-outline"
                size={18}
                color={tokens.onAccent || '#000000'}
              />
              <Text style={styles.presentationActionBtnText}>Montrer aux joueurs (Plein écran causerie)</Text>
            </PressableSpring>

            <View style={styles.secondaryActionsGrid}>
              {hasAnimation ? (
                <PressableSpring
                  onPress={() => {
                    const next = !isAnimatedMode;
                    setIsAnimatedMode(next);
                    if (!next) animActions.pause();
                  }}
                  scaleTo={0.96}
                  haptic
                  style={[styles.secondaryActionBtn, isAnimatedMode && styles.secondaryActionBtnActive]}
                >
                  <MaterialCommunityIcons
                    name={isAnimatedMode ? 'movie-play' : 'image-outline'}
                    size={16}
                    color={isAnimatedMode ? tokens.accent : tokens.foreground}
                  />
                  <Text style={[styles.secondaryActionText, isAnimatedMode && { color: tokens.accent }]}>
                    {isAnimatedMode ? 'Mode Animé' : 'Mode Statique'}
                  </Text>
                </PressableSpring>
              ) : null}

              {onEdit ? (
                <PressableSpring
                  onPress={onEdit}
                  scaleTo={0.96}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel="Modifier le schéma"
                  style={styles.secondaryActionBtn}
                >
                  <Feather name="edit-2" size={16} color={tokens.foreground} />
                  <Text style={styles.secondaryActionText}>Modifier</Text>
                </PressableSpring>
              ) : null}

              <PressableSpring
                onPress={handleExport}
                scaleTo={0.96}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Exporter ou imprimer la fiche d'atelier"
                style={styles.secondaryActionBtn}
              >
                <Feather name="printer" size={16} color={tokens.foreground} />
                <Text style={styles.secondaryActionText}>Imprimer / PDF</Text>
              </PressableSpring>
            </View>
          </View>
        </ScrollView>

        {/* Modal dédié Présentation Joueurs « Show Players » */}
        <CoachDiagramPlayerPresentationModal
          visible={showPlayerPresentation}
          diagram={diagram}
          exerciseName={displayTitle}
          onClose={() => setShowPlayerPresentation(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (tokens: CoachComponentTokens) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    modalRootPresentation: {
      backgroundColor: '#05070B',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: withAlpha(tokens.border, 0.4),
      backgroundColor: tokens.surface,
      gap: 12,
    },
    titleBlock: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 2,
    },
    badge: {
      backgroundColor: proSemantic.successSoft,
      borderColor: withAlpha(proSemantic.success, 0.4),
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      color: proSemantic.success,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    intensityBadge: {
      backgroundColor: withAlpha(tokens.accent, 0.12),
      borderColor: withAlpha(tokens.accent, 0.4),
    },
    intensityBadgeText: {
      color: tokens.accent,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    metaDuration: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '600',
    },
    modalTitle: {
      color: tokens.foreground,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 22,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: proRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      backgroundColor: withAlpha(tokens.foreground, 0.08),
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    scrollBody: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 14,
      alignItems: 'center',
    },
    viewportContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: withAlpha(tokens.surface, 0.6),
      borderRadius: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: withAlpha(tokens.border, 0.5),
    },
    pitchTransformWrap: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha('#FFFFFF', 0.15),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    floatingZoomBar: {
      position: 'absolute',
      bottom: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: withAlpha(tokens.surface, 0.94),
      borderRadius: 20,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
    },
    zoomBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    resetViewBtn: {
      width: 'auto',
      paddingHorizontal: 8,
      flexDirection: 'row',
      gap: 4,
    },
    zoomLevelText: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.accent,
    },
    playbackBarContainer: {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: tokens.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: withAlpha(tokens.border, 0.6),
      gap: 10,
    },
    scrubberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    scrubberTimeText: {
      fontSize: 11,
      fontWeight: '600',
      color: tokens.muted,
      minWidth: 32,
    },
    scrubberTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: withAlpha(tokens.foreground, 0.12),
      overflow: 'hidden',
    },
    scrubberProgress: {
      height: '100%',
      backgroundColor: proSemantic.success,
      borderRadius: 3,
    },
    playbackButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    playbackSpeedBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: proRadius.xs,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      minWidth: 40,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playbackSpeedText: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.foreground,
    },
    playbackIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainPlayBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: proSemantic.success,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: proSemantic.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 4,
    },
    mainPlayBtnActive: {
      backgroundColor: tokens.elevated,
      borderWidth: 2,
      borderColor: tokens.foreground,
    },
    loopBtnActive: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.15),
    },
    stageBar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: tokens.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: withAlpha(tokens.border, 0.6),
      gap: 10,
    },
    stageNavBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      minHeight: 38,
    },
    stageNavBtnDisabled: {
      opacity: 0.4,
    },
    stageNavText: {
      fontSize: 11,
      fontWeight: '600',
    },
    stageIndicator: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    stageNumber: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
      letterSpacing: 0.5,
    },
    stageName: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
      textAlign: 'center',
      marginTop: 2,
    },
    objectiveCard: {
      width: '100%',
      backgroundColor: withAlpha(tokens.accent, 0.08),
      borderLeftWidth: 3,
      borderLeftColor: tokens.accent,
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: withAlpha(tokens.accent, 0.2),
      gap: 6,
    },
    objectiveLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.accent,
      letterSpacing: 0.6,
    },
    objectiveText: {
      fontSize: 13,
      color: tokens.foreground,
      lineHeight: 19,
      fontWeight: '500',
    },
    instructionsCard: {
      width: '100%',
      backgroundColor: tokens.surface,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 6,
    },
    instructionsLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.muted,
      letterSpacing: 0.6,
    },
    instructionsText: {
      fontSize: 13,
      color: tokens.foreground,
      lineHeight: 20,
    },
    legendCard: {
      width: '100%',
      backgroundColor: tokens.surface,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: withAlpha(tokens.border, 0.5),
      gap: 8,
    },
    legendSectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.muted,
      letterSpacing: 0.5,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    legendChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: tokens.muted,
      fontWeight: '600',
    },
    actionsSection: {
      width: '100%',
      gap: 10,
      marginTop: 4,
    },
    presentationActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: tokens.accent,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: proRadius.md,
      minHeight: 48,
    },
    presentationActionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.onAccent || '#000000',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    secondaryActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    secondaryActionBtn: {
      flex: 1,
      minWidth: 110,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: tokens.elevated,
      borderRadius: proRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    secondaryActionBtnActive: {
      borderColor: tokens.accent,
      backgroundColor: withAlpha(tokens.accent, 0.12),
    },
    secondaryActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
  });
