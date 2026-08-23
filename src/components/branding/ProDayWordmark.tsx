import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fontFamily } from '../../theme/typography';
import {
  PRODAY_MASTER,
  PRODAY_TAGLINE,
  poleAccent,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';

type ProDayWordmarkProps = {
  width?: number;
  /** Master = blanc/noir ; pôle = accent sur le mot. */
  variant?: ProDayBrandVariant;
  onDark?: boolean;
  /** Sous-libellé pôle (JOUEUR, COACH…). */
  poleLabel?: string | null;
  /** Tagline officielle sous le wordmark. */
  showTagline?: boolean;
  align?: 'center' | 'left';
  /** Horizontal lockup : libellé pôle sur la même ligne que PRODAY. */
  poleLabelInline?: boolean;
};

/**
 * Wordmark PRODAY — tracking large + tagline optionnelle.
 */
export function ProDayWordmark({
  width = 160,
  variant = 'master',
  onDark = true,
  poleLabel,
  showTagline = false,
  align = 'center',
  poleLabelInline = false,
}: ProDayWordmarkProps) {
  const fontSize = Math.max(12, width * 0.18);
  const color =
    variant === 'master'
      ? onDark
        ? PRODAY_MASTER.white
        : PRODAY_MASTER.black
      : poleAccent(variant);

  const poleStyle = {
    fontSize: Math.max(8, fontSize * 0.42),
    color: onDark ? 'rgba(255,255,255,0.72)' : PRODAY_MASTER.grayMuted,
    letterSpacing: fontSize * 0.22,
  };

  const taglineStyle = {
    fontSize: Math.max(7, fontSize * 0.34),
    color: variant === 'master' ? PRODAY_MASTER.gold : poleAccent(variant),
    letterSpacing: fontSize * 0.12,
    marginTop: showTagline && !poleLabel ? 6 : 4,
  };

  if (poleLabelInline && poleLabel) {
    return (
      <>
        <Text
          style={[
            styles.inlineRow,
            align === 'left' && styles.inlineRowLeft,
            { maxWidth: width },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.word,
              align === 'left' && styles.wordLeft,
              { fontSize, color, letterSpacing: fontSize * 0.28 },
            ]}
          >
            PRODAY
          </Text>
          <Text style={[styles.poleInline, poleStyle]}>{` · ${poleLabel}`}</Text>
        </Text>
        {showTagline ? (
          <Text
            style={[styles.tagline, align === 'left' && styles.taglineLeft, taglineStyle]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            {PRODAY_TAGLINE}
          </Text>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Text
        style={[
          styles.word,
          align === 'left' && styles.wordLeft,
          { fontSize, color, letterSpacing: fontSize * 0.28 },
        ]}
        allowFontScaling={false}
        accessibilityRole="text"
        numberOfLines={1}
      >
        PRODAY
      </Text>
      {poleLabel ? (
        <Text
          style={[styles.pole, align === 'left' && styles.poleLeft, poleStyle]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          {poleLabel}
        </Text>
      ) : null}
      {showTagline ? (
        <Text
          style={[styles.tagline, align === 'left' && styles.taglineLeft, taglineStyle]}
          allowFontScaling={false}
          numberOfLines={2}
        >
          {PRODAY_TAGLINE}
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
  wordLeft: { textAlign: 'left' },
  pole: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  poleLeft: { textAlign: 'left' },
  tagline: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  taglineLeft: { textAlign: 'left' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
    textAlign: 'center',
    alignSelf: 'center',
  },
  inlineRowLeft: { textAlign: 'left', alignSelf: 'flex-start' },
  poleInline: {
    fontFamily: fontFamily.semibold,
    textTransform: 'uppercase',
  },
});
