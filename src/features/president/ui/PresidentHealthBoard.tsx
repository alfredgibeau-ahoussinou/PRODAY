import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
  presidentLayout,
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

function chunkAxes<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
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
  flush,
}: {
  overall: number;
  tokens: PresidentThemeTokens;
  flush?: boolean;
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
    <View
      style={[
        styles.overall,
        {
          borderColor: flush ? tokens.border : tokens.borderLuxury,
          backgroundColor: flush ? tokens.surfaceMuted : tokens.surface,
          padding: flush ? presidentSpace.lg : presidentLayout.heroPad,
        },
      ]}
    >
      <LinearGradient
        colors={[tokens.champagneGlow, 'transparent', 'rgba(0,0,0,0.25)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overallTop}>
        <View style={styles.liveRow}>
          <LivePulseDot active color={tokens.champagne} size={7} />
          <PresidentText variant="label" champagne numberOfLines={1}>
            Santé du club
          </PresidentText>
        </View>
        <PresidentText variant="caption" muted numberOfLines={1} style={styles.statusLabel}>
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
      <PresidentText variant="caption" muted style={{ marginTop: 4 }} numberOfLines={1}>
        Indice composite · cinq axes de direction
      </PresidentText>
    </View>
  );
}

export function PresidentHealthBoard({ health, onAxisPress, immersive = false }: Props) {
  const { tokens } = usePresidentTheme();
  const stylesLocal = useMemo(() => createStyles(tokens, immersive), [tokens, immersive]);
  const columns = immersive ? 2 : 1;
  const rows = useMemo(() => chunkAxes(health.axes, columns), [health.axes, columns]);

  return (
    <View style={stylesLocal.wrap}>
      <StaggerReveal index={0} delayStep={presidentMotion.stagger}>
        <OverallRing overall={health.overall} tokens={tokens} flush={immersive} />
      </StaggerReveal>
      <View style={stylesLocal.axes}>
        {rows.map((row, rowIndex) => (
          <View key={`axis-row-${rowIndex}`} style={stylesLocal.axisRow}>
            {row.map((axis, colIndex) => {
              const flatIndex = rowIndex * columns + colIndex;
              const color = toneColor(tokens, axis.tone);
              return (
                <StaggerReveal
                  key={axis.id}
                  index={flatIndex + 1}
                  delayStep={presidentMotion.stagger}
                  style={stylesLocal.axisCell}
                >
                  <PressableSpring
                    onPress={() => onAxisPress(axis)}
                    scaleTo={0.97}
                    haptic
                    style={stylesLocal.axis}
                  >
                    <View style={stylesLocal.axisTop}>
                      <View style={stylesLocal.axisLabelRow}>
                        <View style={[stylesLocal.toneDot, { backgroundColor: color }]} />
                        <PresidentText
                          variant="caption"
                          style={{ fontWeight: '700', flexShrink: 1 }}
                          numberOfLines={1}
                        >
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
            {/* Placeholder : dernier axe impair reste demi-largeur, pas étiré. */}
            {immersive && row.length === 1 ? <View style={stylesLocal.axisCell} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overall: {
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
    gap: presidentSpace.sm,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 },
  statusLabel: { flexShrink: 1, textAlign: 'right' },
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
    wrap: { gap: presidentLayout.gridGap },
    axes: {
      gap: presidentLayout.gridGap,
    },
    axisRow: {
      flexDirection: immersive ? 'row' : 'column',
      gap: presidentLayout.gridGap,
      alignItems: 'stretch',
    },
    axisCell: {
      flex: immersive ? 1 : undefined,
      minWidth: 0,
    },
    axis: {
      flex: immersive ? 1 : undefined,
      padding: presidentSpace.md,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surfaceGlass,
      gap: 8,
      minHeight: immersive ? 108 : undefined,
    },
    axisTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: presidentSpace.sm,
    },
    axisLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
    toneDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
  });
}
