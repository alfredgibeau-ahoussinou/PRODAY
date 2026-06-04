import { useEffect } from 'react';
import { useAppSpace } from '../../context/AppSpaceContext';
import { useProductLine } from '../../context/ProductLineContext';
import { isFeminineAppSpace } from '../../models/AppSpace';

/** Espace foot féminin par défaut en mode ProDay Woman. */
export function WomanSpaceDefaults() {
  const { isWoman } = useProductLine();
  const { appSpace, setAppSpace } = useAppSpace();

  useEffect(() => {
    if (isWoman && !isFeminineAppSpace(appSpace)) {
      void setAppSpace('women');
    }
  }, [isWoman, appSpace, setAppSpace]);

  return null;
}
