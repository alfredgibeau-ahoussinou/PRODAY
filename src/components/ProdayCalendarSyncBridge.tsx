import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useDeviceCalendarSync } from '../hooks/useDeviceCalendarSync';

/** Sync événements Brain → calendrier natif iOS/Android. */
export const ProdayCalendarSyncBridge: React.FC = () => {
  const { profile } = useAuth();
  const { productLine } = useAppTheme();
  useDeviceCalendarSync(profile ?? undefined, productLine);
  return null;
};
