import React from 'react';
import { MercatoScreen } from '../MercatoScreen';
import { HomeScreen } from '../HomeScreen';
import { useSessionProfile } from '../../hooks/useSessionProfile';

/** Onglet Recrutement — Mercato club pro (annonces, détections, stages). */
export const ClubRecruitmentScreen: React.FC = () => {
  const profile = useSessionProfile();
  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }
  return <MercatoScreen postScope="pro" />;
};
