import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { APP_SPACE_GROUPS, WOMAN_APP_SPACE_GROUPS } from './signupFlowConfig';
import { signupTheme } from './signupTheme';
import { useSignupFlowTheme } from './SignupFlowContext';
import { getWomanStepMeta } from './signupWomanConfig';

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
  const { colors } = useSignupFlowTheme();
  const spaceGroups = form.isWomanProduct ? [...WOMAN_APP_SPACE_GROUPS] : APP_SPACE_GROUPS;
  const womanMeta = form.isWomanProduct ? getWomanStepMeta('space') : null;

  return (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={womanMeta?.title ?? 'Ton espace ProDay'}
    subtitle={womanMeta?.subtitle ?? 'Choisis l’univers qui correspond à ton profil foot.'}
    heroIcon={womanMeta?.heroIcon ?? 'football'}
    onBack={onBack}
    footer={
      <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
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
                  active && { backgroundColor: colors.accent, borderColor: colors.accent },
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
                    active && { color: 'rgba(255,255,255,0.72)' },
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
