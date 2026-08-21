import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { adminMotion } from './adminMotion';
import { AdminPressable } from './AdminPressable';

type Props = {
  children: React.ReactNode;
  index?: number;
  maxStagger?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Ligne de liste admin — entrée échelonnée + press spring. */
export function AdminListRow({
  children,
  index = 0,
  maxStagger = 10,
  onPress,
  onLongPress,
  disabled,
  style,
}: Props) {
  const reduced = useReducedMotion();
  const delay = Math.min(index, maxStagger) * 28;

  const body =
    onPress || onLongPress ? (
      <AdminPressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </AdminPressable>
    ) : (
      children
    );

  if (reduced) {
    return <>{body}</>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(adminMotion.duration.fast)
        .easing(adminMotion.easing.out)
        .springify()
        .damping(adminMotion.spring.smooth.damping)
        .stiffness(adminMotion.spring.smooth.stiffness)}
      style={!onPress && !onLongPress ? style : undefined}
    >
      {body}
    </Animated.View>
  );
}
