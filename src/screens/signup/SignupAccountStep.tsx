import React from 'react';
import { View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getWomanStepMeta } from './signupWomanConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';

interface SignupAccountStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
}

export const SignupAccountStep: React.FC<SignupAccountStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const womanMeta = form.isWomanProduct ? getWomanStepMeta('account') : null;
  return (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={womanMeta?.title ?? 'Ton identité'}
    subtitle={womanMeta?.subtitle ?? 'Nom et email — la base de ton compte ProDay.'}
    contentKey={`account-${form.role}`}
    heroIcon={womanMeta?.heroIcon ?? 'person'}
    onBack={onBack}
    footer={
      <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
    }
  >
    {form.error ? (
      <View>
        <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
      </View>
    ) : null}

    <View>
      <AuthTextField
        label="Nom affiché"
        icon="person"
        placeholder="Prénom Nom"
        value={form.displayName}
        onChangeText={form.setDisplayName}
        error={form.fieldErrors.displayName}
      />
    </View>
    <View>
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
    </View>
    {form.role === 'sponsor' ? (
      <View>
        <AuthTextField
          label="Ville / région *"
          icon="location"
          placeholder="Paris, Lyon…"
          value={form.city}
          onChangeText={form.setCity}
          error={form.fieldErrors.city}
        />
      </View>
    ) : null}
  </SignupStepLayout>
  );
};
