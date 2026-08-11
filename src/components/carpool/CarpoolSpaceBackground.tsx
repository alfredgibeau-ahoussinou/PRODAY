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
import { CARPOOL_SITE } from '../../content/carpoolSite';

/**
 * Fond immersif animé — route qui défile, lueur cyan, ciel clair.
 */
export function CarpoolSpaceBackground() {
  const styles = useMemo(() => createStyles(), []);
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
        colors={CARPOOL_SITE.wash}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={CARPOOL_SITE.horizon}
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
        colors={['rgba(232,244,248,0)', 'rgba(244,250,252,0.75)', '#F4FAFC']}
        locations={[0, 0.55, 1]}
        style={styles.bottomFade}
      />
    </View>
  );
}

function createStyles() {
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
      backgroundColor: CARPOOL_SITE.signalMuted,
      borderRadius: 2,
    },
    edgeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: CARPOOL_SITE.signalMuted,
      borderRadius: 2,
    },
    dashes: {
      position: 'absolute',
      left: '50%',
      marginLeft: -2,
      top: -60,
      bottom: -60,
      width: 4,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dash: {
      width: 4,
      height: 28,
      borderRadius: 2,
      backgroundColor: CARPOOL_SITE.signal,
      opacity: 0.55,
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '48%',
    },
  });
}
