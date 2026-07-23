import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { SignupPhase } from '../../screens/signup/signupFlowConfig';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupPhaseRailProps {
  phases: SignupPhase[];
  phaseIndex: number;
  compact?: boolean;
  accentColor?: string;
}

export const SignupPhaseRail: React.FC<SignupPhaseRailProps> = ({
  phases,
  phaseIndex,
  compact,
  accentColor,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const accent = accentColor ?? c.ink;
  const progress =
    phases.length <= 1 ? 100 : Math.round((phaseIndex / Math.max(phases.length - 1, 1)) * 100);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.labels}>
        {phases.map((phase, i) => {
          const done = i < phaseIndex;
          const active = i === phaseIndex;
          return (
            <View key={phase.id} style={styles.labelCell}>
              <Text
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  done && styles.labelDone,
                  active && [styles.labelActive, { color: accent }],
                ]}
                numberOfLines={1}
              >
                {phase.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    wrapCompact: {
      paddingVertical: spacing.sm,
    },
    track: {
      height: 2,
      borderRadius: 1,
      backgroundColor: c.surfaceMuted,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    trackFill: {
      height: '100%',
      backgroundColor: c.accent,
      borderRadius: 1,
    },
    labels: {
      flexDirection: 'row',
    },
    labelCell: {
      flex: 1,
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    labelCompact: {
      fontSize: 10,
    },
    labelActive: {
      color: c.ink,
      fontWeight: '800',
    },
    labelDone: {
      color: c.textSecondary,
      fontWeight: '700',
    },
  });
}
