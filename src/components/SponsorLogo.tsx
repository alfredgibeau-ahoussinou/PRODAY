import React from 'react';
import { PRODAY_SPONSOR_BRAND } from '../models/ProductLine';
import { SPONSOR_BRANDING_LOGOS } from '../content/brandingAssets';
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

/** Logo Pro Day Sponsor — accent violet planche (#92278F). */
export const SponsorLogo: React.FC<SponsorLogoProps> = ({
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
}) => (
  <BrandWordmarkLogo
    brand={PRODAY_SPONSOR_BRAND}
    picto={SPONSOR_BRANDING_LOGOS.picto}
    colors={SPONSOR_COLORS}
    width={width}
    background={background}
    opacity={opacity}
    watermark={watermark}
    centered={centered}
  />
);

export default SponsorLogo;
