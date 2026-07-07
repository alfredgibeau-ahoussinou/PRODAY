import React from 'react';
import { MatchsScreen } from '../MatchsScreen';
import { HomeScreen } from '../HomeScreen';
import { useSessionProfile } from '../../hooks/useSessionProfile';

/** Onglet Calendrier — convocations et matchs de toutes les équipes du club. */
export const ClubCalendarScreen: React.FC = () => {
  const profile = useSessionProfile();
  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }
  return <MatchsScreen />;
};
