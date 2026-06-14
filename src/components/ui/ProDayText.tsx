import React, { useMemo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { textVariants, type TextVariant } from '../../theme/typography';

type ProDayTextProps = TextProps & {
  variant?: TextVariant;
  muted?: boolean;
  accent?: boolean;
  inverse?: boolean;
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
  style,
  children,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const base = textVariants[variant];

  const color = useMemo(() => {
    // inverse + accent : fond accent clair (brandSoft) — pas du texte blanc
    if (accent) return colors.accent;
    if (inverse) return colors.brandInverse;
    if (muted) return colors.textMuted;
    return colors[COLOR_KEY[variant]];
  }, [accent, colors, inverse, muted, variant]);

  return (
    <Text style={[base, { color }, style]} {...rest}>
      {children}
    </Text>
  );
};
