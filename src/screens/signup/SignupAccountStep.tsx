import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getAccountSubtitle } from './signupFlowConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { colors, spacing } from '../../theme/designTokens';

interface SignupAccountStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export const SignupAccountStep: React.FC<SignupAccountStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onNext,
  nextLabel = 'Créer mon compte',
}) => {
  const passwordHint =
    form.password.length === 0
      ? null
      : form.password.length < 6
        ? 'Trop court (6 car. min.)'
        : form.password.length < 10
          ? 'Acceptable'
          : 'Solide';

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Créer votre compte"
      subtitle={getAccountSubtitle(form.role, form.isOAuthCompletion)}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label={nextLabel}
          onPress={onNext}
          loading={form.loading}
        />
      }
    >
      {form.error ? (
        <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
      ) : null}

      <AuthTextField
        label="Nom affiché"
        icon="person"
        placeholder="Prénom Nom"
        value={form.displayName}
        onChangeText={form.setDisplayName}
        error={form.fieldErrors.displayName}
      />
      <AuthTextField
        label="Email"
        icon="mail"
        placeholder="vous@exemple.com"
        value={form.email}
        onChangeText={form.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!form.isOAuthCompletion}
        error={form.fieldErrors.email}
      />
      {form.isOAuthCompletion ? null : (
        <>
          <AuthTextField
            label="Mot de passe"
            icon="lock"
            placeholder="6 caractères minimum"
            value={form.password}
            onChangeText={form.setPassword}
            secureToggle
            error={form.fieldErrors.password}
          />
          {passwordHint ? (
            <Text
              style={[
                styles.hint,
                form.password.length < 6 ? styles.hintWeak : styles.hintOk,
              ]}
            >
              {passwordHint}
            </Text>
          ) : null}
          <AuthTextField
            label="Confirmer le mot de passe"
            icon="lock"
            placeholder="Répétez le mot de passe"
            value={form.confirmPassword}
            onChangeText={form.setConfirmPassword}
            secureToggle
            error={form.fieldErrors.confirmPassword}
          />
        </>
      )}
      {form.role === 'sponsor' ? (
        <AuthTextField
          label="Ville / région"
          icon="location"
          placeholder="Paris, Lyon…"
          value={form.city}
          onChangeText={form.setCity}
          error={form.fieldErrors.city}
        />
      ) : null}
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  hint: { fontSize: 12, marginTop: -spacing.sm, marginBottom: spacing.sm },
  hintWeak: { color: colors.warning },
  hintOk: { color: colors.textMuted },
});
