import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { adminMotion } from './adminMotion';

type BlockProps = {
  height?: number;
  width?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
};

export function AdminSkeletonBlock({ height = 14, width = '100%', style }: BlockProps) {
  const t = useAdminTokens();
  const reduced = useReducedMotion();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1100, easing: adminMotion.easing.inOut }),
      -1,
      true,
    );
  }, [reduced, shimmer]);

  const band = useAnimatedStyle(() => ({
    opacity: reduced ? 0.45 : interpolate(shimmer.value, [0, 1], [0.28, 0.7]),
    transform: [
      { translateX: reduced ? 0 : interpolate(shimmer.value, [0, 1], [-20, 20]) },
    ],
  }));

  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          backgroundColor: t.surfaceRaised,
          borderColor: t.hairline,
        },
        style,
      ]}
    >
      <Animated.View
        style={[styles.band, { backgroundColor: t.surface, borderRadius: adminRadius.md }, band]}
      />
    </View>
  );
}

/** Remplace un spinner plein écran pour les panes. */
export function AdminPaneSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Chargement">
      <AdminSkeletonBlock height={28} width="42%" />
      <AdminSkeletonBlock height={12} width="68%" style={{ marginBottom: adminSpace.sm }} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <AdminSkeletonBlock height={48} width={48} style={{ borderRadius: adminRadius.md }} />
          <View style={styles.rowBody}>
            <AdminSkeletonBlock height={14} width="74%" />
            <AdminSkeletonBlock height={11} width="48%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
    borderRadius: adminRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  band: {
    ...StyleSheet.absoluteFillObject,
    width: '42%',
  },
  list: {
    flex: 1,
    padding: adminSpace.lg,
    gap: adminSpace.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
  },
  rowBody: { flex: 1, gap: 8 },
});
