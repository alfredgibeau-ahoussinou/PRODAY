import React from 'react';
import type { CarouselPoleId } from '../../models/CarouselPole';
import {
  PRODAY_PRO_BRAND,
  PRODAY_PRO_CLUB_BRAND,
  PRODAY_PRESIDENT_BRAND,
  PRODAY_PRO_PLAYER_BRAND,
  PRODAY_PRO_STAFF_BRAND,
} from '../../models/ProductLine';
import { PRO_BRANDING_LOGOS } from '../../content/brandingAssets';
import type { LogoBackground } from '../Logo';
import { BrandWordmarkLogo, type BrandWordmarkColors } from './BrandWordmarkLogo';

type ProSegment = 'pro' | 'pro_player' | 'pro_club' | 'pro_staff' | 'president' | CarouselPoleId;

const PRO_SEGMENT_COLORS: Record<
  'pro' | 'pro_player' | 'pro_club' | 'pro_staff' | 'president',
  BrandWordmarkColors
> = {
  pro: {
    brand: '#1E3A8A',
    accent: '#2563EB',
    taglineLight: '#3B82F6',
    taglineDark: 'rgba(255, 255, 255, 0.92)',
  },
  pro_player: {
    brand: '#1E3A8A',
    accent: '#3B82F6',
    taglineLight: '#60A5FA',
    taglineDark: 'rgba(255, 255, 255, 0.92)',
  },
  pro_club: {
    brand: '#1E3A8A',
    accent: '#1D4ED8',
    taglineLight: '#2563EB',
    taglineDark: 'rgba(255, 255, 255, 0.92)',
  },
  president: {
    brand: '#F7F3EB',
    accent: '#D4B880',
    taglineLight: '#E8D5A8',
    taglineDark: 'rgba(247, 243, 235, 0.92)',
  },
  pro_staff: {
    brand: '#172554',
    accent: '#2563EB',
    taglineLight: '#3B82F6',
    taglineDark: 'rgba(255, 255, 255, 0.92)',
  },
};

function resolveSegment(
  segment: ProSegment,
): 'pro' | 'pro_player' | 'pro_club' | 'pro_staff' | 'president' {
  if (segment === 'president') return 'president';
  if (segment === 'pro_club') return 'pro_club';
  if (segment === 'pro_staff' || segment === 'evenements' || segment === 'coach') {
    return 'pro_staff';
  }
  if (segment === 'pro_player' || segment === 'joueur' || segment === 'amateur') {
    return 'pro_player';
  }
  return 'pro';
}

interface ProSegmentLogoProps {
  segment?: ProSegment;
  width?: number;
  background?: LogoBackground;
  opacity?: number;
  watermark?: boolean;
  centered?: boolean;
}

/** Logo Pro Day segmenté (joueur / club / président / staff) — même picto, libellé adapté. */
export const ProSegmentLogo: React.FC<ProSegmentLogoProps> = ({
  segment = 'pro',
  width = 200,
  background = 'light',
  opacity = 1,
  watermark = false,
  centered = false,
}) => {
  const key = resolveSegment(segment);
  const brand =
    key === 'pro_player'
      ? PRODAY_PRO_PLAYER_BRAND
      : key === 'president'
        ? PRODAY_PRESIDENT_BRAND
        : key === 'pro_club'
          ? PRODAY_PRO_CLUB_BRAND
          : key === 'pro_staff'
            ? PRODAY_PRO_STAFF_BRAND
            : PRODAY_PRO_BRAND;

  return (
    <BrandWordmarkLogo
      brand={brand}
      picto={PRO_BRANDING_LOGOS.picto}
      colors={PRO_SEGMENT_COLORS[key]}
      width={width}
      background={background}
      opacity={opacity}
      watermark={watermark}
      centered={centered}
    />
  );
};
