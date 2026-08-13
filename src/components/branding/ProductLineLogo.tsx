import React from 'react';
import type { ProductLineId } from '../../models/ProductLine';
import type { CarouselPoleId } from '../../models/CarouselPole';
import { isCarouselProPole } from '../../models/CarouselPole';
import { ManLogo } from '../ManLogo';
import { AmateurLogo } from '../AmateurLogo';
import { SupporterLogo } from '../SupporterLogo';
import { ProSegmentLogo } from './ProSegmentLogo';
import { ParentLogo } from '../ParentLogo';
import { WomanLogo } from '../WomanLogo';
import { SponsorLogo } from '../SponsorLogo';

interface ProductLineLogoProps {
  line: ProductLineId | CarouselPoleId;
  width?: number;
  onDark?: boolean;
  centered?: boolean;
}

/** Logo compact pour les cartes de choix d'univers. */
export const ProductLineLogo: React.FC<ProductLineLogoProps> = ({
  line,
  width = 168,
  onDark = false,
  centered = false,
}) => {
  const background = onDark ? 'dark' : 'light';

  if (line === 'woman') {
    return <WomanLogo width={width} background={background} />;
  }
  if (line === 'amateur' || line === 'joueur') {
    return <AmateurLogo width={width} background={background} centered={centered} />;
  }
  if (line === 'supporter') {
    return <SupporterLogo width={width} background={background} centered={centered} />;
  }
  if (line === 'sponsor') {
    return <SponsorLogo width={width} background={background} centered={centered} />;
  }
  if (line === 'parent') {
    return <ParentLogo width={width} background={background} centered={centered} />;
  }
  if (line === 'pro' || isCarouselProPole(line as CarouselPoleId)) {
    return (
      <ProSegmentLogo
        segment={line === 'pro' ? 'pro' : (line as CarouselPoleId)}
        width={width}
        background={background}
        centered={centered}
      />
    );
  }
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return (
      <ProSegmentLogo segment={line} width={width} background={background} centered={centered} />
    );
  }
  return <ManLogo width={width} background={background} />;
};
