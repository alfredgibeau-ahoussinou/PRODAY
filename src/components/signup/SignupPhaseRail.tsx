import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { SignupPhase } from '../../screens/signup/signupFlowConfig';
import { colors, spacing } from '../../theme/designTokens';

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
  accentColor = colors.ink,
}) => {
  const progress =
    phases.length <= 1 ? 100 : Math.round((phaseIndex / Math.max(phases.length - 1, 1)) * 100);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
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
                  active && [styles.labelActive, { color: accentColor }],
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

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wrapCompact: {
    paddingVertical: spacing.sm,
  },
  track: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.ink,
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
    color: colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  labelCompact: {
    fontSize: 10,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '800',
  },
  labelDone: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
