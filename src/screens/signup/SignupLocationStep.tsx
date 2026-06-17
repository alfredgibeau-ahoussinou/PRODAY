import React from 'react';
import { View } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';

interface SignupLocationStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupLocationStep: React.FC<SignupLocationStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const { t } = useTranslation();
  const meta = getPlayerStepMeta(form.productLine, 'location', t);
  return (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={meta.title}
    subtitle={meta.subtitle}
    contentKey="player-location"
    heroIcon={meta.heroIcon}
    onBack={onBack}
    footer={
      <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
    }
  >
    <View>
      <AuthTextField
        label={t('signup.form.cityRequired')}
        icon="location"
        placeholder={t('signup.form.cityPlaceholder')}
        value={form.city}
        onChangeText={form.setCity}
        error={form.fieldErrors.city}
      />
    </View>
    <View>
      <AuthTextField
        label={t('signup.form.departmentOptional')}
        placeholder={t('signup.form.deptPlaceholderShort')}
        value={form.department}
        onChangeText={form.setDepartment}
        error={form.fieldErrors.department}
      />
    </View>
  </SignupStepLayout>
  );
};
