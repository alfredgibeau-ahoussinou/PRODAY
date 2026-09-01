import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

export interface JoueurAttributes {
  pace?: number; // Vitesse (0-99)
  shooting?: number; // Tir (0-99)
  passing?: number; // Passe (0-99)
  dribbling?: number; // Dribble (0-99)
  defending?: number; // Défense (0-99)
  physical?: number; // Physique (0-99)
}

interface JoueurAttributeRadarProps {
  attributes?: JoueurAttributes;
  size?: number;
  accent?: string;
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_ATTRIBUTES: Required<JoueurAttributes> = {
  pace: 75,
  shooting: 70,
  passing: 78,
  dribbling: 82,
  defending: 65,
  physical: 74,
};

const AXES = [
  { key: 'pace' as const, label: 'VIT', full: 'Vitesse' },
  { key: 'shooting' as const, label: 'TIR', full: 'Tir' },
  { key: 'passing' as const, label: 'PAS', full: 'Passe' },
  { key: 'dribbling' as const, label: 'DRI', full: 'Dribble' },
  { key: 'defending' as const, label: 'DEF', full: 'Défense' },
  { key: 'physical' as const, label: 'PHY', full: 'Physique' },
];

export const JoueurAttributeRadar: React.FC<JoueurAttributeRadarProps> = ({
  attributes = DEFAULT_ATTRIBUTES,
  size = 240,
  accent = PLAYER_DARK.accent,
  showLabels = true,
  style,
}) => {
  const merged: Required<JoueurAttributes> = {
    pace: attributes.pace ?? DEFAULT_ATTRIBUTES.pace,
    shooting: attributes.shooting ?? DEFAULT_ATTRIBUTES.shooting,
    passing: attributes.passing ?? DEFAULT_ATTRIBUTES.passing,
    dribbling: attributes.dribbling ?? DEFAULT_ATTRIBUTES.dribbling,
    defending: attributes.defending ?? DEFAULT_ATTRIBUTES.defending,
    physical: attributes.physical ?? DEFAULT_ATTRIBUTES.physical,
  };

  const center = size / 2;
  const radiusVal = (size - 64) / 2;
  const totalAxes = AXES.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const getCoordinates = (index: number, valueRatio: number) => {
    // start from top (- PI / 2)
    const angle = index * angleStep - Math.PI / 2;
    const r = radiusVal * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Polygon points for player stats
  const playerPoints = AXES.map((axis, i) => {
    const val = Math.min(99, Math.max(10, merged[axis.key])) / 100;
    const { x, y } = getCoordinates(i, val);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.65} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>

        {/* Concentric Web Polygons */}
        {gridLevels.map((lvl) => {
          const gridPoints = AXES.map((_, i) => {
            const { x, y } = getCoordinates(i, lvl);
            return `${x},${y}`;
          }).join(' ');
          return (
            <Polygon
              key={lvl}
              points={gridPoints}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={1}
              fill={lvl === 1 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
            />
          );
        })}

        {/* Axis Lines */}
        {AXES.map((_, i) => {
          const { x, y } = getCoordinates(i, 1);
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={1}
              strokeDasharray="2, 2"
            />
          );
        })}

        {/* Player Radar Polygon */}
        <Polygon
          points={playerPoints}
          fill="url(#radarGrad)"
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Vertex Dots & Axis Labels */}
        {AXES.map((axis, i) => {
          const val = Math.min(99, Math.max(10, merged[axis.key]));
          const valRatio = val / 100;
          const pt = getCoordinates(i, valRatio);
          const labelPt = getCoordinates(i, 1.22);

          return (
            <React.Fragment key={axis.key}>
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={accent}
                stroke="#0E1626"
                strokeWidth={1.5}
              />
              {showLabels ? (
                <SvgText
                  x={labelPt.x}
                  y={labelPt.y + 4}
                  fill="#E2E8F0"
                  fontSize={10}
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {`${axis.label} ${val}`}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
