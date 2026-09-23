import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useAdminTokens } from '../theme/adminTokens';
import { adminType, type AdminTypeVariant } from '../theme/adminDesignSystem';

type TextProps = {
  children: React.ReactNode;
  variant?: AdminTypeVariant;
  color?: string;
  champagne?: boolean;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function AdminText({
  children,
  variant = 'body',
  color,
  champagne,
  muted,
  style,
  numberOfLines,
}: TextProps) {
  const tokens = useAdminTokens();
  const resolved =
    color ??
    (champagne ? tokens.champagneBright : muted ? tokens.muted : tokens.foreground);
  return (
    <ProDayText
      variant="body"
      numberOfLines={numberOfLines}
      style={[adminType[variant], { color: resolved }, style]}
    >
      {children}
    </ProDayText>
  );
}
