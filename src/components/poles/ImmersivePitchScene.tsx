import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  Stop,
  Line,
  Path,
  Polygon,
} from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';

export type ImmersivePitchMood =
  | 'warm_playful'
  | 'dynamic_competitive'
  | 'precise_performance'
  | 'club'
  | 'coach';

type Props = {
  mood?: ImmersivePitchMood;
  height?: number;
  /** Mode fond : pleine largeur, position relative (atmosphère). */
  fill?: boolean;
};

const MOOD_GRASS: Record<ImmersivePitchMood, [string, string]> = {
  warm_playful: ['#3D9B5F', '#2A7A48'],
  dynamic_competitive: ['#1F6B45', '#0F3D28'],
  precise_performance: ['#0E3B2E', '#071F18'],
  club: ['#1A5C3A', '#0C3320'],
  coach: ['#164A32', '#0A2418'],
};

/**
 * Scène terrain 2.5D (SVG + Reanimated) — perspective, ballon flottant, sans Three.js.
 */
export function ImmersivePitchScene({
  mood = 'dynamic_competitive',
  height = 132,
  fill = false,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const width = fill ? winW : Math.max(280, winW - 48);
  const [g0, g1] = MOOD_GRASS[mood];
  const ballX = useSharedValue(-40);
  const floatY = useSharedValue(0);
  const particle = useSharedValue(0);
  const depthPulse = useSharedValue(0);

  useEffect(() => {
    ballX.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(width + 40, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
          withTiming(-40, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    particle.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.linear }), -1, false);
    depthPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [ballX, floatY, particle, depthPulse, width]);

  const ballStyle = useAnimatedStyle(() => {
    const t = interpolate(ballX.value, [-40, width + 40], [0, 1]);
    const scale = interpolate(t, [0, 0.5, 1], [0.72, 1.08, 0.78]);
    return {
      transform: [
        { translateX: ballX.value },
        { translateY: floatY.value + interpolate(t, [0, 0.5, 1], [10, -4, 12]) },
        { scale },
        { rotate: `${interpolate(ballX.value, [-40, width + 40], [0, 720])}deg` },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const t = interpolate(ballX.value, [-40, width + 40], [0, 1]);
    const scaleX = interpolate(t, [0, 0.5, 1], [0.55, 1.15, 0.6]);
    return {
      opacity: interpolate(floatY.value, [-8, 0], [0.22, 0.4]),
      transform: [
        { translateX: ballX.value + 4 },
        { scaleX },
        { scaleY: interpolate(floatY.value, [-8, 0], [0.7, 1]) },
      ],
    };
  });

  const sparkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(particle.value, [0, 0.5, 1], [0.12, 0.6, 0.12]),
    transform: [{ translateY: interpolate(particle.value, [0, 1], [10, -14]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(depthPulse.value, [0, 1], [0.18, 0.42]),
  }));

  const midY = height * 0.42;
  const farY = height * 0.18;
  const nearY = height - 6;

  return (
    <View
      pointerEvents="none"
      style={[
        fill ? styles.fillRoot : styles.root,
        { height },
        fill && { width: '100%' },
      ]}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={g0} stopOpacity="0.55" />
            <Stop offset="0.35" stopColor={g0} stopOpacity="0.92" />
            <Stop offset="1" stopColor={g1} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="depth" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000" stopOpacity="0.45" />
            <Stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </LinearGradient>
          <LinearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Trapèze perspective — terrain fuyant */}
        <Polygon
          points={`0,${nearY} ${width},${nearY} ${width * 0.82},${farY} ${width * 0.18},${farY}`}
          fill="url(#grass)"
        />
        {/* Bandes perspective */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const t0 = i / 6;
          const t1 = (i + 1) / 6;
          const yTop = farY + (midY - farY) * t0;
          const yBot = farY + (midY - farY) * t1;
          const insetTop = width * 0.18 + (width * 0.0 - width * 0.18) * (t0 * 0.15);
          const leftTop = insetTop;
          const rightTop = width - insetTop;
          const leftBot = insetTop - 8 * t1;
          const rightBot = width - insetTop + 8 * t1;
          return (
            <Polygon
              key={i}
              points={`${leftTop},${yTop} ${rightTop},${yTop} ${rightBot},${yBot} ${leftBot},${yBot}`}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}
            />
          );
        })}
        <Polygon
          points={`0,${nearY} ${width},${nearY} ${width * 0.82},${farY} ${width * 0.18},${farY}`}
          fill="url(#depth)"
        />
        <Rect x={0} y={0} width={width} height={farY + 8} fill="url(#horizon)" />
        {/* Ligne médiane + rond central (perspective) */}
        <Line
          x1={width / 2}
          y1={farY + 4}
          x2={width / 2}
          y2={nearY - 4}
          stroke="rgba(255,255,255,0.38)"
          strokeWidth={1.6}
        />
        <Ellipse
          cx={width / 2}
          cy={midY + 6}
          rx={Math.min(42, width * 0.12)}
          ry={Math.min(16, height * 0.12)}
          stroke="rgba(255,255,255,0.36)"
          strokeWidth={1.4}
          fill="none"
        />
        <Circle cx={width / 2} cy={midY + 6} r={2.2} fill="rgba(255,255,255,0.55)" />
        {/* Surfaces de but en perspective */}
        <Path
          d={`M ${width * 0.22} ${farY + 10} L ${width * 0.3} ${midY - 4} L ${width * 0.3} ${midY + 28} L ${width * 0.22} ${nearY - 28} Z`}
          stroke="rgba(255,255,255,0.26)"
          strokeWidth={1.1}
          fill="none"
        />
        <Path
          d={`M ${width * 0.78} ${farY + 10} L ${width * 0.7} ${midY - 4} L ${width * 0.7} ${midY + 28} L ${width * 0.78} ${nearY - 28} Z`}
          stroke="rgba(255,255,255,0.26)"
          strokeWidth={1.1}
          fill="none"
        />
        {/* Filets / buts stylisés */}
        <Rect
          x={width * 0.12}
          y={farY - 2}
          width={width * 0.08}
          height={10}
          rx={1}
          fill="rgba(255,255,255,0.2)"
        />
        <Rect
          x={width * 0.8}
          y={farY - 2}
          width={width * 0.08}
          height={10}
          rx={1}
          fill="rgba(255,255,255,0.2)"
        />
      </Svg>
      <Animated.View style={[styles.centerGlow, glowStyle, { top: midY - 20, left: width / 2 - 40 }]} />
      <Animated.View style={[styles.spark, sparkStyle, { left: width * 0.28 }]}>
        <View style={styles.sparkDot} />
      </Animated.View>
      <Animated.View style={[styles.spark, sparkStyle, { left: width * 0.62, top: 22 }]}>
        <View style={[styles.sparkDot, { width: 5, height: 5 }]} />
      </Animated.View>
      <Animated.View style={[styles.ballShadow, shadowStyle, { bottom: 10 }]} />
      <Animated.View style={[styles.ball, ballStyle]}>
        <Icon name="football" size={28} color="#FFFFFF" variant="filled" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  fillRoot: {
    position: 'relative',
    overflow: 'hidden',
  },
  ball: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ballShadow: {
    position: 'absolute',
    left: 0,
    width: 34,
    height: 10,
    borderRadius: 17,
    backgroundColor: '#000',
  },
  spark: {
    position: 'absolute',
    top: 28,
  },
  sparkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  centerGlow: {
    position: 'absolute',
    width: 80,
    height: 40,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
