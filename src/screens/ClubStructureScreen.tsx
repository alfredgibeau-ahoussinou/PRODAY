import React from 'react';
import { HomeScreen } from './HomeScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { useSessionProfile } from '../hooks/useSessionProfile';

/** Onglet "Structure" du shell club pro. */
export const ClubStructureScreen: React.FC = () => {
  const profile = useSessionProfile();

  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }

  return <TeamManagementScreen profile={profile} onBack={() => undefined} />;
};
