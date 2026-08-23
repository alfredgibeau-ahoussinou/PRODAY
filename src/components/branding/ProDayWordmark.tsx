import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fontFamily } from '../../theme/typography';
import { PRODAY_MASTER, poleAccent, type ProDayBrandVariant } from '../../theme/prodayBrand';

type ProDayWordmarkProps = {
  width?: number;
  /** Master = blanc/noir ; pôle = accent sur le mot. */
  variant?: ProDayBrandVariant;
  onDark?: boolean;
  /** Sous-libellé pôle (JOUEUR, COACH…). */
  poleLabel?: string | null;
};

/**
 * Wordmark PRODAY — Sora (fallback Syne/Inter), tracking large.
 */
export function ProDayWordmark({
  width = 160,
  variant = 'master',
  onDark = true,
  poleLabel,
}: ProDayWordmarkProps) {
  const fontSize = Math.max(12, width * 0.18);
  const color =
    variant === 'master'
      ? onDark
        ? PRODAY_MASTER.white
        : PRODAY_MASTER.black
      : poleAccent(variant);

  return (
    <>
      <Text
        style={[
          styles.word,
          {
            fontSize,
            color,
            letterSpacing: fontSize * 0.28,
          },
        ]}
        allowFontScaling={false}
        accessibilityRole="text"
      >
        PRODAY
      </Text>
      {poleLabel ? (
        <Text
          style={[
            styles.pole,
            {
              fontSize: Math.max(8, fontSize * 0.42),
              color: onDark ? 'rgba(255,255,255,0.72)' : PRODAY_MASTER.grayMuted,
              letterSpacing: fontSize * 0.22,
            },
          ]}
          allowFontScaling={false}
        >
          {poleLabel}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  word: {
    fontFamily: fontFamily.brand,
    fontWeight: undefined,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  pole: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
