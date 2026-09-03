import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { PushScreenTransition } from '../../components/motion';
import { TrainHubScreen } from '../../screens/training/TrainHubScreen';
import { JoueurTacticsCoachScreen } from '../../screens/joueur/JoueurTacticsCoachScreen';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import {
  isJoueurDashboardOverlayView,
  trainHubViewForDashboard,
} from '../../navigation/joueurDashboardOverlay';
import { useSessionProfile } from '../../hooks/useSessionProfile';

/**
 * Overlay Coach IA / coach humain / train — toujours monté hors keep-alive onglets.
 * Source de vérité : `pendingDashboardView` (le back Android le vide déjà).
 */
export function JoueurDashboardOverlayHost() {
  const profile = useSessionProfile();
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();

  if (profile?.role !== 'player') return null;

  const overlay = isJoueurDashboardOverlayView(pendingDashboardView)
    ? pendingDashboardView
    : null;

  return (
    <View
      style={styles.host}
      pointerEvents={overlay ? 'auto' : 'none'}
      testID="joueur-dashboard-overlay-host"
    >
      <PushScreenTransition active={Boolean(overlay)} backgroundColor={PLAYER_DARK.bg}>
        {overlay === 'tactics_coach' ? (
          <JoueurTacticsCoachScreen onBack={clearPendingDashboard} />
        ) : overlay === 'train' || overlay === 'train_ai' || overlay === 'train_coach' ? (
          <TrainHubScreen
            key={overlay}
            onBack={clearPendingDashboard}
            initialView={trainHubViewForDashboard(overlay)}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },
});
