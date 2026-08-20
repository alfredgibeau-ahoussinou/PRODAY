import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SPACE_MATCH } from '../theme/supporterSpaceTheme';

type Props = {
  label: string;
  /** Displayed value (already formatted). */
  display: string;
  /** 0–1 fill of the ring. */
  progress: number;
  color: string;
  size?: number;
};

export const MatchStatGauge: React.FC<Props> = ({
  label,
  display,
  progress,
  color,
  size = 88,
}) => {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={SUPPORTER_SPACE_MATCH.gaugeTrack}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - clamped)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.center}>
          <ProDayText variant="title" style={styles.value}>
            {display}
          </ProDayText>
        </View>
      </View>
      <ProDayText variant="caption" style={styles.label} numberOfLines={1}>
        {label}
      </ProDayText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, width: '33%' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '800',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: SUPPORTER_SPACE_MATCH.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
