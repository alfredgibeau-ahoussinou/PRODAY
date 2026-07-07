import React from 'react';
import { MercatoScreen } from '../MercatoScreen';

/** Onglet Opportunités — marché pro (offres R1→N1 uniquement). */
export const ProPlayerOpportunitiesScreen: React.FC = () => (
  <MercatoScreen postScope="pro" />
);
