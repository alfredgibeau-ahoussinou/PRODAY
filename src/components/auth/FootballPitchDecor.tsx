import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';

const STRIPE_COUNT = 7;

export const FootballPitchDecor: React.FC<{ width: number }> = ({ width }) => {
  const ballX = useSharedValue(-48);

  useEffect(() => {
    ballX.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(width + 48, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-48, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, [ballX, width]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value },
      { rotate: `${interpolate(ballX.value, [-48, width + 48], [0, 720])}deg` },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.stripes}>
        {Array.from({ length: STRIPE_COUNT }).map((_, index) => (
          <View
            key={index}
            style={[styles.stripe, index % 2 === 0 ? styles.stripeLight : styles.stripeDark]}
          />
        ))}
      </View>
      <View style={styles.centerLine} />
      <View style={styles.centerCircle} />
      <Animated.View style={[styles.ball, ballStyle]}>
        <Icon name="football" size={28} color="#FFFFFF" variant="filled" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    overflow: 'hidden',
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  stripe: {
    flex: 1,
  },
  stripeLight: {
    backgroundColor: 'rgba(34,139,68,0.35)',
  },
  stripeDark: {
    backgroundColor: 'rgba(22,101,52,0.45)',
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  centerCircle: {
    position: 'absolute',
    top: -36,
    left: '50%',
    width: 72,
    height: 72,
    marginLeft: -36,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ball: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
