import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { FUT18_PREMIUM } from '../theme/fut18PremiumPalette';

const ReelsScreen = lazy(() =>
  import('./ReelsScreen').then((module) => ({ default: module.ReelsScreen }))
);

/** Charge les reels (expo-video / expo-audio) uniquement à l’ouverture de l’onglet. */
export const LazyReelsScreen: React.FC = () => (
  <Suspense
    fallback={
      <View style={styles.fallback}>
        <ActivityIndicator color={FUT18_PREMIUM.goldAccent} size="large" />
      </View>
    }
  >
    <ReelsScreen />
  </Suspense>
);

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: JOUEUR_SITE.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
