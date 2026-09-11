import React from 'react';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { PlayerCoachAiFab } from '../../components/joueur/PlayerCoachAiFab';
import { isJoueurDashboardOverlayView } from '../../navigation/joueurDashboardOverlay';

/** FAB Coach IA — visible uniquement quand le shell joueur est actif. */
export function JoueurShellExtras() {
  const joueur = useJoueurSession();
  const tabNav = useTabNavigationOptional();
  const live = Boolean(joueur?.isJoueurPlayer && joueur.ready && !joueur.needsGate);
  if (!live) return null;
  if (
    tabNav?.activeTab === 'profil' ||
    tabNav?.activeTab === 'feed' ||
    tabNav?.activeTab === 'plus' ||
    tabNav?.activeTab === 'matchs' ||
    tabNav?.activeTab === 'messages' ||
    tabNav?.activeTab === 'covoiturage'
  )
    return null;
  if (isJoueurDashboardOverlayView(tabNav?.pendingDashboardView)) return null;
  return <PlayerCoachAiFab />;
}
