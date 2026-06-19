import { useEffect } from 'react';
import type { User } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { useAppSpace } from '../context/AppSpaceContext';
import { isMinorUser } from '../utils/minor';
import { resolveYouthAppSpaceForMinor } from '../utils/minorYouthSpace';

/** Verrouille les mineurs sur un espace jeunes (U13 / boys / girls). */
export function useMinorYouthSpace(profile: User | null, productLine: ProductLineId) {
  const { appSpace, setAppSpace } = useAppSpace();

  useEffect(() => {
    if (!profile || !isMinorUser(profile)) return;
    const target = resolveYouthAppSpaceForMinor(profile, productLine);
    if (appSpace !== target) {
      void setAppSpace(target);
    }
  }, [profile, productLine, appSpace, setAppSpace]);
}
