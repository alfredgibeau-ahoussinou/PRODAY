import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AnimatedDialogShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Dialog carte en bas — paywall, confirmations. */
export const AnimatedDialogShell: React.FC<AnimatedDialogShellProps> = ({
  visible,
  onClose,
  children,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [mounted, setMounted] = useState(visible);
  const backdrop = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(visible ? 1 : 0.94);
  const translateY = useSharedValue(visible ? 0 : 24);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdrop.value = withTiming(1, { duration: motion.duration.modal });
      scale.value = withSpring(1, motion.spring.bouncy);
      translateY.value = withSpring(0, motion.spring.smooth);
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: motion.duration.fast });
      scale.value = withTiming(0.96, { duration: motion.duration.fast });
      translateY.value = withTiming(16, { duration: motion.duration.fast }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, backdrop, scale, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.root} onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View style={[styles.cardWrap, cardStyle]}>{children}</Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: motion.modalBackdrop,
    },
    cardWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
  });
}
