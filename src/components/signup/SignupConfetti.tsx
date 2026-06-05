import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';

const { width: SCREEN_W } = Dimensions.get('window');

interface SignupConfettiProps {
  active?: boolean;
  count?: number;
}

const ConfettiPiece: React.FC<{
  left: number;
  delay: number;
  color: string;
  size: number;
  rotate: number;
}> = ({ left, delay, color, size, rotate }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * 420 },
      { translateX: (progress.value - 0.5) * 60 },
      { rotate: `${rotate + progress.value * 320}deg` },
      { scale: 1 - progress.value * 0.3 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left, width: size, height: size * 0.55, backgroundColor: color, borderRadius: 2 },
        style,
      ]}
    />
  );
};

export const SignupConfetti: React.FC<SignupConfettiProps> = ({ active = true, count = 28 }) => {
  const { colors: c } = useSignupFlowTheme();
  const palette = useMemo(
    () => [c.brand, c.success, c.brandLight, c.textSecondary],
    [c]
  );

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (SCREEN_W / count) * i + Math.random() * 24,
        delay: Math.random() * 500,
        color: palette[i % palette.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 180,
      })),
    [count, palette]
  );

  if (!active) return null;

  return (
    <Animated.View exiting={FadeOut.duration(400)} style={styles.wrap} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          left={p.left}
          delay={p.delay}
          color={p.color}
          size={p.size}
          rotate={p.rotate}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: -20,
  },
});
