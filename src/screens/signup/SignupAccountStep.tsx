import React from 'react';
import { View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { StaggerReveal } from '../../components/motion';
import { SignupFormCard } from '../../components/signup/SignupFormCard';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
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
  const { t } = useTranslation();
  const meta = form.isSanteProduct
    ? getSanteStepMeta('account', t)
    : form.isProProduct
      ? getProStepMeta('account', t)
      : getPlayerStepMeta(form.productLine, 'account', t);
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
      <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
    }
  >
    {form.error ? (
      <View>
        <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
      </View>
    ) : null}

    <SignupFormCard>
      <StaggerReveal index={0}>
        <AuthTextField
          label={t('signup.form.displayName')}
          icon="person"
          placeholder={t('signup.form.displayNamePlaceholder')}
          value={form.displayName}
          onChangeText={form.setDisplayName}
          error={form.fieldErrors.displayName}
        />
      </StaggerReveal>
      <StaggerReveal index={1}>
        <AuthTextField
          label={t('signup.form.email')}
          icon="mail"
          placeholder={t('signup.form.emailPlaceholder')}
          value={form.email}
          onChangeText={form.setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!form.isOAuthCompletion}
          error={form.fieldErrors.email}
        />
      </StaggerReveal>
    </SignupFormCard>
    {form.role === 'sponsor' ? (
      <View>
        <AuthTextField
          label={t('signup.form.cityRegion')}
          icon="location"
          placeholder={t('signup.form.cityPlaceholder')}
          value={form.city}
          onChangeText={form.setCity}
          error={form.fieldErrors.city}
        />
      </View>
    ) : null}
  </SignupStepLayout>
  );
};
