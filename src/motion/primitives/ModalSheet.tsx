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
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionPreset } from '../presets';
import { prodayMotion } from '../tokens';

type Variant = 'full' | 'sheet';

export type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: Variant;
  gestureClose?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
  handleColor?: string;
  backdropColor?: string;
  accessibilityCloseLabel?: string;
};

/**
 * Modal / bottom-sheet générique — enter/exit, gesture dismiss, reduced motion.
 */
export function ModalSheet({
  visible,
  onClose,
  children,
  variant = 'full',
  gestureClose = true,
  contentStyle,
  backgroundColor = '#0B0F14',
  borderColor = 'rgba(255,255,255,0.12)',
  handleColor = 'rgba(255,255,255,0.35)',
  backdropColor = prodayMotion.backdrop,
  accessibilityCloseLabel = 'Fermer',
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const preset = getMotionPreset(variant === 'sheet' ? 'sheet' : 'modal');
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
        duration: preset.enterMs,
        easing: prodayMotion.easing.out,
      });
      sheetY.value = withSpring(0, preset.spring);
      return;
    }
    if (!mounted) return;
    if (reduced) {
      backdrop.value = 0;
      sheetY.value = 40;
      finishUnmount();
      return;
    }
    backdrop.value = withTiming(0, { duration: prodayMotion.duration.fast });
    sheetY.value = withTiming(
      64,
      { duration: preset.exitMs, easing: prodayMotion.easing.in },
      (finished) => {
        if (finished) runOnJS(finishUnmount)();
      },
    );
  }, [visible, reduced, mounted, backdrop, sheetY, dragY, preset.enterMs, preset.exitMs, preset.spring]);

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
          if (g.dy > prodayMotion.sheetDismissY || g.vy > 1.1) {
            requestClose();
            return;
          }
          dragY.value = withSpring(0, prodayMotion.spring.snappy);
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
          accessibilityLabel={accessibilityCloseLabel}
        >
          <Animated.View
            style={[styles.backdrop, { backgroundColor: backdropColor }, backdropStyle]}
          />
        </Pressable>

        <Animated.View
          style={[
            isSheet ? styles.sheet : styles.full,
            {
              backgroundColor,
              paddingBottom: isSheet ? Math.max(insets.bottom, 16) : 0,
              borderTopLeftRadius: isSheet ? 20 : 0,
              borderTopRightRadius: isSheet ? 20 : 0,
              borderColor,
            },
            sheetStyle,
            contentStyle,
          ]}
          {...(gestureClose ? pan.panHandlers : null)}
        >
          {gestureClose ? (
            <View style={styles.handleRow} accessibilityElementsHidden>
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
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
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  body: { flex: 1 },
});
