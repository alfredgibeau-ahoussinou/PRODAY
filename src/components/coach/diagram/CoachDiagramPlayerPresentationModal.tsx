import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachExerciseDiagramRenderer } from './CoachExerciseDiagramRenderer';
import type { ExerciseDiagramData } from '../../../models/ExerciseDiagram';
import { useDiagramAnimationPlayback } from '../../../hooks/useDiagramAnimationPlayback';
import { PressableSpring } from '../../../components/motion/PressableSpring';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { proRadius, proSemantic } from '../../../theme/professionalDesign';
import { withAlpha } from '../../../utils/coachTeamTheme';

export interface CoachDiagramPlayerPresentationModalProps {
  visible: boolean;
  diagram: ExerciseDiagramData;
  exerciseName?: string;
  onClose: () => void;
}

export const CoachDiagramPlayerPresentationModal: React.FC<CoachDiagramPlayerPresentationModalProps> = ({
  visible,
  diagram,
  exerciseName,
  onClose,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  // Détection de l'accessibilité / réduction de mouvement
  const [reduceMotionActive, setReduceMotionActive] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (Platform.OS !== 'web' && AccessibilityInfo.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        if (isMounted) setReduceMotionActive(enabled);
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const [animState, animActions] = useDiagramAnimationPlayback(diagram, {
    autoPlay: !reduceMotionActive,
    initialSpeed: 1.0,
  });

  // Si réduction des mouvements activée, mettre en pause automatique
  useEffect(() => {
    if (reduceMotionActive && animState.isPlaying) {
      animActions.pause();
    }
  }, [reduceMotionActive, animState.isPlaying, animActions]);

  const stages = diagram.animation?.stages || [];
  const hasAnimation = stages.length > 0;
  const currentStage = animState.currentStage || (stages[animState.currentStageIndex] ?? null);

  const displayTitle = exerciseName || diagram.name || 'Atelier d’entraînement';
  const stageInstruction =
    currentStage?.instruction ||
    (diagram.stages && diagram.stages[animState.currentStageIndex]?.instructions) ||
    diagram.instructions ||
    'Observez les déplacements et la synchronisation de l’exercice.';

  // Calcul du format paysage/portrait pour occuper le maximum d'espace sans déformation (ratio 100:64)
  const isLandscape = winWidth > winHeight;
  const availableWidth = winWidth - 32;
  const availableHeight = winHeight - (isLandscape ? 180 : 260);

  let pitchW = availableWidth;
  let pitchH = Math.round((pitchW * 64) / 100);

  if (pitchH > availableHeight) {
    pitchH = availableHeight;
    pitchW = Math.round((pitchH * 100) / 64);
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.root}>
        {/* ——— Barre Supérieure Épurée ——— */}
        <View style={styles.topHeader}>
          <View style={styles.headerInfo}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>PRÉSENTATION JOUEURS</Text>
            </View>
            <Text numberOfLines={1} style={styles.mainTitle}>
              {displayTitle}
            </Text>
          </View>

          <View style={styles.topHeaderRight}>
            {/* Bascule d'accessibilité / Mode pas-à-pas */}
            <PressableSpring
              onPress={() => {
                const next = !reduceMotionActive;
                setReduceMotionActive(next);
                if (next) animActions.pause();
              }}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel={reduceMotionActive ? 'Mode animé normal' : 'Mode statique pas-à-pas'}
              style={[styles.accessibilityBtn, reduceMotionActive && styles.accessibilityBtnActive]}
            >
              <MaterialCommunityIcons
                name={reduceMotionActive ? 'motion-pause' : 'motion-play-outline'}
                size={16}
                color={reduceMotionActive ? '#FFFFFF' : tokens.accent}
              />
              <Text
                style={[
                  styles.accessibilityBtnText,
                  { color: reduceMotionActive ? '#FFFFFF' : tokens.accent },
                ]}
              >
                {reduceMotionActive ? 'Pas-à-pas (Accessible)' : 'Animé'}
              </Text>
            </PressableSpring>

            {/* Bouton Fermer */}
            <PressableSpring
              onPress={onClose}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Fermer la présentation"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </PressableSpring>
          </View>
        </View>

        {/* ——— Zone Centrale : Terrain Plein Écran Haute Visibilité ——— */}
        <View style={styles.pitchArea}>
          <View style={{ width: pitchW, height: pitchH, borderRadius: 12, overflow: 'hidden' }}>
            <CoachExerciseDiagramRenderer
              diagram={diagram}
              activeElements={animState.interpolatedElements}
              activeMovements={reduceMotionActive ? undefined : animState.activeMovements}
              showTrajectories={true}
              width="100%"
              height="100%"
            />
          </View>
        </View>

        {/* ——— Bandeau Consigne Pédagogique Lisible ——— */}
        <View style={styles.instructionBanner}>
          <View style={styles.stageChip}>
            <Text style={styles.stageChipText}>
              {hasAnimation
                ? `PHASE ${animState.currentStageIndex + 1} / ${animState.stageCount}`
                : 'POSITIONNEMENT'}
            </Text>
          </View>
          <Text numberOfLines={2} style={styles.instructionText}>
            {stageInstruction}
          </Text>
        </View>

        {/* ——— Télécommande de Lecture Vestiaire / Bord de Terrain ——— */}
        <View style={styles.controlsBar}>
          {/* Timeline Scrubber */}
          {hasAnimation && !reduceMotionActive ? (
            <View style={styles.scrubberContainer}>
              <View style={styles.scrubberTrack}>
                <View
                  style={[
                    styles.scrubberFill,
                    { width: `${Math.round(animState.totalProgress * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.scrubberMeta}>
                <Text style={styles.scrubberTime}>
                  {(animState.totalElapsedMs / 1000).toFixed(1)}s
                </Text>
                <Text style={styles.scrubberTime}>
                  {(animState.totalDurationMs / 1000).toFixed(1)}s
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.remoteRow}>
            {/* Vitesse de lecture */}
            {hasAnimation && !reduceMotionActive ? (
              <PressableSpring
                onPress={() => {
                  const speeds = [0.5, 1.0, 1.5, 2.0];
                  const currIdx = speeds.indexOf(animState.playbackSpeed);
                  const nextSpeed = speeds[(currIdx + 1) % speeds.length];
                  animActions.setPlaybackSpeed(nextSpeed);
                }}
                scaleTo={0.92}
                haptic
                style={styles.speedBtn}
                accessibilityLabel="Vitesse de lecture"
              >
                <Text style={styles.speedBtnText}>{animState.playbackSpeed}x</Text>
              </PressableSpring>
            ) : <View style={{ width: 44 }} />}

            {/* Étape précédente / Replay */}
            <PressableSpring
              onPress={animActions.prevStage}
              scaleTo={0.9}
              haptic
              style={styles.navRemoteBtn}
              accessibilityLabel="Étape précédente ou début"
            >
              <Ionicons name="play-skip-back" size={20} color="#FFFFFF" />
            </PressableSpring>

            {/* Gros bouton Play / Pause ou Replay */}
            {hasAnimation && !reduceMotionActive ? (
              <PressableSpring
                onPress={animActions.togglePlay}
                scaleTo={0.92}
                haptic
                style={[
                  styles.playRemoteBtn,
                  animState.isPlaying && styles.playRemoteBtnActive,
                ]}
                accessibilityLabel={animState.isPlaying ? 'Mettre en pause' : 'Lancer l’animation'}
              >
                <Ionicons
                  name={animState.isPlaying ? 'pause' : 'play'}
                  size={28}
                  color={animState.isPlaying ? '#FFFFFF' : '#0B130E'}
                  style={{ marginLeft: animState.isPlaying ? 0 : 3 }}
                />
              </PressableSpring>
            ) : (
              <PressableSpring
                onPress={animActions.restart}
                scaleTo={0.92}
                haptic
                style={styles.playRemoteBtn}
                accessibilityLabel="Recommencer"
              >
                <Ionicons name="refresh" size={26} color="#0B130E" />
              </PressableSpring>
            )}

            {/* Étape suivante */}
            <PressableSpring
              onPress={animActions.nextStage}
              disabled={animState.currentStageIndex >= animState.stageCount - 1}
              scaleTo={0.9}
              haptic
              style={[
                styles.navRemoteBtn,
                animState.currentStageIndex >= animState.stageCount - 1 && styles.navRemoteBtnDisabled,
              ]}
              accessibilityLabel="Étape suivante"
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={
                  animState.currentStageIndex >= animState.stageCount - 1
                    ? 'rgba(255,255,255,0.3)'
                    : '#FFFFFF'
                }
              />
            </PressableSpring>

            {/* Boucle toggle */}
            {hasAnimation && !reduceMotionActive ? (
              <PressableSpring
                onPress={() => animActions.setIsLooping(!animState.isLooping)}
                scaleTo={0.92}
                haptic
                style={[
                  styles.loopBtn,
                  animState.isLooping && styles.loopBtnActive,
                ]}
                accessibilityLabel={animState.isLooping ? 'Répétition active' : 'Répétition désactivée'}
              >
                <Feather
                  name="repeat"
                  size={16}
                  color={animState.isLooping ? tokens.accent : 'rgba(255,255,255,0.45)'}
                />
              </PressableSpring>
            ) : <View style={{ width: 44 }} />}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070C09',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: proSemantic.successSoft,
    borderColor: withAlpha(proSemantic.success, 0.4),
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: proRadius.xs,
    marginBottom: 4,
  },
  tagBadgeText: {
    color: proSemantic.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accessibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  accessibilityBtnActive: {
    backgroundColor: proSemantic.info,
    borderColor: proSemantic.info,
  },
  accessibilityBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instructionBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: proRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageChip: {
    backgroundColor: withAlpha(proSemantic.info, 0.15),
    borderColor: withAlpha(proSemantic.info, 0.4),
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: proRadius.xs,
  },
  stageChipText: {
    color: proSemantic.info,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  instructionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  controlsBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    backgroundColor: 'rgba(11, 19, 14, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  scrubberContainer: {
    marginTop: 10,
    marginBottom: 8,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: proSemantic.success,
  },
  scrubberMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scrubberTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  remoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: proRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 44,
    alignItems: 'center',
  },
  speedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  navRemoteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRemoteBtnDisabled: {
    opacity: 0.35,
  },
  playRemoteBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: proSemantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: proSemantic.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playRemoteBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: proSemantic.success,
  },
});
