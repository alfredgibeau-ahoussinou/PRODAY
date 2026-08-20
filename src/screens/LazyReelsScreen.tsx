import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { usePlayerThemeColors } from '../context/PlayerThemeContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { usePlatformFeatureFlags } from '../hooks/usePlatformFeatureFlags';
import { JoueurUnavailableScreen } from '../components/joueur/JoueurUnavailableScreen';

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
export const LazyReelsScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { isEnabled, disabledCopy, loading } = usePlatformFeatureFlags();

  if (profile?.role === 'player' && !loading && !isEnabled('community_reels')) {
    const copy = disabledCopy('community_reels');
    return (
      <JoueurUnavailableScreen
        title={copy.title}
        message={copy.message}
        icon="videocam"
      />
    );
  }

  return (
    <Suspense fallback={<ReelsLoadingFallback />}>
      <ReelsScreen />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: JOUEUR_SITE.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
