import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ImmersivePitchScene,
  type ImmersivePitchMood,
} from './ImmersivePitchScene';

type Props = {
  mood?: ImmersivePitchMood;
  /** Hauteur de la scène terrain en bas d’écran. */
  pitchHeight?: number;
};

/**
 * Fond immersif — terrain 2.5D ancré en bas + vignette.
 * Ne remplace pas le canvas clair : les listes / cartes restent lisibles.
 */
export function ImmersiveAtmosphere({
  mood = 'dynamic_competitive',
  pitchHeight = 156,
}: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.pitchWrap}>
        <ImmersivePitchScene mood={mood} height={pitchHeight} fill />
        <LinearGradient
          colors={['rgba(6,16,11,0)', 'rgba(6,16,11,0.55)', 'rgba(6,16,11,0.88)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(6,16,11,0.12)']}
        style={styles.softLift}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pitchWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 168,
    opacity: 0.72,
  },
  softLift: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
  },
});
