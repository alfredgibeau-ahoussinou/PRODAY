import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupParentalStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onSubmit: () => void;
}

export const SignupParentalStep: React.FC<SignupParentalStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onSubmit,
}) => {
  const underU13 = isUnderU13AppSpace(form.appSpace);
  const handleSubmit = () => {
    if (!form.validateParental()) return;
    onSubmit();
  };

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Responsable légal"
      subtitle={
        underU13
          ? 'Espace -13 — un parent ou tuteur légal doit valider le compte du jeune joueur.'
          : 'Compte mineur — renseignez un responsable légal pour activer la supervision ProDay.'
      }
      onBack={onBack}
      footer={
        <SignupFooterButton
          label="Continuer"
          onPress={handleSubmit}
          loading={form.loading}
        />
      }
    >
      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Protection activée</Text>
        <Text style={styles.infoBody}>
          Filtrage des contacts, limite de temps d&apos;écran et rapport d&apos;activité pour
          les comptes de moins de 18 ans.
        </Text>
      </View>

      <AuthTextField
        label="Nom du responsable"
        icon="person"
        placeholder="Parent ou tuteur légal"
        value={form.guardianName}
        onChangeText={form.setGuardianName}
        error={form.fieldErrors.guardianName}
      />
      <AuthTextField
        label="Email du responsable"
        icon="mail"
        placeholder="parent@exemple.com"
        value={form.guardianEmail}
        onChangeText={form.setGuardianEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={form.fieldErrors.guardianEmail}
      />

      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => form.setGuardianConsent(!form.guardianConsent)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, form.guardianConsent && styles.checkboxOn]}>
          {form.guardianConsent ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.consentText}>
          Je confirme être mineur et que mon responsable accepte la supervision du compte
          ProDay.
        </Text>
      </TouchableOpacity>
      {form.fieldErrors.guardianConsent ? (
        <Text style={styles.error}>{form.fieldErrors.guardianConsent}</Text>
      ) : null}
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.md, fontWeight: '600' },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  infoBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkMark: { color: colors.brandInverse, fontSize: 14, fontWeight: '900' },
  consentText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
