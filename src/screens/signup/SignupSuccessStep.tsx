import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../../components/ui/Icon';
import { SignupConfetti } from '../../components/signup/SignupConfetti';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { spacing } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

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
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withSpring(1.1, motion.spring.bouncy),
        withSpring(1, motion.spring.smooth)
      ),
      -1,
      false
    );
    ring.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 0 })),
      -1,
      false
    );
  }, [pulse, ring]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  return (
    <View style={styles.root}>
      <SignupConfetti active />
      <SignupStepLayout
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        stepName={stepName}
        phases={phases}
        phaseIndex={phaseIndex}
        title={title}
        subtitle={`${displayName}, bienvenue sur ProDay.`}
        contentKey="launch-success"
        heroIcon="checkmark-circle"
        footer={<SignupFooterButton label={finishLabel} onPress={onFinish} />}
      >
        <View>
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.ring, styles.ringOuter, ringStyle]} />
            <Animated.View style={iconStyle}>
              <Icon name="checkmark-circle" size={80} color={c.brand} variant="filled" />
            </Animated.View>
          </View>
        </View>
        <View>
          <Text style={styles.body}>{body}</Text>
        </View>
      </SignupStepLayout>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.xxl,
      minHeight: 140,
    },
    ring: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.brandSoft,
      borderWidth: 2,
      borderColor: c.brand,
    },
    ringOuter: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.borderMedium,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
}
