import { COACH_REF_PALETTE } from '../theme/coachDesignSystem';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ExerciseYouTubePlayer } from '../../../components/video/ExerciseYouTubePlayer';
import { useVideoOrientationLock } from '../../video/useVideoOrientationLock';
import { useCoachTrainingTheme } from './coachTrainingTheme';
import {
  createTacticalPlayback,
  reduceTacticalPlayback,
} from '../../tactics/engine/tacticalPlayback';
import {
  TACTICAL_PITCH,
  compileTacticalScene,
  sampleTacticalScene,
  type CompiledTacticalScene,
  type TacticalScene,
} from '../../tactics/engine/tacticalTimeline';

const TICK_MS = 33;

const FULLSCREEN_SPEEDS = [0.75, 1, 1.5, 2] as const;

export interface CoachExerciseFullscreenModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  instructions?: string;
  objective?: string;
  youtubeId?: string;
  tacticalScene?: TacticalScene;
}

export const CoachExerciseFullscreenModal: React.FC<CoachExerciseFullscreenModalProps> = ({
  visible,
  onClose,
  title,
  instructions,
  objective,
  youtubeId,
  tacticalScene,
}) => {
  // Verrouillage de l'écran en paysage sur smartphone/tablette native
  useVideoOrientationLock(visible);

  const insets = useSafeAreaInsets();
  const { tokens } = useCoachTrainingTheme();
  const [activeTab, setActiveTab] = useState<'schema' | 'video'>(
    tacticalScene ? 'schema' : 'video',
  );

  useEffect(() => {
    if (visible) {
      if (tacticalScene) {
        setActiveTab('schema');
      } else if (youtubeId) {
        setActiveTab('video');
      }
    }
  }, [visible, tacticalScene, youtubeId]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        {/* Barre d'en-tête projetée avec grand titre et boutons tactiles */}
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <ProDayText style={styles.fullscreenBadge}>PROJECTION TACTIQUE</ProDayText>
            <ProDayText style={styles.titleText} numberOfLines={1}>
              {title}
            </ProDayText>
          </View>

          {/* Sélecteur Schéma animé | Vidéo */}
          <View style={styles.tabSwitch} testID="fullscreen-mode-switch">
            <TouchableOpacity
              onPress={() => setActiveTab('schema')}
              style={[styles.tabButton, activeTab === 'schema' && styles.tabButtonActive]}
              accessibilityRole="button"
              accessibilityLabel={'Vue schéma animé'}accessibilityState={{ selected: activeTab === 'schema' }}
            >
              <Icon
                name="football"
                size={16}
                color={activeTab === 'schema' ? '#000000' : COACH_REF_PALETTE.white}
              />
              <ProDayText
                style={[styles.tabText, activeTab === 'schema' && styles.tabTextActive]}
              >
                Schéma animé
              </ProDayText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('video')}
              style={[styles.tabButton, activeTab === 'video' && styles.tabButtonActive]}
              accessibilityRole="button"
              accessibilityLabel={'Vue démonstration vidéo'}accessibilityState={{ selected: activeTab === 'video' }}
            >
              <Icon
                name="play"
                size={16}
                color={activeTab === 'video' ? '#000000' : COACH_REF_PALETTE.white}
              />
              <ProDayText
                style={[styles.tabText, activeTab === 'video' && styles.tabTextActive]}
              >
                Vidéo
              </ProDayText>
            </TouchableOpacity>
          </View>

          {/* Bouton Fermer XXL */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel={'Fermer la projection plein écran'}>
            <Icon name="close" size={26} color={COACH_REF_PALETTE.white} />
          </TouchableOpacity>
        </View>

        {/* Zone centrale principale : Vidéo ou Schéma animé */}
        <View style={styles.body}>
          {activeTab === 'video' ? (
            youtubeId ? (
              <View style={styles.videoWrapper}>
                <ExerciseYouTubePlayer
                  videoIdOrUrl={youtubeId}
                  title={title}
                  autoPlay
                  style={styles.fullscreenPlayer}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="videocam" size={36} color="#888888" />
                <ProDayText style={styles.emptyText}>
                  Aucune démonstration vidéo associée à cet exercice.
                </ProDayText>
                {tacticalScene ? (
                  <TouchableOpacity
                    onPress={() => setActiveTab('schema')}
                    style={[styles.bigButton, styles.bigButtonActive]}
                    accessibilityRole="button"
                    accessibilityLabel={'Revenir au schéma animé'}>
                    <ProDayText style={[styles.bigButtonText, styles.bigButtonTextActive]}>
                      Afficher le schéma animé
                    </ProDayText>
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          ) : tacticalScene ? (
            <FullscreenPitch scene={tacticalScene} tokens={tokens} />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="alert-circle" size={36} color="#888888" />
              <ProDayText style={styles.emptyText}>
                Aucun schéma ni vidéo associés à cet exercice.
              </ProDayText>
            </View>
          )}
        </View>

        {/* Pied d'écran : Objectif et Consigne du coach */}
        {(objective || instructions) && (
          <View style={styles.footerRow}>
            {objective ? (
              <View style={styles.footerBlock}>
                <ProDayText style={styles.footerLabel}>OBJECTIF :</ProDayText>
                <ProDayText style={styles.footerValue} numberOfLines={1}>
                  {objective}
                </ProDayText>
              </View>
            ) : null}
            {instructions ? (
              <View style={styles.footerBlock}>
                <ProDayText style={styles.footerLabel}>CONSIGNES :</ProDayText>
                <ProDayText style={styles.footerValue} numberOfLines={1}>
                  {instructions}
                </ProDayText>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
};

/**
 * Schéma tactique animé optimisé plein écran avec gros boutons tactiles
 */
function FullscreenPitch({
  scene,
  tokens,
}: {
  scene: TacticalScene;
  tokens: ReturnType<typeof useCoachTrainingTheme>['tokens'];
}) {
  const compiled = useMemo(() => {
    if (!scene) return null;
    try {
      const result = compileTacticalScene(scene);
      return result.ok ? result.scene : null;
    } catch (err) {
      console.warn('[CoachExerciseFullscreenModal] compileTacticalScene error:', err);
      return null;
    }
  }, [scene]);

  if (!scene || !compiled) {
    return (
      <View style={styles.emptyState}>
        <ProDayText style={styles.emptyText}>
          Ce schéma tactique est incomplet et ne peut être animé.
        </ProDayText>
      </View>
    );
  }

  return <FullscreenAnimatedBoard scene={scene} compiled={compiled} tokens={tokens} />;
}

function FullscreenAnimatedBoard({
  scene,
  compiled,
  tokens,
}: {
  scene: TacticalScene;
  compiled: CompiledTacticalScene;
  tokens: ReturnType<typeof useCoachTrainingTheme>['tokens'];
}) {
  const [playback, dispatch] = useReducer(
    reduceTacticalPlayback,
    compiled,
    createTacticalPlayback,
  );

  useEffect(() => {
    if (playback.status !== 'playing') return undefined;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'tick', deltaMs: now - last });
      last = now;
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playback.status]);

  const frame = useMemo(
    () => sampleTacticalScene(compiled, playback.timeMs),
    [compiled, playback.timeMs],
  );

  const isPlaying = playback.status === 'playing';
  const phaseLabel = compiled.phases[frame.phaseIndex]?.label ?? '';
  const progressPct = Math.min(
    100,
    Math.max(0, (playback.timeMs / (compiled.durationMs || 1)) * 100),
  );

  const phasesCount = Math.max(compiled.phases?.length || 1, 1);
  const currentPhaseIndex = Math.min(
    Math.max(frame?.phaseIndex ?? 0, 0),
    phasesCount - 1,
  );

  return (
    <View style={styles.boardContainer}>
      <View style={styles.pitchArea}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${TACTICAL_PITCH.maxX} ${TACTICAL_PITCH.maxY}`}
        >
          <Defs>
            <LinearGradient id="fsPitchGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={tokens.pitchStart || '#1E5E35'} />
              <Stop offset="100%" stopColor={tokens.pitchEnd || '#124324'} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={TACTICAL_PITCH.maxX}
            height={TACTICAL_PITCH.maxY}
            fill="url(#fsPitchGrad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={0.6}
          />
          <Line
            x1={0}
            y1={TACTICAL_PITCH.maxY / 2}
            x2={TACTICAL_PITCH.maxX}
            y2={TACTICAL_PITCH.maxY / 2}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.4}
          />
          <Circle
            cx={TACTICAL_PITCH.maxX / 2}
            cy={TACTICAL_PITCH.maxY / 2}
            r={9}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.35}
          />
          <Rect
            x={30}
            y={0}
            width={40}
            height={12}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.4}
          />
          <Rect
            x={30}
            y={TACTICAL_PITCH.maxY - 12}
            width={40}
            height={12}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={0.4}
          />

          {scene.entities.map((entity) => {
            const position = frame.positions[entity.id];
            if (!position) return null;
            if (entity.kind === 'cone') {
              return (
                <Circle
                  key={entity.id}
                  cx={position.x}
                  cy={position.y}
                  r={1.2}
                  fill="#FFAA00"
                />
              );
            }
            const label = entity.label ?? entity.id;
            const isJoker = /joker|\bj\d*\b/i.test(label);
            const own = entity.kind !== 'opponent';
            const fill =
              entity.kind === 'goalkeeper'
                ? '#FFD700'
                : isJoker
                  ? '#38BDF8'
                  : own
                    ? '#00E676'
                    : '#EF4444';

            return (
              <React.Fragment key={entity.id}>
                <Circle
                  cx={position.x}
                  cy={position.y}
                  r={3.4}
                  fill={fill}
                  stroke={COACH_REF_PALETTE.white}
                  strokeWidth={0.6}
                />
                <SvgText
                  x={position.x}
                  y={position.y + 1.1}
                  fontSize={2.8}
                  fill="#000000"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          <Circle
            cx={frame?.ball?.x ?? 50}
            cy={frame?.ball?.y ?? 32}
            r={1.6}
            fill={COACH_REF_PALETTE.white}
            stroke="#000000"
            strokeWidth={0.4}
          />
        </Svg>
      </View>

      {/* En-tête de phase et barre de progression façon motionPanel */}
      <View style={styles.motionPanelFooter}>
        <View style={styles.motionHead}>
          <ProDayText style={styles.phaseTitle} numberOfLines={1}>
            Phase {currentPhaseIndex + 1}/{phasesCount}
            {phaseLabel ? ` · ${phaseLabel}` : ''}
          </ProDayText>
          <ProDayText style={styles.motionTime}>
            {(playback.timeMs / 1000).toFixed(1)} / {(Math.max(compiled.durationMs, 1000) / 1000).toFixed(1)} s
          </ProDayText>
        </View>

        <View style={styles.scrubBarBg}>
          <View style={[styles.scrubBarFill, { width: `${progressPct}%` }]} />
        </View>

        {compiled.phases.length > 1 ? (
          <View style={styles.phasesRow}>
            {compiled.phases.map((phase, idx) => {
              const activePhase = idx === frame.phaseIndex;
              return (
                <Pressable
                  key={`${phase.label}-${idx}`}
                  onPress={() => dispatch({ type: 'seek', timeMs: phase.startMs })}
                  accessibilityRole="button"
                  accessibilityLabel={`Aller à la phase ${idx + 1} : ${phase.label}`}
                  accessibilityState={{ selected: activePhase }}
                  style={[styles.phasePill, activePhase && styles.phasePillActive]}
                >
                  <ProDayText
                    style={[styles.phasePillText, activePhase && styles.phasePillTextActive]}
                    numberOfLines={1}
                  >
                    {idx + 1}. {phase.label}
                  </ProDayText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Contrôles de lecture (Play/Pause, phases, boucle, vitesses 0.75x, 1x, 1.5x, 2x, recommencer) */}
        <View style={styles.controlsBar}>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'restart' })}
            style={styles.transportButton}
            accessibilityRole="button"
            accessibilityLabel="Recommencer"
          >
            <Icon name="refresh" size={20} color={COACH_REF_PALETTE.white} />
            <ProDayText style={styles.transportButtonText}>Recommencer</ProDayText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => dispatch({ type: 'previousPhase' })}
            style={styles.iconCircleButton}
            accessibilityRole="button"
            accessibilityLabel={'Phase précédente'}>
            <Icon name="arrow-back" size={20} color={COACH_REF_PALETTE.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => dispatch({ type: 'toggle' })}
            style={[styles.bigButton, isPlaying && styles.bigButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={isPlaying ? '#000000' : COACH_REF_PALETTE.white}
            />
            <ProDayText style={[styles.bigButtonText, isPlaying && styles.bigButtonTextActive]}>
              {isPlaying ? 'Pause' : 'Lecture'}
            </ProDayText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => dispatch({ type: 'nextPhase' })}
            style={styles.iconCircleButton}
            accessibilityRole="button"
            accessibilityLabel="Phase suivante"
          >
            <Icon name="chevron-forward" size={20} color={COACH_REF_PALETTE.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => dispatch({ type: 'setLoop', loop: !playback.loop })}
            style={[styles.iconCircleButton, playback.loop && styles.bigButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={playback.loop ? 'Boucle active' : 'Boucle'}
            accessibilityState={{ selected: playback.loop }}
          >
            <Icon
              name="swap-horizontal"
              size={18}
              color={playback.loop ? '#000000' : COACH_REF_PALETTE.white}
            />
          </TouchableOpacity>

          <View style={styles.speedRow} accessibilityRole="radiogroup" accessibilityLabel="Vitesse de l'animation">
            {FULLSCREEN_SPEEDS.map((spd) => {
              const selected = playback.speed === spd;
              return (
                <TouchableOpacity
                  key={spd}
                  onPress={() => dispatch({ type: 'setSpeed', speed: spd })}
                  style={[styles.speedButton, selected && styles.speedButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Vitesse ${spd}x`}
                  accessibilityState={{ selected }}
                >
                  <ProDayText
                    style={[styles.speedButtonText, selected && styles.speedButtonTextActive]}
                  >
                    {spd}x
                  </ProDayText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  titleArea: {
    flex: 1,
    marginRight: 12,
  },
  fullscreenBadge: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  titleText: {
    color: COACH_REF_PALETTE.white,
    fontSize: 18,
    fontWeight: '700',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 3,
    marginRight: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#00E676',
  },
  tabText: {
    color: COACH_REF_PALETTE.white,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    maxHeight: 460,
    justifyContent: 'center',
  },
  fullscreenPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  boardContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pitchArea: {
    flex: 1,
    width: '100%',
    aspectRatio: TACTICAL_PITCH.maxX / TACTICAL_PITCH.maxY,
    maxHeight: '72%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  motionPanelFooter: {
    width: '100%',
    gap: 6,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  motionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  phaseTitle: {
    flex: 1,
    color: COACH_REF_PALETTE.white,
    fontSize: 13,
    fontWeight: '700',
  },
  motionTime: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scrubBarBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  scrubBarFill: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: 3,
  },
  phasesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  phasePillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderColor: '#00E676',
  },
  phasePillText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
  },
  phasePillTextActive: {
    color: '#00E676',
    fontWeight: '800',
  },
  controlsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 2,
  },
  transportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  transportButtonText: {
    color: COACH_REF_PALETTE.white,
    fontSize: 13,
    fontWeight: '600',
  },
  iconCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    gap: 8,
  },
  bigButtonActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  bigButtonText: {
    color: COACH_REF_PALETTE.white,
    fontSize: 14,
    fontWeight: '600',
  },
  bigButtonTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  speedButtonActive: {
    backgroundColor: '#00E676',
  },
  speedButtonText: {
    color: COACH_REF_PALETTE.white,
    fontSize: 12,
    fontWeight: '700',
  },
  speedButtonTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
    gap: 16,
  },
  footerBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
  },
  footerValue: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
});
