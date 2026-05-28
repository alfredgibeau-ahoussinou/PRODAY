import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';

type RevealVariant = 'up' | 'down' | 'zoom';

interface ScrollRevealBlockProps {
  children: React.ReactNode;
  delay?: number;
  variant?: RevealVariant;
  style?: StyleProp<ViewStyle>;
}

export const ScrollRevealBlock: React.FC<ScrollRevealBlockProps> = ({
  children,
  delay = 0,
  variant = 'up',
  style,
}) => {
  const entering =
    variant === 'down'
      ? FadeInDown.delay(delay).springify().damping(16)
      : variant === 'zoom'
        ? ZoomIn.delay(delay).springify()
        : FadeInUp.delay(delay).springify().damping(16);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
};
