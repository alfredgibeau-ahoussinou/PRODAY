import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getStaffStepSubtitle, MEDICAL_POLE_SPECIALTIES } from './signupFlowConfig';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupStaffStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupStaffStep: React.FC<SignupStaffStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Profil professionnel"
      subtitle={getStaffStepSubtitle(form.role)}
      contentKey={`staff-${form.role}`}
      heroIcon="briefcase"
      onBack={onBack}
      footer={
        <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      <View>
        <Text style={styles.staffHint}>
          Documents vérifiés après confirmation de l&apos;email.
        </Text>
      </View>
      {form.role === 'physio' ? (
        <View>
          <SignupOptionPicker
            label="Spécialité du pôle médical *"
            options={MEDICAL_POLE_SPECIALTIES}
            value={form.medicalSpecialty}
            onChange={(value) =>
              form.setMedicalSpecialty(value as typeof form.medicalSpecialty)
            }
            error={form.fieldErrors.medicalSpecialty}
          />
        </View>
      ) : null}
      <View>
        <AuthTextField
          label="Ville *"
          icon="location"
          placeholder="Ex. Paris, Lyon…"
          value={form.city}
          onChangeText={form.setCity}
          error={form.fieldErrors.city}
        />
      </View>
      <View>
        <AuthTextField
          label={
            form.role === 'agent' || form.role === 'club' || form.role === 'recruiter'
              ? 'Département *'
              : 'Département (optionnel)'
          }
          icon="location"
          placeholder="Ex. 75, 69, 2A, 971…"
          value={form.department}
          onChangeText={form.setDepartment}
          error={form.fieldErrors.department}
        />
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    staffHint: {
      fontSize: 13,
      lineHeight: 20,
      color: c.textSecondary,
      marginBottom: spacing.lg,
      backgroundColor: c.brandSoft,
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
}
