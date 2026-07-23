import React from 'react';
import { PRODAY_SPONSOR_BRAND } from '../models/ProductLine';
import { SPONSOR_BRANDING_LOGOS } from '../content/brandingAssets';
import type { LogoBackground } from './Logo';
import { BrandWordmarkLogo } from './branding/BrandWordmarkLogo';

const SPONSOR_COLORS = {
  brand: '#92700C',
  accent: '#D4AF37',
  taglineLight: '#B8860B',
  taglineDark: 'rgba(255, 230, 160, 0.92)',
} as const;

interface SponsorLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
}

/** Logo Pro Day Sponsor — picto P or (#D4AF37) + mot-symbole. */
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

export function sponsorLogoAspect(width: number): number {
  const pictoW = width * 0.76;
  const pictoH = pictoW / 1.78;
  const line1 = width * 0.1;
  const line2 = width * 0.115;
  const tagSize = width * 0.076;
  const height = pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
  return width / height;
};
