import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getAppSpaceGroups } from './signupFlowConfig';
import { useSignupTheme } from './signupTheme';
import { useSignupFlowTheme } from './SignupFlowContext';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';

interface SignupSpaceStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupSpaceStep: React.FC<SignupSpaceStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const signupTheme = useSignupTheme();
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();
  const spaceGroups = getAppSpaceGroups(form.isWomanProduct, t);
  const meta = getPlayerStepMeta(form.productLine, 'space', t);

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      {form.fieldErrors.appSpace ? (
        <Text style={signupTheme.fieldError}>{form.fieldErrors.appSpace}</Text>
      ) : null}
      {spaceGroups.map((group) => (
        <View key={group.id} style={{ marginBottom: 12 }}>
          <Text style={signupTheme.sectionLabel}>{group.label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {group.options.map((opt) => {
              const active = form.appSpace === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    signupTheme.chip,
                    { flexGrow: 1, minWidth: '46%' },
                    active && { backgroundColor: colors.brand, borderColor: colors.brand },
                  ]}
                  onPress={() => form.setAppSpace(opt.id)}
                >
                  <Text
                    style={[
                      signupTheme.chipTitle,
                      active && { color: colors.brandInverse },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      signupTheme.chipHint,
                      active && signupTheme.chipHintActive,
                    ]}
                  >
                    {opt.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </SignupStepLayout>
  );
};
