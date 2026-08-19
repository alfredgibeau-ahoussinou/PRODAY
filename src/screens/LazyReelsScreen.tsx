import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { usePlayerThemeColors } from '../context/PlayerThemeContext';

const ReelsScreen = lazy(() =>
  import('./ReelsScreen').then((module) => ({ default: module.ReelsScreen }))
);

function ReelsLoadingFallback() {
  const { accent } = usePlayerThemeColors();
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color={accent} size="large" />
    </View>
  );
}

/** Charge les reels (expo-video / expo-audio) uniquement à l’ouverture de l’onglet. */
export const LazyReelsScreen: React.FC = () => (
  <Suspense fallback={<ReelsLoadingFallback />}>
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
