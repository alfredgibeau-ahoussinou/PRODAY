import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { colors, spacing } from '../../theme/designTokens';

interface SignupSuccessStepProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  displayName: string;
  title: string;
  body: string;
  finishLabel: string;
  onFinish: () => void;
}

export const SignupSuccessStep: React.FC<SignupSuccessStepProps> = ({
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  displayName,
  title,
  body,
  finishLabel,
  onFinish,
}) => (
  <SignupStepLayout
    stepIndex={stepIndex}
    stepTotal={stepTotal}
    stepName={stepName}
    phases={phases}
    phaseIndex={phaseIndex}
    title={title}
    subtitle={`${displayName}, bienvenue sur ProDay.`}
    footer={<SignupFooterButton label={finishLabel} onPress={onFinish} />}
  >
    <View style={styles.iconWrap}>
      <Icon name="checkmark-circle" size={56} color={colors.accent} variant="filled" />
    </View>
    <Text style={styles.body}>{body}</Text>
  </SignupStepLayout>
);

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginVertical: spacing.xl },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
