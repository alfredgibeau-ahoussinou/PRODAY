import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import { Icon, type IconName } from '../../components/ui/Icon';
import type { SignupForm } from './useSignupForm';
import { APP_SPACE_GROUPS } from './signupFlowConfig';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupProgramStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onClose: () => void;
}

export const SignupProgramStep: React.FC<SignupProgramStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onClose,
}) => (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title="Votre espace ProDay"
    subtitle="Une seule famille d’âge et de compétition — le Mercato sera filtré en conséquence."
    onClose={onClose}
    onBack={form.goBack}
    footer={
      <SignupFooterButton
        label="Continuer"
        onPress={() => {
          if (!form.validateProgram()) return;
          form.goNext();
        }}
      />
    }
  >
    {form.fieldErrors.appSpace ? (
      <Text style={styles.error}>{form.fieldErrors.appSpace}</Text>
    ) : null}

    {APP_SPACE_GROUPS.map((group) => (
      <View key={group.id} style={styles.group}>
        <View style={styles.groupHead}>
          <Icon name={group.icon as IconName} size={18} color={colors.accent} />
          <Text style={styles.groupTitle}>{group.label}</Text>
        </View>
        <View style={styles.options}>
          {group.options.map((opt) => {
            const active = form.appSpace === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => form.setAppSpace(opt.id)}
                activeOpacity={0.88}
              >
                <Text style={[styles.chipTitle, active && styles.chipTitleActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.chipHint, active && styles.chipHintActive]}>
                  {opt.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ))}
  </SignupStepLayout>
);

const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  group: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexGrow: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.accent },
  chipTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  chipTitleActive: { color: colors.brandInverse },
  chipHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  chipHintActive: { color: colors.heroMuted },
});
