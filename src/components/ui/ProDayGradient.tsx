import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { gradientsForLine, type GradientStops } from '../../theme/universeGradients';

type GradientKind = 'hero' | 'heroDark' | 'card' | 'cta' | 'ambient';

type ProDayGradientProps = {
  kind?: GradientKind;
  colors?: GradientStops;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export const ProDayGradient: React.FC<ProDayGradientProps> = ({
  kind = 'cta',
  colors: overrideColors,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  const { productLine } = useAppTheme();
  const stops = overrideColors ?? gradientsForLine(productLine)[kind];

  return (
    <LinearGradient colors={[...stops]} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
};
