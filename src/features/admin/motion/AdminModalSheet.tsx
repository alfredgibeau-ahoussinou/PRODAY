import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminMotion } from './adminMotion';

type Variant = 'full' | 'sheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: Variant;
  /** Autorise le swipe vertical pour fermer (sheet / full). */
  gestureClose?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Modal / bottom-sheet admin — enter/exit animés, gesture dismiss optionnel.
 */
export function AdminModalSheet({
  visible,
  onClose,
  children,
  variant = 'full',
  gestureClose = true,
  contentStyle,
}: Props) {
  const t = ADMIN_TOKENS;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const backdrop = useSharedValue(visible ? 1 : 0);
  const sheetY = useSharedValue(visible ? 0 : 48);
  const dragY = useSharedValue(0);
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const finishUnmount = () => {
    setMounted(false);
    closing.current = false;
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      closing.current = false;
      dragY.value = 0;
      if (reduced) {
        backdrop.value = 1;
        sheetY.value = 0;
        return;
      }
      backdrop.value = withTiming(1, {
        duration: adminMotion.duration.modal,
        easing: adminMotion.easing.out,
      });
      sheetY.value = withSpring(0, adminMotion.spring.sheet);
      return;
    }
    if (!mounted) return;
    if (reduced) {
      backdrop.value = 0;
      sheetY.value = 40;
      finishUnmount();
      return;
    }
    backdrop.value = withTiming(0, { duration: adminMotion.duration.fast });
    sheetY.value = withTiming(
      64,
      { duration: adminMotion.duration.exit, easing: adminMotion.easing.in },
      (finished) => {
        if (finished) runOnJS(finishUnmount)();
      },
    );
  }, [visible, reduced, mounted, backdrop, sheetY, dragY]);

  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    onCloseRef.current();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          gestureClose && !reduced && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) dragY.value = g.dy;
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > adminMotion.sheetDismissY || g.vy > 1.1) {
            requestClose();
            return;
          }
          dragY.value = withSpring(0, adminMotion.spring.snappy);
        },
      }),
    [gestureClose, reduced, dragY],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * (1 - Math.min(dragY.value / 280, 0.45)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + backdrop.value * 0.5,
    transform: [{ translateY: sheetY.value + dragY.value }],
  }));

  if (!mounted) return null;

  const isSheet = variant === 'sheet';

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityLabel="Fermer"
        >
          <Animated.View
            style={[styles.backdrop, { backgroundColor: adminMotion.backdrop }, backdropStyle]}
          />
        </Pressable>

        <Animated.View
          style={[
            isSheet ? styles.sheet : styles.full,
            {
              backgroundColor: t.bg,
              paddingBottom: isSheet ? Math.max(insets.bottom, adminSpace.md) : 0,
              borderTopLeftRadius: isSheet ? adminRadius.xl : 0,
              borderTopRightRadius: isSheet ? adminRadius.xl : 0,
            },
            sheetStyle,
            contentStyle,
          ]}
          {...(gestureClose ? pan.panHandlers : null)}
        >
          {gestureClose ? (
            <View style={styles.handleRow} accessibilityElementsHidden>
              <View style={[styles.handle, { backgroundColor: t.borderStrong }]} />
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  full: { flex: 1, width: '100%' },
  sheet: {
    maxHeight: '92%',
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: ADMIN_TOKENS.border,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: adminSpace.sm,
    paddingBottom: adminSpace.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  body: { flex: 1 },
});
