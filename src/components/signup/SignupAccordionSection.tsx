import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { SignupPressable } from './SignupPressable';
import { spacing, radius } from '../../theme/designTokens';
import { motion } from '../../theme/motion';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupAccordionSectionProps {
  id: string;
  icon: IconName;
  title: string;
  hint?: string;
  open: boolean;
  complete?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const SignupAccordionSection: React.FC<SignupAccordionSectionProps> = ({
  icon,
  title,
  hint,
  open,
  complete,
  onToggle,
  children,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const chevron = useSharedValue(open ? 1 : 0);
  const bodyOpacity = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    chevron.value = withSpring(open ? 1 : 0, motion.spring.snappy);
    bodyOpacity.value = withTiming(open ? 1 : 0, { duration: motion.duration.fast });
  }, [open, chevron, bodyOpacity]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
  }));

  return (
    <View style={[styles.wrap, open && styles.wrapOpen]}>
      <SignupPressable style={styles.head} onPress={onToggle} scaleTo={0.98}>
        <View style={[styles.iconWrap, complete && styles.iconWrapDone]}>
          <Icon name={complete ? 'checkmark-circle' : icon} size={18} color={c.brand} />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title}>{title}</Text>
          {hint && !open ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={20} color={c.textMuted} />
        </Animated.View>
      </SignupPressable>
      {open ? (
        <Animated.View style={[styles.body, bodyStyle]}>{children}</Animated.View>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    wrapOpen: {
      borderColor: c.brand,
      backgroundColor: c.surface,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapDone: { backgroundColor: c.successBg },
    headCopy: { flex: 1 },
    title: { fontSize: 15, fontWeight: '900', color: c.text },
    hint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    body: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}
