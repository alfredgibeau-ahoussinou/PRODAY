import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { SignupPressable } from './SignupPressable';
import { colors, spacing, radius } from '../../theme/designTokens';
import { motion } from '../../theme/motion';

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
          <Icon name={complete ? 'checkmark-circle' : icon} size={18} color={colors.accent} />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title}>{title}</Text>
          {hint && !open ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={20} color={colors.textMuted} />
        </Animated.View>
      </SignupPressable>
      {open ? (
        <Animated.View style={[styles.body, bodyStyle]}>{children}</Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  wrapOpen: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDone: { backgroundColor: colors.successBg },
  headCopy: { flex: 1 },
  title: { fontSize: 15, fontWeight: '900', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
