import React from 'react';
import { PRODAY_SPONSOR_BRAND } from '../models/ProductLine';
import type { LogoBackground } from './Logo';
import { BrandWordmarkLogo } from './branding/BrandWordmarkLogo';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';

const SPONSOR_COLORS = {
  brand: '#FFFFFF',
  accent: PRODAY_POLE_ACCENTS.sponsor,
  taglineLight: '#C45FBF',
  taglineDark: 'rgba(250, 250, 249, 0.72)',
} as const;

interface SponsorLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
}

/**
 * Logo Pro Day Sponsor — symbole HD teinté (#92278F) + wordmark.
 * Pas de lockup opaque / picto legacy.
 */
export const SponsorLogo: React.FC<SponsorLogoProps> = ({
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
}) => (
  <BrandWordmarkLogo
    brand={PRODAY_SPONSOR_BRAND}
    variant="sponsor"
    colors={SPONSOR_COLORS}
    width={width}
    background={background}
    opacity={opacity}
    watermark={watermark}
    centered={centered}
  />
);

export default SponsorLogo;
