import React from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import type { CarouselPoleId } from '../../models/CarouselPole';
import { carouselPoleToProductLine } from '../../models/CarouselPole';
import { ManLogo } from '../ManLogo';
import { AmateurLogo } from '../AmateurLogo';
import { SupporterLogo } from '../SupporterLogo';
import { ProLogo } from '../ProLogo';
import { SanteLogo } from '../SanteLogo';
import { WomanLogo } from '../WomanLogo';

interface ProductLineLogoProps {
  line: ProductLineId | CarouselPoleId;
  width?: number;
  onDark?: boolean;
}

function resolveProductLine(line: ProductLineId | CarouselPoleId): ProductLineId {
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return carouselPoleToProductLine(line);
  }
  return line;
}

/** Logo compact pour les cartes de choix d'univers. */
export const ProductLineLogo: React.FC<ProductLineLogoProps> = ({
  line,
  width = 168,
  onDark = false,
}) => {
  const background = onDark ? 'dark' : 'light';
  const productLine = resolveProductLine(line);

  if (productLine === 'woman') {
    return <WomanLogo width={width} background={background} />;
  }
  if (productLine === 'amateur') {
    return <AmateurLogo width={width} background={background} />;
  }
  if (productLine === 'supporter') {
    return <SupporterLogo width={width} background={background} />;
  }
  if (productLine === 'pro') {
    return <ProLogo width={width} background={background} />;
  }
  if (productLine === 'sante') {
    return <SanteLogo width={width} background={background} />;
  }
  return <ManLogo width={width} background={background} />;
};
