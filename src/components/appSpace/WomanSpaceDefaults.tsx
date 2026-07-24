import { useEffect } from 'react';
import { useAppSpace } from '../../context/AppSpaceContext';
import { useProductLine } from '../../context/ProductLineContext';
import {
  defaultAppSpaceForProductLine,
  isAppSpaceAllowedForProductLine,
} from '../../utils/appSpaceProductLine';

/** Aligne l’espace Mercato actif sur le pôle / segment (classique ↔ féminin). */
export function WomanSpaceDefaults() {
  const { productLine, playerSegment } = useProductLine();
  const { appSpace, setAppSpace } = useAppSpace();

  useEffect(() => {
    if (isAppSpaceAllowedForProductLine(appSpace, productLine, playerSegment)) return;
    const next = defaultAppSpaceForProductLine(productLine, playerSegment);
    if (next === appSpace) return;
    void setAppSpace(next);
  }, [productLine, playerSegment, appSpace, setAppSpace]);

  return null;
}
