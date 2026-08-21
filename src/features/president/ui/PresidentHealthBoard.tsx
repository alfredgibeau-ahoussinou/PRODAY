import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LivePulseDot, PressableSpring, StaggerReveal } from '../../../components/motion';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import { PresidentText } from './presidentUi';
import {
  presidentMotion,
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentHealth, PresidentHealthAxis } from '../hooks/usePresidentHealth';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  health: PresidentHealth;
  onAxisPress: (axis: PresidentHealthAxis) => void;
  /** Mode immersif : héros santé + grille d’axes (cockpit Accueil). */
  immersive?: boolean;
};

function toneColor(tokens: PresidentThemeTokens, tone: PresidentHealthAxis['tone']) {
  if (tone === 'ok') return tokens.success;
  if (tone === 'warn') return tokens.warn;
  return tokens.danger;
}

function AxisBar({
  score,
  color,
  tokens,
}: {
  score: number;
  color: string;
  tokens: PresidentThemeTokens;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: presidentMotion.bar,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0.02, progress.value) * 100}%`,
  }));

  return (
    <View style={[styles.miniTrack, { backgroundColor: tokens.surfaceMuted }]}>
      <Animated.View style={[styles.miniFill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

function OverallRing({
  overall,
  tokens,
}: {
  overall: number;
  tokens: PresidentThemeTokens;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(overall / 100, {
      duration: presidentMotion.settle,
      easing: Easing.out(Easing.cubic),
    });
  }, [overall, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0.04, progress.value) * 100}%`,
  }));

  const statusLabel =
    overall >= 75 ? 'Structure saine' : overall >= 50 ? 'Attention requise' : 'Priorité direction';

  return (
    <View style={[styles.overall, { borderColor: tokens.borderLuxury, backgroundColor: tokens.surface }]}>
      <LinearGradient
        colors={[tokens.champagneGlow, 'transparent', 'rgba(0,0,0,0.25)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overallTop}>
        <View style={styles.liveRow}>
          <LivePulseDot active color={tokens.champagne} size={7} />
          <PresidentText variant="label" champagne>
            Santé du club
          </PresidentText>
        </View>
        <PresidentText variant="caption" muted>
          {statusLabel}
        </PresidentText>
      </View>
      <View style={styles.scoreRow}>
        <PresidentText variant="stat" style={{ color: tokens.champagneBright }}>
          {overall}
        </PresidentText>
        <PresidentText variant="h3" champagne style={{ marginBottom: 8 }}>
          %
        </PresidentText>
      </View>
      <View style={[styles.barTrack, { backgroundColor: tokens.ink }]}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: tokens.accent }, fillStyle]}
        />
      </View>
      <PresidentText variant="caption" muted style={{ marginTop: 4 }}>
        Indice composite · cinq axes de direction
      </PresidentText>
    </View>
  );
}

export function PresidentHealthBoard({ health, onAxisPress, immersive = false }: Props) {
  const { tokens } = usePresidentTheme();
  const stylesLocal = useMemo(() => createStyles(tokens, immersive), [tokens, immersive]);

  return (
    <View style={stylesLocal.wrap}>
      <StaggerReveal index={0} delayStep={presidentMotion.stagger}>
        <OverallRing overall={health.overall} tokens={tokens} />
      </StaggerReveal>
      <View style={stylesLocal.axes}>
        {health.axes.map((axis, i) => {
          const color = toneColor(tokens, axis.tone);
          return (
            <StaggerReveal key={axis.id} index={i + 1} delayStep={presidentMotion.stagger}>
              <PressableSpring
                onPress={() => onAxisPress(axis)}
                scaleTo={0.97}
                haptic
                style={stylesLocal.axis}
              >
                <View style={stylesLocal.axisTop}>
                  <View style={stylesLocal.axisLabelRow}>
                    <View style={[stylesLocal.toneDot, { backgroundColor: color }]} />
                    <PresidentText variant="caption" style={{ fontWeight: '700' }}>
                      {axis.label}
                    </PresidentText>
                  </View>
                  <PresidentText
                    variant="statSm"
                    style={{ color, fontSize: immersive ? 20 : 18, lineHeight: 24 }}
                  >
                    {axis.score}
                  </PresidentText>
                </View>
                <AxisBar score={axis.score} color={color} tokens={tokens} />
                <PresidentText variant="caption" muted numberOfLines={2}>
                  {axis.summary}
                </PresidentText>
              </PressableSpring>
            </StaggerReveal>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overall: {
    padding: presidentSpace.xl,
    borderRadius: presidentRadius.xl,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    ...presidentShadow.card,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  miniTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniFill: { height: '100%', borderRadius: 3 },
});

function createStyles(tokens: PresidentThemeTokens, immersive: boolean) {
  return StyleSheet.create({
    wrap: { gap: presidentSpace.md },
    axes: {
      gap: presidentSpace.sm,
      flexDirection: immersive ? 'row' : 'column',
      flexWrap: immersive ? 'wrap' : 'nowrap',
    },
    axis: {
      padding: presidentSpace.md,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surfaceGlass,
      gap: 8,
      ...(immersive
        ? {
            flexBasis: '47%' as DimensionValue,
            flexGrow: 1,
            maxWidth: '48%' as DimensionValue,
            minWidth: 148,
          }
        : {}),
    },
    axisTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    axisLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toneDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
  });
}
