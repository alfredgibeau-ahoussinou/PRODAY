import { useEffect } from 'react';
import { useAppSpace } from '../../context/AppSpaceContext';
import { useProductLine } from '../../context/ProductLineContext';
import {
  defaultAppSpaceForProductLine,
  isAppSpaceAllowedForProductLine,
} from '../../utils/appSpaceProductLine';

/** Aligne l’espace Mercato actif sur la ligne produit (classique ↔ Woman). */
export function WomanSpaceDefaults() {
  const { productLine } = useProductLine();
  const { appSpace, setAppSpace } = useAppSpace();

  useEffect(() => {
    if (isAppSpaceAllowedForProductLine(appSpace, productLine)) return;
    const next = defaultAppSpaceForProductLine(productLine);
    if (next === appSpace) return;
    void setAppSpace(next);
  }, [productLine, appSpace, setAppSpace]);

  return null;
}
