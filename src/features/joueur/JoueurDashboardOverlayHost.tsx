import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { PushScreenTransition } from '../../components/motion';
import { JoueurTacticsCoachScreen } from '../../screens/joueur/JoueurTacticsCoachScreen';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import {
  isJoueurDashboardOverlayView,
  type JoueurDashboardOverlayView,
} from '../../navigation/joueurDashboardOverlay';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';

/**
 * Overlay Conseiller IA / coach — toujours monté hors keep-alive onglets.
 * Source de vérité : `pendingDashboardView` (le back Android le vide déjà).
 */
export function JoueurDashboardOverlayHost() {
  const sessionProfile = useSessionProfile();
  const { profile: authProfile } = useAuth();
  const profile = sessionProfile ?? authProfile;
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();

  const [activeOverlay, setActiveOverlay] = useState<JoueurDashboardOverlayView | null>(null);

  useEffect(() => {
    if (isJoueurDashboardOverlayView(pendingDashboardView)) {
      setActiveOverlay(pendingDashboardView);
    }
  }, [pendingDashboardView]);

  if (profile?.role !== 'player' && authProfile?.role !== 'player') return null;

  const currentView = pendingDashboardView ?? activeOverlay;
  if (!currentView || !isJoueurDashboardOverlayView(currentView)) return null;

  const handleClose = () => {
    clearPendingDashboard();
    setActiveOverlay(null);
  };

  return (
    <View
      style={styles.host}
      pointerEvents={pendingDashboardView ? 'auto' : 'none'}
      testID="joueur-dashboard-overlay-host"
    >
      <PushScreenTransition
        active={Boolean(pendingDashboardView)}
        variant="fade"
        backgroundColor={PLAYER_DARK.bg}
      >
        {currentView === 'tactics_coach' || currentView === 'train' || currentView === 'train_ai' || currentView === 'train_coach' ? (
          <JoueurTacticsCoachScreen onBack={handleClose} />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
