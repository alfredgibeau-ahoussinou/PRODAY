import React from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import type { JoueurGateProfile } from '../../../utils/joueurGateStorage';
import { JoueurAdaptiveHome } from '../../joueur/JoueurAdaptiveHome';

/**
 * Home joueur — délègue entièrement à l’expérience adaptative (3 univers).
 * Conservé comme point d’entrée pour HomeScreen / tests.
 */
export const AmateurPlayerHomeDashboard: React.FC<
  StaffRoleHomeProps & { joueurGate?: JoueurGateProfile | null }
> = ({ profile, onRefresh, refreshing }) => {
  return (
    <JoueurAdaptiveHome
      profile={profile}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
};
