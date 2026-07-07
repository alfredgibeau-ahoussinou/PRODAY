import React from 'react';
import { MessagesScreen } from '../MessagesScreen';
import { HomeScreen } from '../HomeScreen';
import { useSessionProfile } from '../../hooks/useSessionProfile';

/** Onglet Communication — messagerie interne club et réseau pro. */
export const ClubCommunicationScreen: React.FC = () => {
  const profile = useSessionProfile();
  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }
  return <MessagesScreen />;
};
