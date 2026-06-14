import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrainPersistence } from '../hooks/useBrainPersistence';

/** Hydrate et persiste le Brain V3 pour l'utilisateur connecté. */
export const ProdayBrainBridge: React.FC = () => {
  const { profile } = useAuth();
  useBrainPersistence(profile ?? undefined);
  return null;
};
