import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachFutPlayerCard, FutPlayer } from './CoachFutPlayerCard';

export type MatchFormatKey = '11v11' | '8v8' | '5v5' | '4v4' | '3v3';

export const MATCH_FORMATS_CONFIG: Record<
  MatchFormatKey,
  {
    name: string;
    starterCount: number;
    defaultFormation: string;
    formations: string[];
    isFutsal?: boolean;
  }
> = {
  '11v11': {
    name: 'Foot à 11',
    starterCount: 11,
    defaultFormation: '4-3-3',
    formations: ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '5-3-2'],
  },
  '8v8': {
    name: 'Foot à 8',
    starterCount: 8,
    defaultFormation: '3-3-1',
    formations: ['3-3-1', '3-2-2', '2-4-1', '2-3-2'],
  },
  '5v5': {
    name: 'Futsal / Foot à 5',
    starterCount: 5,
    defaultFormation: '1-2-1',
    formations: ['1-2-1', '2-2', '2-1-1', '3-1'],
    isFutsal: true,
  },
  '4v4': {
    name: 'Foot à 4',
    starterCount: 4,
    defaultFormation: '1-2-1 (4)',
    formations: ['1-2-1 (4)', '1-1-2', '2-1-1 (4)', '2-2 (4)'],
  },
  '3v3': {
    name: 'Foot à 3',
    starterCount: 3,
    defaultFormation: '1-2',
    formations: ['1-2', '2-1', '1-1-1'],
  },
};

export interface PitchSlot {
  x: number; // 0 to 1
  y: number; // 0 to 1 (0 = top / opp goal, 1 = bottom / our GK)
  defaultPos: string;
}

// Normalized formation coordinates for all supported match formats
export const ALL_FORMATION_COORDINATES: Record<string, PitchSlot[]> = {
  // 1. Foot à 11
  '4-3-3': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.14, y: 0.72, defaultPos: 'LB' },
    { x: 0.38, y: 0.74, defaultPos: 'CB' },
    { x: 0.62, y: 0.74, defaultPos: 'CB' },
    { x: 0.86, y: 0.72, defaultPos: 'RB' },
    { x: 0.28, y: 0.50, defaultPos: 'CM' },
    { x: 0.50, y: 0.56, defaultPos: 'CDM' },
    { x: 0.72, y: 0.50, defaultPos: 'CM' },
    { x: 0.18, y: 0.22, defaultPos: 'LW' },
    { x: 0.50, y: 0.16, defaultPos: 'ST' },
    { x: 0.82, y: 0.22, defaultPos: 'RW' },
  ],
  '4-2-3-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.14, y: 0.72, defaultPos: 'LB' },
    { x: 0.38, y: 0.74, defaultPos: 'CB' },
    { x: 0.62, y: 0.74, defaultPos: 'CB' },
    { x: 0.86, y: 0.72, defaultPos: 'RB' },
    { x: 0.34, y: 0.57, defaultPos: 'CDM' },
    { x: 0.66, y: 0.57, defaultPos: 'CDM' },
    { x: 0.18, y: 0.36, defaultPos: 'LAM' },
    { x: 0.50, y: 0.34, defaultPos: 'CAM' },
    { x: 0.82, y: 0.36, defaultPos: 'RAM' },
    { x: 0.50, y: 0.16, defaultPos: 'ST' },
  ],
  '4-4-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.14, y: 0.72, defaultPos: 'LB' },
    { x: 0.38, y: 0.74, defaultPos: 'CB' },
    { x: 0.62, y: 0.74, defaultPos: 'CB' },
    { x: 0.86, y: 0.72, defaultPos: 'RB' },
    { x: 0.15, y: 0.46, defaultPos: 'LM' },
    { x: 0.38, y: 0.48, defaultPos: 'CM' },
    { x: 0.62, y: 0.48, defaultPos: 'CM' },
    { x: 0.85, y: 0.46, defaultPos: 'RM' },
    { x: 0.35, y: 0.18, defaultPos: 'ST' },
    { x: 0.65, y: 0.18, defaultPos: 'ST' },
  ],
  '3-5-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.26, y: 0.74, defaultPos: 'CB' },
    { x: 0.50, y: 0.76, defaultPos: 'CB' },
    { x: 0.74, y: 0.74, defaultPos: 'CB' },
    { x: 0.12, y: 0.48, defaultPos: 'LWB' },
    { x: 0.34, y: 0.52, defaultPos: 'CM' },
    { x: 0.50, y: 0.40, defaultPos: 'CAM' },
    { x: 0.66, y: 0.52, defaultPos: 'CM' },
    { x: 0.88, y: 0.48, defaultPos: 'RWB' },
    { x: 0.35, y: 0.18, defaultPos: 'ST' },
    { x: 0.65, y: 0.18, defaultPos: 'ST' },
  ],
  '5-3-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.12, y: 0.70, defaultPos: 'LWB' },
    { x: 0.31, y: 0.75, defaultPos: 'CB' },
    { x: 0.50, y: 0.77, defaultPos: 'CB' },
    { x: 0.69, y: 0.75, defaultPos: 'CB' },
    { x: 0.88, y: 0.70, defaultPos: 'RWB' },
    { x: 0.28, y: 0.48, defaultPos: 'CM' },
    { x: 0.50, y: 0.52, defaultPos: 'CDM' },
    { x: 0.72, y: 0.48, defaultPos: 'CM' },
    { x: 0.35, y: 0.18, defaultPos: 'ST' },
    { x: 0.65, y: 0.18, defaultPos: 'ST' },
  ],

  // 2. Foot à 8 (U12/U13)
  '3-3-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.20, y: 0.72, defaultPos: 'LB' },
    { x: 0.50, y: 0.75, defaultPos: 'CB' },
    { x: 0.80, y: 0.72, defaultPos: 'RB' },
    { x: 0.20, y: 0.46, defaultPos: 'LM' },
    { x: 0.50, y: 0.48, defaultPos: 'CM' },
    { x: 0.80, y: 0.46, defaultPos: 'RM' },
    { x: 0.50, y: 0.20, defaultPos: 'ST' },
  ],
  '3-2-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.20, y: 0.72, defaultPos: 'LB' },
    { x: 0.50, y: 0.75, defaultPos: 'CB' },
    { x: 0.80, y: 0.72, defaultPos: 'RB' },
    { x: 0.35, y: 0.48, defaultPos: 'CM' },
    { x: 0.65, y: 0.48, defaultPos: 'CM' },
    { x: 0.35, y: 0.20, defaultPos: 'ST' },
    { x: 0.65, y: 0.20, defaultPos: 'ST' },
  ],
  '2-4-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.32, y: 0.74, defaultPos: 'CB' },
    { x: 0.68, y: 0.74, defaultPos: 'CB' },
    { x: 0.15, y: 0.48, defaultPos: 'LM' },
    { x: 0.38, y: 0.50, defaultPos: 'CM' },
    { x: 0.62, y: 0.50, defaultPos: 'CM' },
    { x: 0.85, y: 0.48, defaultPos: 'RM' },
    { x: 0.50, y: 0.20, defaultPos: 'ST' },
  ],
  '2-3-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.32, y: 0.74, defaultPos: 'CB' },
    { x: 0.68, y: 0.74, defaultPos: 'CB' },
    { x: 0.20, y: 0.48, defaultPos: 'LM' },
    { x: 0.50, y: 0.50, defaultPos: 'CM' },
    { x: 0.80, y: 0.48, defaultPos: 'RM' },
    { x: 0.35, y: 0.20, defaultPos: 'ST' },
    { x: 0.65, y: 0.20, defaultPos: 'ST' },
  ],

  // 3. Foot à 5 & Futsal
  '1-2-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.50, y: 0.68, defaultPos: 'FIX' },
    { x: 0.22, y: 0.46, defaultPos: 'AL' },
    { x: 0.78, y: 0.46, defaultPos: 'AD' },
    { x: 0.50, y: 0.22, defaultPos: 'PIV' },
  ],
  '2-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.30, y: 0.65, defaultPos: 'DEF' },
    { x: 0.70, y: 0.65, defaultPos: 'DEF' },
    { x: 0.30, y: 0.28, defaultPos: 'ATT' },
    { x: 0.70, y: 0.28, defaultPos: 'ATT' },
  ],
  '2-1-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.30, y: 0.68, defaultPos: 'DEF' },
    { x: 0.70, y: 0.68, defaultPos: 'DEF' },
    { x: 0.50, y: 0.45, defaultPos: 'MIL' },
    { x: 0.50, y: 0.22, defaultPos: 'PIV' },
  ],
  '3-1': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.20, y: 0.65, defaultPos: 'AL' },
    { x: 0.50, y: 0.68, defaultPos: 'FIX' },
    { x: 0.80, y: 0.65, defaultPos: 'AD' },
    { x: 0.50, y: 0.22, defaultPos: 'PIV' },
  ],

  // 4. Foot à 4
  '1-2-1 (4)': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.28, y: 0.54, defaultPos: 'MIL' },
    { x: 0.72, y: 0.54, defaultPos: 'MIL' },
    { x: 0.50, y: 0.24, defaultPos: 'ATT' },
  ],
  '1-1-2': [
    { x: 0.50, y: 0.88, defaultPos: 'GK' },
    { x: 0.50, y: 0.62, defaultPos: 'DEF' },
    { x: 0.32, y: 0.28, defaultPos: 'ATT' },
    { x: 0.68, y: 0.28, defaultPos: 'ATT' },
  ],
  '2-1-1 (4)': [
    { x: 0.30, y: 0.76, defaultPos: 'DEF' },
    { x: 0.70, y: 0.76, defaultPos: 'DEF' },
    { x: 0.50, y: 0.50, defaultPos: 'MIL' },
    { x: 0.50, y: 0.22, defaultPos: 'ATT' },
  ],
  '2-2 (4)': [
    { x: 0.30, y: 0.72, defaultPos: 'DEF' },
    { x: 0.70, y: 0.72, defaultPos: 'DEF' },
    { x: 0.30, y: 0.28, defaultPos: 'ATT' },
    { x: 0.70, y: 0.28, defaultPos: 'ATT' },
  ],

  // 5. Foot à 3
  '1-2': [
    { x: 0.50, y: 0.84, defaultPos: 'DEF' },
    { x: 0.30, y: 0.28, defaultPos: 'ATT' },
    { x: 0.70, y: 0.28, defaultPos: 'ATT' },
  ],
  '2-1': [
    { x: 0.30, y: 0.74, defaultPos: 'DEF' },
    { x: 0.70, y: 0.74, defaultPos: 'DEF' },
    { x: 0.50, y: 0.26, defaultPos: 'ATT' },
  ],
  '1-1-1': [
    { x: 0.50, y: 0.84, defaultPos: 'DEF' },
    { x: 0.50, y: 0.52, defaultPos: 'MIL' },
    { x: 0.50, y: 0.22, defaultPos: 'ATT' },
  ],
};

// Chemistry Links mapping
export const ALL_CHEMISTRY_LINKS: Record<string, [number, number][]> = {
  // 11v11
  '4-3-3': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 6], [3, 6], [4, 7],
    [5, 6], [6, 7],
    [5, 8], [6, 9], [7, 10],
    [8, 9], [9, 10],
  ],
  '4-2-3-1': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 5], [3, 6], [4, 6],
    [5, 6],
    [5, 7], [5, 8], [6, 8], [6, 9],
    [7, 8], [8, 9],
    [7, 10], [8, 10], [9, 10],
  ],
  '4-4-2': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 6], [3, 7], [4, 8],
    [5, 6], [6, 7], [7, 8],
    [5, 9], [6, 9], [7, 10], [8, 10],
    [9, 10],
  ],
  '3-5-2': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [1, 5], [2, 5], [2, 7], [3, 7], [3, 8],
    [4, 5], [5, 6], [6, 7], [7, 8],
    [4, 9], [6, 9], [6, 10], [8, 10],
    [9, 10],
  ],
  '5-3-2': [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [2, 3], [3, 4], [4, 5],
    [1, 6], [2, 6], [3, 7], [4, 8], [5, 8],
    [6, 7], [7, 8],
    [6, 9], [7, 9], [7, 10], [8, 10],
    [9, 10],
  ],

  // 8v8
  '3-3-1': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [2, 5], [3, 6],
    [4, 5], [5, 6],
    [4, 7], [5, 7], [6, 7],
  ],
  '3-2-2': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [2, 4], [2, 5], [3, 5],
    [4, 5],
    [4, 6], [5, 7], [6, 7],
  ],
  '2-4-1': [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [1, 4], [2, 5], [2, 6],
    [3, 4], [4, 5], [5, 6],
    [3, 7], [4, 7], [5, 7], [6, 7],
  ],
  '2-3-2': [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [1, 4], [2, 4], [2, 5],
    [3, 4], [4, 5],
    [3, 6], [4, 6], [4, 7], [5, 7],
    [6, 7],
  ],

  // 5v5 Futsal
  '1-2-1': [
    [0, 1],
    [1, 2], [1, 3],
    [2, 3],
    [2, 4], [3, 4],
    [1, 4],
  ],
  '2-2': [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [2, 4],
    [3, 4],
    [1, 4], [2, 3],
  ],
  '2-1-1': [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [2, 3],
    [3, 4],
  ],
  '3-1': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [2, 4], [3, 4],
  ],

  // 4v4
  '1-2-1 (4)': [
    [0, 1], [0, 2], [1, 2], [1, 3], [2, 3],
  ],
  '1-1-2': [
    [0, 1],
    [1, 2], [1, 3],
    [2, 3],
  ],
  '2-1-1 (4)': [
    [0, 1], [0, 2], [1, 2], [2, 3],
  ],
  '2-2 (4)': [
    [0, 1], [0, 2], [1, 3], [2, 3],
  ],

  // 3v3
  '1-2': [
    [0, 1], [0, 2],
    [1, 2],
  ],
  '2-1': [
    [0, 1],
    [0, 2], [1, 2],
  ],
  '1-1-1': [
    [0, 1],
    [1, 2],
  ],
};

export type FormationKey = '4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '5-3-2';
export const FORMATION_COORDINATES = ALL_FORMATION_COORDINATES;
export const CHEMISTRY_LINKS = ALL_CHEMISTRY_LINKS;

interface CoachPitchViewProps {
  starters: FutPlayer[];
  format?: MatchFormatKey;
  formation: string;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: FutPlayer) => void;
  onSwapPositions: (playerA: FutPlayer, playerB: FutPlayer) => void;
}

export const CoachPitchView: React.FC<CoachPitchViewProps> = ({
  starters,
  format = '11v11',
  formation,
  selectedPlayerId,
  onSelectPlayer,
  onSwapPositions,
}) => {
  const [pitchLayout, setPitchLayout] = useState({ width: 340, height: 500 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 50 && height > 50) {
      setPitchLayout({ width, height });
    }
  };

  const slots = ALL_FORMATION_COORDINATES[formation] || ALL_FORMATION_COORDINATES['4-3-3'] || [];
  const links = ALL_CHEMISTRY_LINKS[formation] || [];
  const isFutsal = format === '5v5';

  // Dynamic card dimensions based on format starter count
  const cardWidth = format === '11v11' ? 66 : format === '8v8' ? 70 : 76;
  const cardHeight = format === '11v11' ? 94 : format === '8v8' ? 98 : 104;

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  const handleCardPress = (player: FutPlayer) => {
    triggerHaptic();
    if (!selectedPlayerId) {
      onSelectPlayer(player);
    } else if (selectedPlayerId === player.id) {
      onSelectPlayer(player);
    } else {
      const previousPlayer = starters.find((p) => p.id === selectedPlayerId);
      if (previousPlayer) {
        onSwapPositions(previousPlayer, player);
      } else {
        onSelectPlayer(player);
      }
    }
  };

  const teamOvr = useMemo(() => {
    if (!starters.length) return 80;
    const sum = starters.reduce((acc, p) => acc + (p.ovr || 75), 0);
    return Math.round(sum / starters.length);
  }, [starters]);

  return (
    <View style={styles.outerContainer}>
      {/* FUT Pitch HUD Top Bar */}
      <View style={styles.hudBar}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>NOTE MOYENNE</Text>
          <View style={styles.hudValueRow}>
            <Text style={styles.hudOvrVal}>{teamOvr}</Text>
            <Text style={styles.hudOvrSuffix}>GEN</Text>
          </View>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>COLLECTIF ÉQUIPE</Text>
          <View style={styles.hudValueRow}>
            <MaterialCommunityIcons name="star-shooting" size={14} color="#30D158" />
            <Text style={[styles.hudOvrVal, { color: '#30D158' }]}>
              {format === '11v11' ? '33/33' : format === '8v8' ? '24/24' : '15/15'}
            </Text>
          </View>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>FORMAT & SYSTÈME</Text>
          <Text style={styles.hudFormationVal}>{formation}</Text>
        </View>
      </View>

      {/* Vector Pitch Canvas */}
      <View style={styles.pitchCanvas} onLayout={onLayout}>
        <Svg
          width={pitchLayout.width}
          height={pitchLayout.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            {isFutsal ? (
              <LinearGradient id="futsalGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0B1A30" />
                <Stop offset="50%" stopColor="#0F2548" />
                <Stop offset="100%" stopColor="#081426" />
              </LinearGradient>
            ) : (
              <LinearGradient id="turfGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#103F22" />
                <Stop offset="50%" stopColor="#134C28" />
                <Stop offset="100%" stopColor="#0D351D" />
              </LinearGradient>
            )}
          </Defs>

          {/* Background Turf or Futsal Court */}
          <Rect
            x="0"
            y="0"
            width={pitchLayout.width}
            height={pitchLayout.height}
            fill={isFutsal ? 'url(#futsalGrad)' : 'url(#turfGrad)'}
          />

          {/* Alternating Stripes (for outdoor grass formats) */}
          {!isFutsal &&
            Array.from({ length: 10 }).map((_, i) => (
              <Rect
                key={i}
                x="0"
                y={(pitchLayout.height / 10) * i}
                width={pitchLayout.width}
                height={pitchLayout.height / 10}
                fill={i % 2 === 0 ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.05)'}
              />
            ))}

          {/* Outer Boundary Touchlines */}
          <Rect
            x="14"
            y="14"
            width={pitchLayout.width - 28}
            height={pitchLayout.height - 28}
            fill="none"
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.55)'}
            strokeWidth="1.5"
            rx={isFutsal ? 0 : 4}
          />

          {/* Center Halfway Line */}
          <Line
            x1="14"
            y1={pitchLayout.height / 2}
            x2={pitchLayout.width - 14}
            y2={pitchLayout.height / 2}
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.55)'}
            strokeWidth="1.5"
          />

          {/* Center Circle & Spot */}
          <Circle
            cx={pitchLayout.width / 2}
            cy={pitchLayout.height / 2}
            r="44"
            fill="none"
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.55)'}
            strokeWidth="1.5"
          />
          <Circle
            cx={pitchLayout.width / 2}
            cy={pitchLayout.height / 2}
            r="3"
            fill={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.85)'}
          />

          {/* Futsal Specific Markings (Semi-circle 6m D-arcs) */}
          {isFutsal ? (
            <>
              {/* Top 6m Futsal D-arc */}
              <Path
                d={`M ${pitchLayout.width * 0.28} 14 A 50 50 0 0 0 ${pitchLayout.width * 0.72} 14`}
                fill="none"
                stroke="#E5C07B"
                strokeWidth="1.5"
              />
              {/* Bottom 6m Futsal D-arc */}
              <Path
                d={`M ${pitchLayout.width * 0.28} ${pitchLayout.height - 14} A 50 50 0 0 1 ${pitchLayout.width * 0.72} ${pitchLayout.height - 14}`}
                fill="none"
                stroke="#E5C07B"
                strokeWidth="1.5"
              />
              {/* Futsal Penalty Spots */}
              <Circle cx={pitchLayout.width / 2} cy={pitchLayout.height * 0.18} r="3" fill="#E5C07B" />
              <Circle cx={pitchLayout.width / 2} cy={pitchLayout.height * 0.82} r="3" fill="#E5C07B" />
            </>
          ) : (
            /* Traditional Outdoor Boxes (11v11, 8v8, 4v4) */
            <>
              {/* Top Penalty Box */}
              <Rect
                x={pitchLayout.width * 0.25}
                y="14"
                width={pitchLayout.width * 0.5}
                height={pitchLayout.height * 0.16}
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.5"
              />
              {/* Top 6-yard Box */}
              <Rect
                x={pitchLayout.width * 0.37}
                y="14"
                width={pitchLayout.width * 0.26}
                height={pitchLayout.height * 0.065}
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.5"
              />
              {/* Bottom Penalty Box */}
              <Rect
                x={pitchLayout.width * 0.25}
                y={pitchLayout.height - 14 - pitchLayout.height * 0.16}
                width={pitchLayout.width * 0.5}
                height={pitchLayout.height * 0.16}
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.5"
              />
              {/* Bottom 6-yard Box */}
              <Rect
                x={pitchLayout.width * 0.37}
                y={pitchLayout.height - 14 - pitchLayout.height * 0.065}
                width={pitchLayout.width * 0.26}
                height={pitchLayout.height * 0.065}
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Dynamic Tactical Chemistry Links */}
          {links.map(([fromIdx, toIdx], lIdx) => {
            const slotFrom = slots[fromIdx];
            const slotTo = slots[toIdx];
            if (!slotFrom || !slotTo) return null;

            const x1 = slotFrom.x * pitchLayout.width;
            const y1 = slotFrom.y * pitchLayout.height;
            const x2 = slotTo.x * pitchLayout.width;
            const y2 = slotTo.y * pitchLayout.height;

            return (
              <Line
                key={`chem-${lIdx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isFutsal ? '#FFD700' : '#30D158'}
                strokeWidth="2"
                strokeDasharray="4,2"
                opacity={0.85}
              />
            );
          })}
        </Svg>

        {/* Starting Players FIFA Ultimate Team Cards */}
        {slots.map((slot, idx) => {
          const player = starters[idx];
          if (!player) return null;

          const isSelected = selectedPlayerId === player.id;
          const isTarget = selectedPlayerId !== null && !isSelected;

          const left = slot.x * pitchLayout.width - cardWidth / 2;
          const top = slot.y * pitchLayout.height - cardHeight / 2;

          return (
            <View
              key={player.id}
              style={[
                styles.playerCardSlot,
                {
                  left,
                  top,
                  width: cardWidth,
                  height: cardHeight,
                },
              ]}
            >
              <CoachFutPlayerCard
                player={player}
                size="pitch"
                isSelected={isSelected}
                isTarget={isTarget}
                onPress={() => handleCardPress(player)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 20,
    backgroundColor: '#0F0F14',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#16161E',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    color: '#8B8B9A',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hudValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  hudOvrVal: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: '-apple-system',
  },
  hudOvrSuffix: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  hudFormationVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  hudDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pitchCanvas: {
    width: '100%',
    height: 500,
    position: 'relative',
  },
  playerCardSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
