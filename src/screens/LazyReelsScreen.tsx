import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { PLAYER_DARK } from '../theme/playerDarkPremium';

const ReelsScreen = lazy(() =>
  import('./ReelsScreen').then((module) => ({ default: module.ReelsScreen }))
);

/** Charge les reels (expo-video / expo-audio) uniquement à l’ouverture de l’onglet. */
export const LazyReelsScreen: React.FC = () => (
  <Suspense
    fallback={
      <View style={styles.fallback}>
        <ActivityIndicator color={PLAYER_DARK.accent} size="large" />
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
