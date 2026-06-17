import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const ReelsScreen = lazy(() =>
  import('./ReelsScreen').then((module) => ({ default: module.ReelsScreen }))
);

/** Charge les reels (expo-video / expo-audio) uniquement à l’ouverture de l’onglet. */
export const LazyReelsScreen: React.FC = () => (
  <Suspense
    fallback={
      <View style={styles.fallback}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    }
  >
    <ReelsScreen />
  </Suspense>
);

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
