import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
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

export type FormationKey = '4-3-3' | '4-2-3-1' | '4-4-2' | '3-5-2' | '5-3-2';

interface PitchSlot {
  x: number; // 0 to 1
  y: number; // 0 to 1 (0 = top / opp goal, 1 = bottom / our GK)
  defaultPos: string;
}

// Normalized formation coordinates (GK at bottom ~0.88, Attackers at top ~0.16)
export const FORMATION_COORDINATES: Record<FormationKey, PitchSlot[]> = {
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
};

// Chemistry Links between slots for each formation
export const CHEMISTRY_LINKS: Record<FormationKey, [number, number][]> = {
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
};

interface CoachPitchViewProps {
  starters: FutPlayer[];
  formation: FormationKey;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: FutPlayer) => void;
  onSwapPositions: (playerA: FutPlayer, playerB: FutPlayer) => void;
}

export const CoachPitchView: React.FC<CoachPitchViewProps> = ({
  starters,
  formation,
  selectedPlayerId,
  onSelectPlayer,
  onSwapPositions,
}) => {
  const [pitchLayout, setPitchLayout] = useState({ width: 340, height: 520 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 50 && height > 50) {
      setPitchLayout({ width, height });
    }
  };

  const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3'];
  const links = CHEMISTRY_LINKS[formation] || CHEMISTRY_LINKS['4-3-3'];

  // Card dimensions on pitch
  const cardWidth = 66;
  const cardHeight = 94;

  // Safe Haptic feedback trigger
  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore on unsupported
    }
  };

  const handleCardPress = (player: FutPlayer) => {
    triggerHaptic();

    if (!selectedPlayerId) {
      // First selection
      onSelectPlayer(player);
    } else if (selectedPlayerId === player.id) {
      // Deselect
      onSelectPlayer(player);
    } else {
      // Swap with previously selected player
      const previousPlayer = starters.find((p) => p.id === selectedPlayerId);
      if (previousPlayer) {
        onSwapPositions(previousPlayer, player);
      } else {
        onSelectPlayer(player);
      }
    }
  };

  // Compute Chemistry & Team OVR
  const teamOvr = useMemo(() => {
    if (!starters.length) return 80;
    const sum = starters.reduce((acc, p) => acc + (p.ovr || 75), 0);
    return Math.round(sum / starters.length);
  }, [starters]);

  return (
    <View style={styles.outerContainer}>
      {/* Pitch Top HUD Banner (FIFA Ultimate Team Style) */}
      <View style={styles.hudBar}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>NOTE GLOBALE</Text>
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
            <Text style={[styles.hudOvrVal, { color: '#30D158' }]}>33/33</Text>
          </View>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>FORMATION</Text>
          <Text style={styles.hudFormationVal}>{formation}</Text>
        </View>
      </View>

      {/* Realistic Pitch View Container */}
      <View style={styles.pitchCanvas} onLayout={onLayout}>
        {/* Vector Pitch Grass Turf & Markings */}
        <Svg
          width={pitchLayout.width}
          height={pitchLayout.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#103F22" />
              <Stop offset="50%" stopColor="#134C28" />
              <Stop offset="100%" stopColor="#0D351D" />
            </LinearGradient>
          </Defs>

          {/* Grass Background */}
          <Rect
            x="0"
            y="0"
            width={pitchLayout.width}
            height={pitchLayout.height}
            fill="url(#pitchGrad)"
          />

          {/* Alternating Lawn Stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
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
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.5"
            rx="4"
          />

          {/* Center Line */}
          <Line
            x1="14"
            y1={pitchLayout.height / 2}
            x2={pitchLayout.width - 14}
            y2={pitchLayout.height / 2}
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.5"
          />

          {/* Center Circle & Spot */}
          <Circle
            cx={pitchLayout.width / 2}
            cy={pitchLayout.height / 2}
            r="44"
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.5"
          />
          <Circle
            cx={pitchLayout.width / 2}
            cy={pitchLayout.height / 2}
            r="3"
            fill="rgba(255, 255, 255, 0.85)"
          />

          {/* Top Penalty Box (Opponent End) */}
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
          {/* Top Penalty Arc */}
          <Path
            d={`M ${pitchLayout.width * 0.42} ${pitchLayout.height * 0.16 + 14} A 28 28 0 0 0 ${pitchLayout.width * 0.58} ${pitchLayout.height * 0.16 + 14}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.5"
          />

          {/* Bottom Penalty Box (Our Goal End) */}
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
          {/* Bottom Penalty Arc */}
          <Path
            d={`M ${pitchLayout.width * 0.42} ${pitchLayout.height - 14 - pitchLayout.height * 0.16} A 28 28 0 0 1 ${pitchLayout.width * 0.58} ${pitchLayout.height - 14 - pitchLayout.height * 0.16}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.5"
          />

          {/* Corner Arcs */}
          <Path d="M 14 26 A 12 12 0 0 0 26 14" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
          <Path d={`M ${pitchLayout.width - 26} 14 A 12 12 0 0 0 ${pitchLayout.width - 14} 26`} fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
          <Path d={`M 14 ${pitchLayout.height - 26} A 12 12 0 0 1 26 ${pitchLayout.height - 14}`} fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />
          <Path d={`M ${pitchLayout.width - 26} ${pitchLayout.height - 14} A 12 12 0 0 1 ${pitchLayout.width - 14} ${pitchLayout.height - 26}`} fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" />

          {/* Dynamic Tactical Chemistry Links (Neon Green Links) */}
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
                stroke="#30D158" // Neon Emerald Green Chemistry
                strokeWidth="2"
                strokeDasharray="4,2"
                opacity={0.8}
              />
            );
          })}
        </Svg>

        {/* 11 Starting XI FIFA Ultimate Team Cards Positioned on the Pitch */}
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
    borderColor: 'rgba(212, 175, 55, 0.25)', // Subtle gold contour
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
    color: '#FFD700', // Gold
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
    height: 520,
    position: 'relative',
  },
  playerCardSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
