import React, { useEffect, useMemo, useReducer } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Icon } from '../../../components/ui/Icon';
import { TrainingText as CoachText, useCoachTrainingTheme } from './coachTrainingTheme';
import { spacing } from '../../../theme/designTokens';
import {
  TACTICAL_PLAYBACK_SPEEDS,
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

/** Pas de rafraîchissement de l'aperçu, en ms (≈ 30 images par seconde). */
const TICK_MS = 33;

type Props = {
  scene: TacticalScene;
};

/**
 * Schéma animé. Une scène invalide ne s'affiche pas : le message le dit, au lieu
 * d'une animation fausse.
 */
export function TacticalSchemaPreview({ scene }: Props) {
  const compiled = useMemo(() => {
    if (!scene) return null;
    const result = compileTacticalScene(scene);
    return result.ok ? result.scene : null;
  }, [scene]);
  const { tokens } = useCoachTrainingTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (!scene || !compiled) {
    return (
      <CoachText variant="caption" style={styles.error}>
        Ce schéma est incomplet et ne peut pas être animé.
      </CoachText>
    );
  }
  return <AnimatedPitch key={scene.id} scene={scene} compiled={compiled} />;
}

function AnimatedPitch({ scene, compiled }: { scene: TacticalScene; compiled: CompiledTacticalScene }) {
  const { tokens } = useCoachTrainingTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [playback, dispatch] = useReducer(reduceTacticalPlayback, compiled, createTacticalPlayback);

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

  const frame = useMemo(() => sampleTacticalScene(compiled, playback.timeMs), [compiled, playback.timeMs]);
  const phaseLabel = compiled.phases[frame.phaseIndex]?.label ?? '';

  return (
    <View style={styles.root}>
      <View
        style={styles.pitchFrame}
        accessibilityRole="image"
        accessibilityLabel={`Schéma animé : ${scene.title}`}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${TACTICAL_PITCH.maxX} ${TACTICAL_PITCH.maxY}`}>
          <Defs>
            <LinearGradient id="trainingPitch" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={tokens.pitchStart} />
              <Stop offset="0%" stopColor="#135223" />
              <Stop offset="100%" stopColor="#0E3D1A" />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={TACTICAL_PITCH.maxX}
            height={TACTICAL_PITCH.maxY}
            fill="url(#trainingPitch)"
            stroke={tokens.pitchLine}
            strokeWidth={0.6}
          />
          {/* Alternating stadium grass stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Rect
              key={i}
              x={0}
              y={i * 7}
              width={100}
              height={7}
              fill={i % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'transparent'}
            />
          ))}
          {/* Halfway line & Center Circle */}
          <Line x1={50} y1={0} x2={50} y2={TACTICAL_PITCH.maxY} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Circle cx={50} cy={35} r={9.15} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Circle cx={50} cy={35} r={0.7} fill="rgba(255, 255, 255, 0.9)" />

          {/* Left Penalty & Goal Area */}
          <Rect x={0} y={15} width={16.5} height={40} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Rect x={0} y={24} width={5.5} height={22} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Circle cx={11} cy={35} r={0.6} fill="rgba(255, 255, 255, 0.9)" />

          {/* Right Penalty & Goal Area */}
          <Rect x={83.5} y={15} width={16.5} height={40} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Rect x={94.5} y={24} width={5.5} height={22} fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth={0.5} />
          <Circle cx={89} cy={35} r={0.6} fill="rgba(255, 255, 255, 0.9)" />
          {scene.entities.map((entity) => {
            const position = frame.positions[entity.id];
            if (!position) return null;
            if (entity.kind === 'cone') {
              return <Circle key={entity.id} cx={position.x} cy={position.y} r={1.2} fill={tokens.muted} />;
            }
            const label = entity.label ?? entity.id;
            const isJoker = /joker|\bj\d*\b/i.test(label);
            const own = entity.kind !== 'opponent';
            const fill = entity.kind === 'goalkeeper'
              ? tokens.foreground
              : isJoker
                ? tokens.neutral
                : own
                  ? tokens.accent
                  : tokens.opponent;
            return (
              <React.Fragment key={entity.id}>
                <Circle
                  cx={position.x}
                  cy={position.y}
                  r={3.2}
                  fill={fill}
                  stroke={entity.kind === 'goalkeeper' || isJoker ? tokens.foreground : 'none'}
                  strokeWidth={0.55}
                />
                <SvgText
                  x={position.x}
                  y={position.y + 1}
                  fontSize={2.6}
                  fill={entity.kind === 'goalkeeper' ? tokens.bg : tokens.onAccent}
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
            r={1.5}
            fill={tokens.ball}
            stroke={tokens.bg}
            strokeWidth={0.4}
          />
        </Svg>
      </View>

      {/* Barre d'information & phase */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }} numberOfLines={1}>
          Phase {frame.phaseIndex + 1}/{Math.max(compiled.phases.length, 1)}{phaseLabel ? ` · ${phaseLabel}` : ''}
        </CoachText>
        <CoachText variant="caption" muted>
          {(playback.timeMs / 1000).toFixed(1)}s / {(Math.max(compiled.durationMs, 1000) / 1000).toFixed(1)}s
        </CoachText>
      </View>

      {/* Barre de progression fluide */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, Math.max(0, (playback.timeMs / (compiled.durationMs || 1)) * 100))}%`,
            },
          ]}
        />
      </View>

      {/* Barre de commandes ultra-simplifiée & épurée */}
      <View style={styles.modernBar}>
        {/* Contrôles de lecture principaux */}
        <View style={styles.leftControls}>
          <Pressable
            onPress={() => dispatch({ type: 'restart' })}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Recommencer"
          >
            <Icon name="refresh" size={16} color={tokens.muted} />
          </Pressable>

          <Pressable
            onPress={() => dispatch({ type: 'previousPhase' })}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Phase précédente"
          >
            <Icon name="arrow-back" size={16} color={tokens.foreground} />
          </Pressable>

          <Pressable
            onPress={() => dispatch({ type: 'toggle' })}
            style={[styles.playBtn, playback.status === 'playing' && styles.playBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={playback.status === 'playing' ? 'Pause' : 'Lecture'}
          >
            <Icon
              name={playback.status === 'playing' ? 'pause' : 'play'}
              size={18}
              color={tokens.onAccent}
            />
          </Pressable>

          <Pressable
            onPress={() => dispatch({ type: 'nextPhase' })}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Phase suivante"
          >
            <Icon name="chevron-forward" size={16} color={tokens.foreground} />
          </Pressable>

          <Pressable
            onPress={() => dispatch({ type: 'setLoop', loop: !playback.loop })}
            style={[styles.loopBtn, playback.loop && styles.loopBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={playback.loop ? 'Boucle active' : 'Boucle désactivée'}
          >
            <Icon name="swap-horizontal" size={15} color={playback.loop ? tokens.accent : tokens.muted} />
          </Pressable>
        </View>

        {/* Sélecteur de vitesse rapide (cycle au clic : 1x -> 1.5x -> 2x -> 0.75x -> 1x) */}
        <Pressable
          onPress={() => {
            const nextSpeedIndex = (TACTICAL_PLAYBACK_SPEEDS.indexOf(playback.speed) + 1) % TACTICAL_PLAYBACK_SPEEDS.length;
            dispatch({ type: 'setSpeed', speed: TACTICAL_PLAYBACK_SPEEDS[nextSpeedIndex] });
          }}
          style={styles.speedPill}
          accessibilityRole="button"
          accessibilityLabel={`Vitesse ${playback.speed}x`}
        >
          <CoachText style={styles.speedPillText}>{playback.speed}×</CoachText>
        </Pressable>
      </View>
    </View>
  );
}

function ControlButton({
  label,
  selected = false,
  onPress,
  styles,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.button, selected && styles.buttonSelected]}
    >
      <CoachText style={selected ? styles.buttonTextSelected : styles.buttonText}>{label}</CoachText>
    </Pressable>
  );
}

// Aucune couleur littérale : tout vient des jetons du pôle Coach.
function createStyles(tokens: ReturnType<typeof useCoachTrainingTheme>['tokens']) {
  return StyleSheet.create({
    root: { gap: 6 },
    pitchFrame: {
      width: '100%',
      aspectRatio: TACTICAL_PITCH.maxX / TACTICAL_PITCH.maxY,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    progressBarBg: {
      width: '100%',
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.elevated,
      overflow: 'hidden',
      marginTop: 2,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: tokens.accent,
      borderRadius: 2,
    },
    modernBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      marginTop: 2,
    },
    leftControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    playBtnActive: {
      backgroundColor: tokens.accent,
    },
    loopBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tokens.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loopBtnActive: {
      backgroundColor: tokens.soft,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    speedPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    speedPillText: {
      fontSize: 12,
      fontWeight: '800',
      color: tokens.accent,
    },
    controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    button: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    buttonSelected: { backgroundColor: 'transparent', borderColor: tokens.accent },
    buttonText: { color: tokens.foreground },
    buttonTextSelected: { color: tokens.accent, fontWeight: '700' },
    error: { color: tokens.foreground, fontWeight: '700' },
  });
}
