import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProductLine } from '../context/ProductLineContext';
import { getSessionProfile } from '../utils/productLineAccess';
import type { User } from '../models/User';

/** Profil courant adapté au pôle actif (comptes test multi-univers). */
export function useSessionProfile(): User | null {
  const { profile } = useAuth();
  const { productLine } = useProductLine();

  return useMemo(() => {
    if (!profile) return null;
    return getSessionProfile(profile, productLine);
  }, [profile, productLine]);
}
