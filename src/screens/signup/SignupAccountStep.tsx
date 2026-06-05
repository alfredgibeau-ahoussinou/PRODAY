import React from 'react';
import { View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { getProStepMeta } from './signupProConfig';
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
  const meta = form.isProProduct
    ? getProStepMeta('account')
    : getPlayerStepMeta(form.productLine, 'account');
  return (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={meta.title}
    subtitle={meta.subtitle}
    contentKey={`account-${form.role}`}
    heroIcon={meta.heroIcon}
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
