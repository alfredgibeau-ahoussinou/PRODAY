import React from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import { ManLogo } from '../ManLogo';
import { ProLogo } from '../ProLogo';
import { SanteLogo } from '../SanteLogo';
import { WomanLogo } from '../WomanLogo';

interface ProductLineLogoProps {
  line: ProductLineId;
  width?: number;
  onDark?: boolean;
}

/** Logo compact pour les cartes de choix d’univers. */
export const ProductLineLogo: React.FC<ProductLineLogoProps> = ({
  line,
  width = 168,
  onDark = false,
}) => {
  const background = onDark ? 'dark' : 'light';

  if (line === 'woman') {
    return <WomanLogo width={width} background={background} />;
  }
  if (line === 'pro') {
    return <ProLogo width={width} background={background} />;
  }
  if (line === 'sante') {
    return <SanteLogo width={width} background={background} />;
  }
  return <ManLogo width={width} background={background} />;
};
