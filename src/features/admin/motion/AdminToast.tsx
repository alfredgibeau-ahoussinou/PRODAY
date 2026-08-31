import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminShadow, adminSpace } from '../theme/adminDesignSystem';
import { adminMotion } from './adminMotion';

export type AdminToastPayload = {
  id: number;
  title: string;
  tone?: 'success' | 'info' | 'warn';
  durationMs?: number;
};

type HostProps = {
  toast: AdminToastPayload | null;
  onDismiss: () => void;
};

export function AdminToastHost({ toast, onDismiss }: HostProps) {
  const t = ADMIN_TOKENS;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!toast) {
      progress.value = 0;
      return;
    }
    if (reduced) {
      progress.value = 1;
    } else {
      progress.value = withSpring(1, adminMotion.spring.snappy);
    }
    const ms = toast.durationMs ?? 2200;
    const timer = setTimeout(() => {
      if (reduced) {
        onDismiss();
        return;
      }
      progress.value = withTiming(
        0,
        { duration: adminMotion.duration.toast, easing: adminMotion.easing.in },
        (finished) => {
          if (finished) runOnJS(onDismiss)();
        },
      );
    }, ms);
    return () => clearTimeout(timer);
  }, [toast, reduced, progress, onDismiss]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 12 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  if (!toast) return null;

  const toneColor =
    toast.tone === 'warn'
      ? t.warn
      : toast.tone === 'info'
        ? t.info
        : t.success;

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 10 }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: t.surfaceRaised,
            borderColor: toneColor,
            ...adminShadow.soft,
          },
          style,
        ]}
      >
        <View style={[styles.dot, { backgroundColor: toneColor }]} />
        <AdminText variant="caption" style={{ fontWeight: '700', flex: 1 }}>
          {toast.title}
        </AdminText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: adminSpace.lg,
    right: adminSpace.lg,
    zIndex: 80,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: adminSpace.lg,
    paddingVertical: 12,
    borderRadius: adminRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
