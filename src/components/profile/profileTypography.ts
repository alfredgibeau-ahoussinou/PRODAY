import { Platform, type TextStyle } from 'react-native';
import { fontFamily } from '../../theme/typography';

/** Profil — typo lisible sur mobile (Inter), titres centrés. */
export const isProfileMobile = Platform.OS !== 'web';

export const profileType = {
  heroName: {
    fontFamily: fontFamily.black,
    fontSize: isProfileMobile ? 20 : 22,
    fontWeight: '900',
    letterSpacing: -0.35,
    lineHeight: isProfileMobile ? 24 : 26,
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
  },
  role: {
    fontFamily: fontFamily.extrabold,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  chip: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  menuTitle: {
    fontFamily: fontFamily.extrabold,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  menuSub: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  pulseHint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
    textAlign: 'center',
  },
  pulseScore: {
    fontFamily: fontFamily.black,
    fontWeight: '900',
  },
  pulseLabel: {
    fontFamily: fontFamily.bold,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
} as const satisfies Record<string, TextStyle>;
