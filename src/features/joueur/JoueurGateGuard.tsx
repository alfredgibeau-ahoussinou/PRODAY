import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JoueurWhoAreYouGateScreen } from '../../screens/joueur/JoueurWhoAreYouGateScreen';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import type { JoueurGateProfile } from '../../utils/joueurGateStorage';

/** Bloque le shell joueur tant que « Qui es-tu ? » n’est pas complété. */
export function JoueurGateGuard({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const session = useJoueurSession();

  if (!session?.isJoueurPlayer) return <>{children}</>;

  if (!session.ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={JOUEUR_SITE.gold} size="large" />
      </View>
    );
  }

  if (session.needsGate && profile?.uid) {
    return (
      <JoueurWhoAreYouGateScreen
        uid={profile.uid}
        onComplete={(gate: JoueurGateProfile) => {
          session.completeGate(gate);
          void refreshProfile();
        }}
      />
    );
  }

  return <>{children}</>;
}

export function useJoueurGateBlocksTabs(): boolean {
  const session = useJoueurSession();
  return Boolean(session?.isJoueurPlayer && session.ready && session.needsGate);
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: JOUEUR_SITE.bg,
  },
});
