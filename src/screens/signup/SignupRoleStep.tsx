import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthRolePicker } from '../../components/auth/AuthRolePicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getRoleLabel } from './signupFlowConfig';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupRoleStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  onClose: () => void;
}

export const SignupRoleStep: React.FC<SignupRoleStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  onClose,
}) => (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    title="Qui êtes-vous ?"
    subtitle="Choisissez un seul rôle — le parcours suivant sera entièrement adapté."
    onClose={onClose}
    footer={
      <SignupFooterButton
        label="Commencer ce parcours"
        onPress={form.confirmRoleAndContinue}
      />
    }
  >
    {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

    <View style={styles.preview}>
      <Text style={styles.previewLabel}>
        Parcours {getRoleLabel(form.draftRole)}
      </Text>
      <Text style={styles.previewIntro}>{form.flowIntro.subtitle}</Text>
      <View style={styles.stepsList}>
        {form.flowStepLabels.map((label, i) => (
          <View key={label} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>

    <AuthRolePicker value={form.draftRole} onChange={form.setDraftRole} />
  </SignupStepLayout>
);

const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  preview: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  previewIntro: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },
  stepsList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    color: colors.brandInverse,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});
