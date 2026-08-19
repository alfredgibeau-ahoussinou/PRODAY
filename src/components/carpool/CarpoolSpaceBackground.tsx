import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCarpoolUi } from './CarpoolUiContext';

/**
 * Fond immersif animé — route qui défile, lueur accent, fond sombre joueur.
 */
export function CarpoolSpaceBackground() {
  const palette = useCarpoolUi();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const travel = useSharedValue(0);

  useEffect(() => {
    travel.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [travel]);

  const laneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: travel.value * 56 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={[palette.bg, palette.surfaceMuted, palette.bg]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', `${palette.signal}2E`, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizon}
      />
      <View style={styles.roadBed}>
        <View style={styles.edgeLeft} />
        <Animated.View style={[styles.dashes, laneStyle]}>
          {Array.from({ length: 28 }, (_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </Animated.View>
        <View style={styles.edgeRight} />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0)', `${palette.bg}CC`, palette.bg]}
        locations={[0, 0.55, 1]}
        style={styles.bottomFade}
      />
    </View>
  );
}

function createStyles(palette: ReturnType<typeof useCarpoolUi>) {
  return StyleSheet.create({
    horizon: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 160,
    },
    roadBed: {
      position: 'absolute',
      top: '22%',
      bottom: '18%',
      left: '18%',
      right: '18%',
      opacity: 0.55,
    },
    edgeLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: palette.lane,
      borderRadius: 2,
    },
    edgeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: palette.lane,
      borderRadius: 2,
    },
    dashes: {
      position: 'absolute',
      left: '50%',
      marginLeft: -2,
      top: -56,
      gap: 18,
      alignItems: 'center',
    },
    dash: {
      width: 4,
      height: 22,
      borderRadius: 2,
      backgroundColor: palette.signal,
      opacity: 0.45,
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '28%',
    },
  });
}
