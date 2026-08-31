import React from 'react';
import { PRODAY_PARENT_BRAND } from '../models/ProductLine';
import { SANTE_BRANDING_LOGOS } from '../content/brandingAssets';
import { BrandWordmarkLogo } from './branding/BrandWordmarkLogo';
import type { LogoBackground } from './Logo';

const PARENT_COLORS = {
  brand: '#FFFFFF',
  accent: '#F97316',
  taglineLight: '#FB923C',
  taglineDark: 'rgba(255, 255, 255, 0.92)',
} as const;

interface ParentLogoProps {
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
}

/** Logo Pro Day Parent — picto teal + mot-symbole Parent. */
export const ParentLogo: React.FC<ParentLogoProps> = ({
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
}) => (
  <BrandWordmarkLogo
    brand={PRODAY_PARENT_BRAND}
    picto={SANTE_BRANDING_LOGOS.picto}
    colors={PARENT_COLORS}
    width={width}
    background={background}
    opacity={opacity}
    watermark={watermark}
    centered={centered}
  />
);

export function parentLogoAspect(width: number): number {
  const pictoW = width * 0.76;
  const pictoH = pictoW / 1.78;
  const line1 = width * 0.1;
  const line2 = width * 0.115;
  const tagSize = width * 0.076;
  const height = pictoH + line1 + line2 + tagSize * 2.2 + width * 0.05;
  return width / height;
}
