import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import {
  getStaffStepSubtitle,
  getStaffStepTitle,
} from './signupFlowConfig';
import { colors, spacing } from '../../theme/designTokens';

const ROLE_HINT: Record<string, string> = {
  coach: 'Après la création du compte, téléversez un diplôme ou une attestation d’éducateur (analyse automatique).',
  agent: 'Licence agent ou carte professionnelle demandée à l’étape suivante.',
  organizer: 'Justificatif d’organisateur (pièce d’identité + attestation club ou licence).',
  physio: 'Compte professionnel santé — partagez conseils et actualités sur le fil ProDay.',
};

interface SignupStaffStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onNext: () => void;
}

export const SignupStaffStep: React.FC<SignupStaffStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onNext,
}) => {
  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={getStaffStepTitle(form.role)}
      subtitle={getStaffStepSubtitle(form.role)}
      onBack={onBack}
      footer={<SignupFooterButton label="Continuer" onPress={onNext} />}
    >
      <Text style={styles.hint}>{ROLE_HINT[form.role] ?? ''}</Text>
      <AuthTextField
        label="Ville"
        icon="location"
        placeholder="Ex. Paris, Lyon…"
        value={form.city}
        onChangeText={form.setCity}
        error={form.fieldErrors.city}
      />
      <AuthTextField
        label="Département (optionnel)"
        icon="location"
        placeholder="Ex. 75, 69…"
        value={form.department}
        onChangeText={form.setDepartment}
      />
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
