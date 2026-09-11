import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { fontFamily, textVariants, type TextVariant } from '../../theme/typography';

type ProDayTextProps = TextProps & {
  variant?: TextVariant;
  muted?: boolean;
  accent?: boolean;
  inverse?: boolean;
  /** Emoji / pictos : police système (évite Inter/Syne sur glyphes). */
  emoji?: boolean;
};

const COLOR_KEY: Record<TextVariant, 'text' | 'textSecondary' | 'textMuted'> = {
  hero: 'text',
  title: 'text',
  section: 'text',
  brand: 'text',
  eyebrow: 'textMuted',
  body: 'textSecondary',
  caption: 'textMuted',
};

/** Variantes qui utilisaient Syne — désormais Inter sauf `brand`. */
const DISPLAY_WEIGHT_VARIANTS = new Set<TextVariant>([
  'hero',
  'title',
  'section',
  'brand',
]);

function numericWeight(weight: TextStyle['fontWeight'] | undefined): number | null {
  if (weight == null) return null;
  if (typeof weight === 'number') return weight;
  if (weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const n = Number(weight);
  return Number.isFinite(n) ? n : null;
}

/**
 * Expo Google Fonts : chaque graisse = un fichier.
 * On mappe fontWeight → famille, puis on retire fontWeight du style final.
 */
function resolveLoadedFont(
  variant: TextVariant,
  weight: TextStyle['fontWeight'] | undefined,
): string {
  const w = numericWeight(weight);

  if (variant === 'brand') {
    if (w != null && w >= 800) return fontFamily.displayBold;
    return fontFamily.display;
  }

  if (w == null) return textVariants[variant]?.fontFamily || fontFamily.regular;

  if (DISPLAY_WEIGHT_VARIANTS.has(variant) || variant === 'eyebrow') {
    if (w >= 900) return fontFamily.black;
    if (w >= 800) return fontFamily.extrabold;
    if (w >= 700) return fontFamily.bold;
    if (w >= 600) return fontFamily.semibold;
    return fontFamily.regular;
  }

  if (w >= 900) return fontFamily.black;
  if (w >= 800) return fontFamily.extrabold;
  if (w >= 700) return fontFamily.bold;
  if (w >= 600) return fontFamily.semibold;
  return fontFamily.regular;
}

export const ProDayText: React.FC<ProDayTextProps> = ({
  variant = 'body',
  muted,
  accent,
  inverse,
  emoji,
  style,
  children,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const profile = useSessionProfile();
  const joueurTheme = useJoueurTheme();
  const isPlayer = profile?.role === 'player';
  const base = textVariants[variant];

  const themeColor = useMemo(() => {
    if (accent) return isPlayer ? joueurTheme.accent : colors.accent;
    if (inverse) return colors.brandInverse;
    if (muted) return colors.textMuted;
    return colors[COLOR_KEY[variant]];
  }, [accent, colors, inverse, isPlayer, joueurTheme.accent, muted, variant]);

  const resolved = useMemo((): StyleProp<TextStyle> => {
    const flat = StyleSheet.flatten([base, style]) as TextStyle;
    const {
      fontFamily: _fontFamily,
      fontWeight,
      color: styleColor,
      transform: _transform,
      ...restStyle
    } = flat;

    // Jamais de skew / transform sur le texte UI (lisibilité).
    if (emoji) {
      return [{ color: styleColor ?? themeColor }, restStyle];
    }

    return [
      {
        ...restStyle,
        fontFamily: resolveLoadedFont(variant, fontWeight),
        color: styleColor ?? themeColor,
      },
    ];
  }, [base, style, emoji, variant, themeColor]);

  return (
    <Text
      style={resolved}
      {...rest}
      allowFontScaling={rest.allowFontScaling ?? true}
    >
      {children}
    </Text>
  );
};
