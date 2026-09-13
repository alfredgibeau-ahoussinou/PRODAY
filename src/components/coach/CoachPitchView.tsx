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

export {
  MatchFormatKey,
  TacticalCategory,
  PitchSlot,
  TacticalSystem,
  MATCH_FORMATS_CONFIG,
  ALL_FORMATION_COORDINATES,
  ALL_CHEMISTRY_LINKS,
  ALL_TACTICAL_SYSTEMS,
  TACTICAL_SYSTEMS_BY_ID,
  DEFENSE_4_SYSTEMS,
  DEFENSE_3_5_SYSTEMS,
  HISTORICAL_HYBRID_SYSTEMS,
  SMALL_SIDED_SYSTEMS,
} from '../../constants/tacticalMatrix';
import {
  MatchFormatKey,
  MATCH_FORMATS_CONFIG,
  ALL_FORMATION_COORDINATES,
  ALL_CHEMISTRY_LINKS,
} from '../../constants/tacticalMatrix';

export type FormationKey = string;
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
  const [pitchLayout, setPitchLayout] = useState({ width: 340, height: 410 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 50 && height > 50) {
      setPitchLayout({ width, height });
    }
  };

  const slots = ALL_FORMATION_COORDINATES[formation] || ALL_FORMATION_COORDINATES['4-3-3'] || [];
  const links = ALL_CHEMISTRY_LINKS[formation] || [];
  const isFutsal = format === 'futsal' || MATCH_FORMATS_CONFIG[format]?.isFutsal === true;

  // Dynamic card dimensions based on format starter count (compact 11v11 ensures full pitch visibility)
  const cardWidth = format === '11v11' ? 62 : format === '8v8' ? 68 : 74;
  const cardHeight = format === '11v11' ? 84 : format === '8v8' ? 92 : 100;

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
              {format === '11v11'
                ? '33/33'
                : format === '8v8'
                ? '24/24'
                : format === '5v5' || format === 'futsal'
                ? '15/15'
                : format === '4v4'
                ? '12/12'
                : '9/9'}
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
    paddingVertical: 6,
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
    height: 410,
    position: 'relative',
  },
  playerCardSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
