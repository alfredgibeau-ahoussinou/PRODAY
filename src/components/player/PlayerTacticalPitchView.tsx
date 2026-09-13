import React from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';

export interface TacticalPitchPlayer {
  id: string;
  name: string;
  number: number;
  pos: string;
  x: number; // 0-100%
  y: number; // 0-100%
  isUser: boolean;
}

interface PlayerTacticalPitchViewProps {
  formation?: string;
  players: TacticalPitchPlayer[];
  benchPlayers?: { id: string; name: string; number: number; pos: string }[];
  coachDirective?: string;
  onSelectPlayer?: (player: TacticalPitchPlayer) => void;
}

export const PlayerTacticalPitchView: React.FC<PlayerTacticalPitchViewProps> = ({
  formation = '4-3-3 Attaque',
  players,
  benchPlayers = [],
  coachDirective = 'Pressing haut dès la perte du ballon. Transition rapide vers les ailiers.',
  onSelectPlayer,
}) => {
  return (
    <View style={styles.container}>
      {/* Formation Header */}
      <View style={styles.formationHeader}>
        <View style={styles.formationBadge}>
          <Ionicons name="git-network" size={14} color="#30D158" />
          <Text style={styles.formationText}>{formation}</Text>
        </View>
        <Text style={styles.lineupStatus}>Composition Validée par le Coach</Text>
      </View>

      {/* Vector Pitch Canvas */}
      <View style={styles.pitchWrapper}>
        <Svg width="100%" height={320} viewBox="0 0 300 400" style={styles.pitchSvg}>
          {/* Pitch Grass Surface */}
          <Rect x="0" y="0" width="300" height="400" fill="#143420" rx="16" />
          {/* Outer Chalk Boundary */}
          <Rect x="15" y="15" width="270" height="370" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Halfway Line */}
          <Line x1="15" y1="200" x2="285" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Center Circle */}
          <Circle cx="150" cy="200" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <Circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.4)" />
          {/* Top Penalty Area */}
          <Rect x="75" y="15" width="150" height="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <Rect x="110" y="15" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Bottom Penalty Area */}
          <Rect x="75" y="315" width="150" height="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <Rect x="110" y="360" width="80" height="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </Svg>

        {/* Tactical Player Tokens Overlay */}
        {players.map((p) => {
          const isUser = p.isUser;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              onPress={() => {
                prodayHaptics.impactLight();
                onSelectPlayer?.(p);
              }}
              style={[
                styles.playerToken,
                { left: `${p.x}%`, top: `${p.y}%` },
                isUser && styles.userTokenHighlight,
              ]}
            >
              <View style={[styles.tokenCircle, isUser && styles.userCircle]}>
                <Text style={[styles.tokenNum, isUser && styles.userNum]}>{p.number}</Text>
              </View>
              <View style={[styles.namePill, isUser && styles.userNamePill]}>
                <Text style={[styles.tokenName, isUser && styles.userNameText]} numberOfLines={1}>
                  {p.name.split(' ').pop()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Coach Directives Note */}
      <View style={styles.directiveCard}>
        <View style={styles.directiveTitleRow}>
          <Ionicons name="clipboard" size={15} color="#FFD700" />
          <Text style={styles.directiveTitle}>Consignes Causerie du Staff</Text>
        </View>
        <Text style={styles.directiveContent}>{coachDirective}</Text>
      </View>

      {/* Bench Substitutes Horizontal Rail */}
      {benchPlayers.length > 0 ? (
        <View style={styles.benchSection}>
          <Text style={styles.benchTitle}>Remplaçants & Disponibles ({benchPlayers.length})</Text>
          <View style={styles.benchRail}>
            {benchPlayers.map((b) => (
              <View key={b.id} style={styles.benchPill}>
                <Text style={styles.benchNum}>{b.number}</Text>
                <Text style={styles.benchName}>{b.name.split(' ').pop()}</Text>
                <Text style={styles.benchPos}>{b.pos}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 16,
  },
  formationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  formationText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
    color: '#30D158',
  },
  lineupStatus: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
  },
  pitchWrapper: {
    position: 'relative',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pitchSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  playerToken: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  tokenCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenNum: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  namePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 2,
    maxWidth: 60,
  },
  tokenName: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  // User highlight
  userTokenHighlight: {
    zIndex: 10,
  },
  userCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#30D158',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  userNum: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },
  userNamePill: {
    backgroundColor: '#30D158',
  },
  userNameText: {
    color: '#000000',
    fontWeight: '900',
  },
  directiveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginTop: 14,
  },
  directiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  directiveTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  directiveContent: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  benchSection: {
    marginTop: 14,
  },
  benchTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  benchRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  benchNum: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  benchName: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  benchPos: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 8,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
