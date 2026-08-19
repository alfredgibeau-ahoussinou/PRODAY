import React from 'react';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { PlayerCoachAiFab } from '../../components/joueur/PlayerCoachAiFab';

/** FAB Coach IA — visible uniquement quand le shell joueur est actif. */
export function JoueurShellExtras() {
  const joueur = useJoueurSession();
  const live = Boolean(joueur?.isJoueurPlayer && joueur.ready && !joueur.needsGate);
  if (!live) return null;
  return <PlayerCoachAiFab />;
}
