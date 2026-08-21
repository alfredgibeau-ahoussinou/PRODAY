import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import { PresidentText } from './presidentUi';
import {
  presidentRadius,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentHealth, PresidentHealthAxis } from '../hooks/usePresidentHealth';
import type { PresidentThemeTokens } from '../theme/presidentTokens';

type Props = {
  health: PresidentHealth;
  onAxisPress: (axis: PresidentHealthAxis) => void;
};

export function PresidentHealthBoard({ health, onAxisPress }: Props) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <View style={styles.wrap}>
      <View style={styles.overall}>
        <PresidentText variant="label" champagne>
          Santé du club
        </PresidentText>
        <PresidentText variant="stat" style={{ color: tokens.champagne }}>
          {health.overall}%
        </PresidentText>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${health.overall}%` as `${number}%` }]} />
        </View>
      </View>
      <View style={styles.axes}>
        {health.axes.map((axis) => (
          <PressableSpring
            key={axis.id}
            onPress={() => onAxisPress(axis)}
            scaleTo={0.97}
            haptic
            style={styles.axis}
          >
            <View style={styles.axisTop}>
              <PresidentText variant="caption" style={{ fontWeight: '700' }}>
                {axis.label}
              </PresidentText>
              <PresidentText
                variant="caption"
                style={{
                  color:
                    axis.tone === 'ok'
                      ? tokens.success
                      : axis.tone === 'warn'
                        ? tokens.warn
                        : tokens.danger,
                  fontWeight: '800',
                }}
              >
                {axis.score}%
              </PresidentText>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    width: `${axis.score}%` as `${number}%`,
                    backgroundColor:
                      axis.tone === 'ok'
                        ? tokens.success
                        : axis.tone === 'warn'
                          ? tokens.warn
                          : tokens.danger,
                  },
                ]}
              />
            </View>
            <PresidentText variant="caption" muted numberOfLines={2}>
              {axis.summary}
            </PresidentText>
          </PressableSpring>
        ))}
      </View>
    </View>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    wrap: { gap: presidentSpace.md },
    overall: {
      padding: presidentSpace.lg,
      borderRadius: presidentRadius.lg,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.surfaceRaised,
      gap: 6,
    },
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.surfaceMuted,
      marginTop: 8,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    axes: { gap: presidentSpace.sm },
    axis: {
      padding: presidentSpace.md,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      gap: 6,
    },
    axisTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    miniTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.surfaceMuted,
      overflow: 'hidden',
    },
    miniFill: { height: '100%', borderRadius: 2 },
  });
}
