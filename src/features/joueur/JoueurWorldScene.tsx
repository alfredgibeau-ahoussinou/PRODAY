import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Line,
  Path,
  Polygon,
  G,
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
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import type { JoueurSceneKind } from '../../utils/joueurExperienceTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { JoueurHudCorners } from '../../components/player/joueurPortalUi';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';

type Props = {
  identity: JoueurPageIdentity;
  kind?: JoueurSceneKind;
  height?: number;
  compact?: boolean;
  showBanner?: boolean;
  bannerLabel?: string;
};

function sceneKindForAge(ageGroup: JoueurPageIdentity['ageGroup']): JoueurSceneKind {
  if (ageGroup === 'youth') return 'pitch_playful';
  if (ageGroup === 'teen') return 'pitch_dynamic';
  return 'pitch_data';
}

/**
 * Scène jeu 2.5D — perspective terrain, néon, orbes, ballon arcade.
 */
export function JoueurWorldScene({
  identity,
  kind: kindProp,
  height: heightProp,
  compact = false,
  showBanner = false,
  bannerLabel,
}: Props) {
  const kind = kindProp ?? sceneKindForAge(identity.ageGroup);
  const { width } = useWindowDimensions();
  const w = Math.max(320, width - (compact ? 24 : 0));
  const h =
    heightProp ??
    (compact
      ? 140
      : kind === 'pitch_playful'
        ? 230
        : kind === 'pitch_dynamic'
          ? 210
          : 200);

  const ballX = useSharedValue(-40);
  const floatY = useSharedValue(0);
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    const speed =
      kind === 'pitch_playful' ? 2800 : kind === 'pitch_dynamic' ? 3400 : 4800;
    ballX.value = withDelay(
      80,
      withRepeat(
        withSequence(
          withTiming(w + 40, { duration: speed, easing: Easing.inOut(Easing.quad) }),
          withTiming(-40, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(kind === 'pitch_playful' ? -16 : -10, {
          duration: kind === 'pitch_playful' ? 520 : 780,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: kind === 'pitch_playful' ? 520 : 780,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    spin.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
    ring.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [ballX, floatY, pulse, spin, ring, w, kind]);

  const ballStyle = useAnimatedStyle(() => {
    const t = interpolate(ballX.value, [-40, w + 40], [0, 1]);
    const scale = interpolate(
      t,
      [0, 0.5, 1],
      kind === 'pitch_playful' ? [0.7, 1.45, 0.75] : [0.8, 1.25, 0.85],
    );
    const rot = spin.value * 360;
    return {
      transform: [
        { translateX: ballX.value },
        { translateY: floatY.value + interpolate(t, [0, 0.5, 1], [10, -8, 12]) },
        { scale },
        { rotate: `${rot}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - ring.value),
    transform: [{ scale: 0.5 + ring.value * 1.6 }],
  }));

  const joueurTheme = useJoueurTheme();
  const accent = joueurTheme.accent;
  const accentBright = joueurTheme.accentBright;
  const isFemale = identity.gender === 'female';

  const grassTop =
    kind === 'pitch_playful'
      ? isFemale
        ? '#0f766e'
        : '#16a34a'
      : kind === 'pitch_dynamic'
        ? '#0e7490'
        : '#1d4ed8';
  const grassBot =
    kind === 'pitch_playful'
      ? isFemale
        ? '#042f2e'
        : '#052e16'
      : '#020617';

  return (
    <View style={[styles.root, { height: h, borderColor: accent }]}>
      <JoueurHudCorners color={accent} size={14} thickness={2} />
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={identity.wash[0]} stopOpacity="1" />
            <Stop offset="0.55" stopColor={grassBot} stopOpacity="1" />
            <Stop offset="1" stopColor="#000" stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={grassTop} stopOpacity="0.98" />
            <Stop offset="1" stopColor={grassBot} stopOpacity="1" />
          </SvgLinearGradient>
          <RadialGradient id="neon" cx="50%" cy="40%" r="50%">
            <Stop offset="0" stopColor={accentBright} stopOpacity="0.55" />
            <Stop offset="1" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={w} height={h} fill="url(#sky)" />
        <Ellipse cx={w * 0.5} cy={h * 0.28} rx={w * 0.42} ry={h * 0.22} fill="url(#neon)" />

        {/* Far stands / depth */}
        <Polygon
          points={`${w * 0.05},${h * 0.36} ${w * 0.95},${h * 0.36} ${w},${h * 0.42} 0,${h * 0.42}`}
          fill="rgba(0,0,0,0.35)"
        />

        <Polygon
          points={`${w * 0.08},${h * 0.42} ${w * 0.92},${h * 0.42} ${w},${h} 0,${h}`}
          fill="url(#pitch)"
          opacity={0.98}
        />

        {/* Neon pitch lines */}
        <Line
          x1={w * 0.5}
          y1={h * 0.42}
          x2={w * 0.5}
          y2={h}
          stroke={accentBright}
          strokeWidth={2}
          opacity={0.55}
        />
        <Ellipse
          cx={w * 0.5}
          cy={h * 0.68}
          rx={w * 0.14}
          ry={h * 0.09}
          stroke={accentBright}
          strokeWidth={2}
          fill="none"
          opacity={0.7}
        />
        <Rect
          x={w * 0.38}
          y={h * 0.42}
          width={w * 0.24}
          height={h * 0.08}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          opacity={0.65}
        />

        {kind === 'pitch_playful' ? (
          <G>
            {[0.18, 0.32, 0.5, 0.68, 0.82].map((x, i) => (
              <Circle
                key={i}
                cx={w * x}
                cy={h * (0.16 + (i % 3) * 0.05)}
                r={4 + (i % 2) * 2}
                fill={i % 2 === 0 ? JOUEUR_SITE.xp : accentBright}
                opacity={0.75}
              />
            ))}
            <Path
              d={`M ${w * 0.12} ${h * 0.28} Q ${w * 0.5} ${h * 0.05} ${w * 0.88} ${h * 0.3}`}
              stroke={JOUEUR_SITE.xp}
              strokeWidth={3}
              fill="none"
              opacity={0.45}
              strokeDasharray="6 8"
            />
          </G>
        ) : null}

        {kind === 'pitch_dynamic' ? (
          <G>
            {[0.12, 0.26, 0.4, 0.54, 0.68, 0.82].map((x, i) => (
              <Line
                key={i}
                x1={w * x}
                y1={h * 0.1}
                x2={w * x + w * 0.04}
                y2={h * 0.38}
                stroke={accent}
                strokeWidth={2}
                opacity={0.25 + (i % 3) * 0.1}
              />
            ))}
            <Rect
              x={w * 0.58}
              y={h * 0.1}
              width={w * 0.34}
              height={h * 0.24}
              rx={6}
              fill="rgba(0,0,0,0.45)"
              stroke={accentBright}
              strokeWidth={2}
            />
            <Circle cx={w * 0.68} cy={h * 0.2} r={6} fill={JOUEUR_SITE.ok} />
            <Circle cx={w * 0.78} cy={h * 0.2} r={6} fill={JOUEUR_SITE.warn} />
            <Circle cx={w * 0.88} cy={h * 0.2} r={6} fill={JOUEUR_SITE.live} />
          </G>
        ) : null}

        {kind === 'pitch_data' ? (
          <G>
            {[0.16, 0.3, 0.44, 0.58, 0.72, 0.86].map((x, i) => {
              const barH = h * (0.1 + ((i * 19) % 6) * 0.035);
              return (
                <Rect
                  key={i}
                  x={w * x - w * 0.025}
                  y={h * 0.38 - barH}
                  width={w * 0.05}
                  height={barH}
                  fill={accentBright}
                  opacity={0.55}
                  rx={2}
                />
              );
            })}
            <Path
              d={`M ${w * 0.12} ${h * 0.3} L ${w * 0.28} ${h * 0.22} L ${w * 0.42} ${h * 0.26} L ${w * 0.58} ${h * 0.14} L ${w * 0.74} ${h * 0.2} L ${w * 0.9} ${h * 0.12}`}
              stroke={JOUEUR_SITE.ok}
              strokeWidth={2.5}
              fill="none"
              opacity={0.7}
            />
          </G>
        ) : null}
      </Svg>

      <Animated.View
        style={[styles.glowOrb, { backgroundColor: identity.glow }, glowStyle]}
      />
      <Animated.View
        style={[styles.impactRing, { borderColor: accentBright }, ringStyle]}
      />

      <Animated.View style={[styles.ballWrap, { top: h * 0.34 }, ballStyle]}>
        <View style={[styles.ball, { borderColor: '#fff', backgroundColor: accent }]}>
          <View style={styles.ballPenta} />
        </View>
      </Animated.View>

      {showBanner ? (
        <View style={[styles.banner, { borderColor: accent, backgroundColor: JOUEUR_SITE.panel }]}>
          <ProDayText variant="caption" style={[styles.bannerText, { color: accent }]}>
            ▶ {(bannerLabel ?? identity.hudLabel).toUpperCase()}
          </ProDayText>
        </View>
      ) : null}

      <View style={[styles.combo, { borderColor: accentBright }]}>
        <ProDayText variant="caption" style={{ color: accentBright, fontWeight: '900', fontSize: 9 }}>
          {kind === 'pitch_playful' ? 'ENCHAÎNEMENT ×3' : kind === 'pitch_dynamic' ? 'CLASSÉ' : 'DONNÉES MATCH'}
        </ProDayText>
      </View>
    </View>
  );
}

export function JoueurUniverseWorld(props: {
  identity: JoueurPageIdentity;
  showBanner?: boolean;
  compact?: boolean;
}) {
  return (
    <JoueurWorldScene
      identity={props.identity}
      compact={props.compact}
      showBanner={props.showBanner}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: JOUEUR_SITE.bg,
    borderWidth: 1.5,
  },
  glowOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -30,
    right: 10,
  },
  impactRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    top: '38%',
    left: '42%',
  },
  ballWrap: {
    position: 'absolute',
  },
  ball: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  ballPenta: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  banner: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  combo: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
