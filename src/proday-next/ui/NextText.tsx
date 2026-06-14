import React, { useMemo } from 'react';
import { Text, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { useProductLine } from '../../context/ProductLineContext';
import { nextThemeForLine } from '../design-system/themes';
import { nextTypography } from '../design-system/tokens';

type Variant = keyof typeof nextTypography;

type NextTextProps = TextProps & {
  variant?: Variant;
  accent?: boolean;
  muted?: boolean;
  inverse?: boolean;
};

export const NextText: React.FC<NextTextProps> = ({
  variant = 'body',
  accent,
  muted,
  inverse,
  style,
  children,
  ...rest
}) => {
  const { productLine } = useProductLine();
  const palette = useMemo(() => nextThemeForLine(productLine), [productLine]);

  const color = inverse
    ? palette.void
    : accent
      ? palette.accent
      : muted
        ? palette.textMuted
        : palette.text;

  return (
    <Text style={[nextTypography[variant], { color }, style]} {...rest}>
      {children}
    </Text>
  );
};

export const nextTextStyles = StyleSheet.create({});
