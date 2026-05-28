import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Pressable, Text, type ModalProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion } from '../../theme/motion';
import { colors, spacing, radius } from '../../theme/designTokens';

interface AnimatedModalShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel?: string;
  presentationStyle?: ModalProps['presentationStyle'];
}

/**
 * Modal plein écran avec backdrop animé + sheet qui monte.
 */
export const AnimatedModalShell: React.FC<AnimatedModalShellProps> = ({
  visible,
  onClose,
  children,
  closeLabel = 'Fermer',
  presentationStyle = 'overFullScreen',
}) => {
  const insets = useSafeAreaInsets();
  const backdrop = useSharedValue(0);
  const sheetY = useSharedValue(80);

  useEffect(() => {
    if (visible) {
      backdrop.value = withTiming(1, { duration: motion.duration.modal });
      sheetY.value = withSpring(0, motion.spring.sheet);
    } else {
      backdrop.value = withTiming(0, { duration: motion.duration.fast });
      sheetY.value = withSpring(80, motion.spring.snappy);
    }
  }, [visible, backdrop, sheetY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
    opacity: 0.4 + backdrop.value * 0.6,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer">
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingTop: Math.max(insets.top, spacing.md) },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeText}>{closeLabel}</Text>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: motion.modalBackdrop,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMedium,
  },
  closeBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  closeText: { fontSize: 14, fontWeight: '800', color: colors.accent },
  body: { flex: 1 },
});
