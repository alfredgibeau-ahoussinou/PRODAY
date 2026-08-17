import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ProDayText } from '../ui/ProDayText';
import { useTranslation } from '../../context/LocaleContext';
import { SMART_PITCH, useSmartTacticsTheme } from './smartTacticsUi';
import { spacing } from '../../theme/designTokens';

export const MatchReadinessRing: React.FC<{
  potential: number;
  readinessPct: number;
  size?: number;
}> = ({ potential, readinessPct, size = 112 }) => {
  const { t } = useTranslation();
  const theme = useSmartTacticsTheme();
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, readinessPct)) / 100;
  const tone =
    readinessPct >= 75
      ? SMART_PITCH.ready
      : readinessPct >= 50
        ? theme.midTone
        : SMART_PITCH.risk;
  const styles = useMemo(() => createStyles(size, theme.accent), [size, theme.accent]);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <ProDayText variant="caption" muted style={styles.label}>
          {t('smartTactics.potential')}
        </ProDayText>
        <ProDayText variant="section" style={styles.potential}>
          {potential}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.ready, { color: tone }]}>
          {t('smartTactics.ready')} {readinessPct}%
        </ProDayText>
      </View>
    </View>
  );
};

function createStyles(size: number, accentTone: string) {
  return StyleSheet.create({
    wrap: { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
    center: {
      position: 'absolute',
      alignItems: 'center',
      gap: 0,
      paddingHorizontal: spacing.xs,
    },
    label: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    potential: {
      fontSize: 26,
      fontWeight: '900',
      color: accentTone,
    },
    ready: { fontSize: 11, fontWeight: '800' },
  });
}
