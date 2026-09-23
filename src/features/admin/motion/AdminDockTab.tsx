import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  DockPillIndicator,
  TabUnderline,
  useReducedMotion,
  prodayMotion,
} from '../../../motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { AdminText } from '../ui/AdminText';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout } from '../theme/adminDesignSystem';

type Props = {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Item dock admin — indicateur pill animé (ProDayMotionSystem) + micro scale.
 */
export function AdminDockTab({ label, icon, active, onPress, style }: Props) {
  const t = useAdminTokens();
  const reduced = useReducedMotion();
  const press = useSharedValue(1);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <Animated.View style={[styles.slot, wrapStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!reduced) press.value = withSpring(0.94, prodayMotion.spring.snappy);
        }}
        onPressOut={() => {
          if (!reduced) press.value = withSpring(1, prodayMotion.spring.snappy);
        }}
        style={styles.hit}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <DockPillIndicator active={active} color={t.signalSoft} />
        <Icon
          name={icon}
          size={adminChrome.tabBarIcon}
          color={active ? t.signal : t.muted}
        />
        <AdminText
          variant="caption"
          color={active ? t.accentHot : t.muted}
          style={{
            fontWeight: active ? '800' : '500',
            fontSize: 10,
            letterSpacing: active ? 0.35 : 0,
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
});

/** Indicateur sous-ligne animé (sidebar / filtres). */
export function AdminTabUnderline({ active }: { active: boolean }) {
  const t = useAdminTokens();
  return <TabUnderline active={active} color={t.accentHot} />;
}
