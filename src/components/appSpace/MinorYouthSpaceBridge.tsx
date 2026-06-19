import React from 'react';
import type { User } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { useMinorYouthSpace } from '../../hooks/useMinorYouthSpace';

/** Verrouille l’espace jeunes pour les comptes mineurs (dans AppSpaceProvider). */
export const MinorYouthSpaceBridge: React.FC<{
  profile: User | null;
  productLine: ProductLineId;
}> = ({ profile, productLine }) => {
  useMinorYouthSpace(profile, productLine);
  return null;
};
