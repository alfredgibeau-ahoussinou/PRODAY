import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { prodayMotion } from '../tokens';
import { PressableScale } from './PressableScale';

type Props = {
  children: React.ReactNode;
  index?: number;
  maxStagger?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Ligne de liste — entrée échelonnée + press spring. */
export function ListRow({
  children,
  index = 0,
  maxStagger = 10,
  onPress,
  onLongPress,
  disabled,
  style,
}: Props) {
  const reduced = useReducedMotion();
  const delay = Math.min(index, maxStagger) * 16;

  const body =
    onPress || onLongPress ? (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </PressableScale>
    ) : (
      children
    );

  if (reduced) {
    return <>{body}</>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(prodayMotion.duration.fast)
        .easing(prodayMotion.easing.out)}
      style={!onPress && !onLongPress ? style : undefined}
    >
      {body}
    </Animated.View>
  );
}
