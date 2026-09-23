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
import { textVariants, type TextVariant } from '../../theme/typography';
import { resolveProDayTextStyle } from '../../theme/proDayTextStyle';

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
    const styleColor = flat.color;

    // Jamais de skew / transform sur le texte UI (lisibilité).
    if (emoji) {
      const {
        color: _color,
        fontFamily: _fontFamily,
        fontWeight: _fontWeight,
        transform: _transform,
        ...restStyle
      } = flat;
      return [{ color: styleColor ?? themeColor }, restStyle];
    }

    // Famille système imposée **et graisse conservée** : les alias de famille
    // pointent tous vers la même pile, donc `fontWeight` doit être transmis
    // explicitement (sinon les titres retombent en graisse normale). Voir
    // `theme/proDayTextStyle.ts`.
    return [
      {
        ...resolveProDayTextStyle(variant, style),
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
