import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout } from '../theme/adminDesignSystem';
import { adminMotion } from './adminMotion';

type Props = {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Item dock admin — indicateur pill animé + micro scale au press.
 */
export function AdminDockTab({ label, icon, active, onPress, style }: Props) {
  const t = ADMIN_TOKENS;
  const reduced = useReducedMotion();
  const indicator = useSharedValue(active ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      indicator.value = active ? 1 : 0;
      return;
    }
    indicator.value = withSpring(active ? 1 : 0, adminMotion.spring.dock);
  }, [active, reduced, indicator]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: indicator.value,
    transform: [{ scaleX: 0.72 + indicator.value * 0.28 }, { scaleY: indicator.value }],
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <Animated.View style={[styles.slot, wrapStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!reduced) press.value = withSpring(0.94, adminMotion.spring.snappy);
        }}
        onPressOut={() => {
          if (!reduced) press.value = withSpring(1, adminMotion.spring.snappy);
        }}
        style={styles.hit}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Animated.View
          style={[styles.pill, { backgroundColor: t.accentSoft }, pillStyle]}
          pointerEvents="none"
        />
        <Icon
          name={icon}
          size={adminChrome.tabBarIcon}
          color={active ? t.accent : t.muted}
        />
        <AdminText
          variant="caption"
          color={active ? t.champagneBright : t.muted}
          style={{
            fontWeight: active ? '800' : '500',
            fontSize: 10,
            letterSpacing: active ? 0.4 : 0,
          }}
          numberOfLines={1}
        >
          {label}
        </AdminText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  hit: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    minHeight: adminLayout.hitTarget,
    justifyContent: 'center',
    borderRadius: 12,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
});

/** Indicateur sous-ligne animé (sidebar / filtres). */
export function AdminTabUnderline({ active }: { active: boolean }) {
  const t = ADMIN_TOKENS;
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      w.value = active ? 1 : 0;
      return;
    }
    w.value = withTiming(active ? 1 : 0, {
      duration: adminMotion.duration.fast,
      easing: adminMotion.easing.out,
    });
  }, [active, reduced, w]);

  const style = useAnimatedStyle(() => ({
    opacity: w.value,
    transform: [{ scaleX: 0.4 + w.value * 0.6 }],
  }));

  return (
    <Animated.View
      style={[{ height: 2, borderRadius: 1, backgroundColor: t.accent, width: '70%' }, style]}
    />
  );
}
