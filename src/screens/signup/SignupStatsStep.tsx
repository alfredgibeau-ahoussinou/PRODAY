import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupStatsStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupStatsStep: React.FC<SignupStatsStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const meta = getPlayerStepMeta(form.productLine, 'stats');
  return (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={meta.title}
    subtitle={meta.subtitle}
    contentKey="player-stats"
    heroIcon={meta.heroIcon}
    onBack={onBack}
    footer={
      <>
        <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
        <View style={styles.skipWrap}>
          <SignupFooterButton
            label="Passer cette étape"
            variant="secondary"
            showArrow={false}
            onPress={() => form.goNext()}
          />
        </View>
      </>
    }
  >
    <View>
      <View style={styles.statRow}>
        {(
          [
            ['Matchs', form.statMatches, form.setStatMatches, form.fieldErrors.statMatches],
            ['Buts', form.statGoals, form.setStatGoals, form.fieldErrors.statGoals],
            ['Passes d.', form.statAssists, form.setStatAssists, form.fieldErrors.statAssists],
          ] as const
        ).map(([label, value, setter, err], i) => (
          <View key={label} style={styles.statCell}>
            <Text style={styles.statLabel}>{label}</Text>
            <TextInput
              style={[styles.statInput, err ? styles.statInputError : null]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={setter}
              keyboardType="number-pad"
            />
            {err ? <Text style={styles.statError}>{err}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  skipWrap: { marginTop: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCell: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  statInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    textAlign: 'center',
  },
  statInputError: { borderColor: colors.error },
  statError: {
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
