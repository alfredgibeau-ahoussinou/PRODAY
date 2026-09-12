import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export type FutPlayerPosition =
  | 'GK'
  | 'LB'
  | 'CB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'RW'
  | 'LW'
  | 'ST';

export interface FutPlayer {
  id: string;
  num: number;
  name: string;
  pos: FutPlayerPosition;
  ovr: number; // e.g. 88
  rating: number; // e.g. 7.8/10
  role: 'starter' | 'sub' | 'unselected';
  rsvp: 'present' | 'absent' | 'pending' | 'injured';
  form: 'peak' | 'good' | 'tired' | 'injured';
  fatigueRisk: boolean;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

interface CoachFutPlayerCardProps {
  player: FutPlayer;
  size?: 'pitch' | 'bench' | 'detail';
  isSelected?: boolean;
  isTarget?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const CoachFutPlayerCard: React.FC<CoachFutPlayerCardProps> = ({
  player,
  size = 'pitch',
  isSelected = false,
  isTarget = false,
  onPress,
  onLongPress,
}) => {
  const isBench = size === 'bench';

  // Form glow indicator styling
  const getFormColor = () => {
    switch (player.form) {
      case 'peak':
        return '#30D158'; // Emerald neon
      case 'good':
        return '#0A84FF'; // Royal blue
      case 'tired':
        return '#FF9F0A'; // Amber alert
      case 'injured':
        return '#FF453A'; // Crimson red
      default:
        return '#30D158';
    }
  };

  const formColor = getFormColor();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.cardContainer,
        isBench ? styles.cardBench : styles.cardPitch,
        isSelected && styles.cardSelected,
        isTarget && styles.cardTarget,
      ]}
    >
      {/* Outer Metallic Bevel Border */}
      <View
        style={[
          styles.innerCard,
          isBench ? styles.innerCardBench : styles.innerCardPitch,
          isSelected && { borderColor: '#FFD700', borderWidth: 1.5 },
          isTarget && { borderColor: '#30D158', borderWidth: 1.5 },
        ]}
      >
        {/* Top Header: OVR + Position Badge + Form Glow Dot */}
        <View style={styles.cardHeader}>
          <View style={styles.ovrWrap}>
            <Text style={[styles.ovrText, isBench && styles.ovrTextBench]}>{player.ovr}</Text>
            <Text style={[styles.posText, isBench && styles.posTextBench]}>{player.pos}</Text>
          </View>

          {/* Form Wellness Halo Indicator */}
          <View style={[styles.formGlowBadge, { backgroundColor: formColor }]}>
            <View style={[styles.formGlowDot, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>

        {/* Center: Player Silhouette / Jersey Number */}
        <View style={[styles.avatarBox, isBench && styles.avatarBoxBench]}>
          <View style={[styles.jerseyCircle, { borderColor: formColor }]}>
            <Text style={[styles.jerseyNum, isBench && styles.jerseyNumBench]}>#{player.num}</Text>
          </View>
          {player.fatigueRisk && (
            <View style={styles.fatigueBadge}>
              <Feather name="alert-triangle" size={8} color="#FF9F0A" />
            </View>
          )}
        </View>

        {/* Bottom Banner: Player Name */}
        <View style={[styles.nameBanner, isBench && styles.nameBannerBench]}>
          <Text
            style={[styles.nameText, isBench && styles.nameTextBench]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {player.name}
          </Text>
        </View>

        {/* Mini Stats Matrix (for Pitch Cards) */}
        {!isBench && (
          <View style={styles.statsStrip}>
            <Text style={styles.statMini}>
              {player.pac} <Text style={styles.statLabel}>VIT</Text>
            </Text>
            <Text style={styles.statMini}>
              {player.pas} <Text style={styles.statLabel}>PAS</Text>
            </Text>
            <Text style={styles.statMini}>
              {player.def} <Text style={styles.statLabel}>DEF</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Selected Pulse Indicator Bar */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <MaterialCommunityIcons name="swap-horizontal-bold" size={10} color="#000000" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardPitch: {
    width: 66,
    height: 94,
  },
  cardBench: {
    width: 56,
    height: 80,
  },
  cardSelected: {
    transform: [{ scale: 1.08 }],
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardTarget: {
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      ios: {
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  innerCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#16161C',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#C5A059', // FUT Gold Metallic
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  innerCardPitch: {
    borderRadius: 12,
  },
  innerCardBench: {
    borderRadius: 10,
    borderColor: 'rgba(197, 160, 89, 0.6)',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ovrWrap: {
    alignItems: 'center',
  },
  ovrText: {
    color: '#FFD700', // Gold numeral
    fontSize: 13,
    fontWeight: '900',
    fontFamily: '-apple-system',
    letterSpacing: -0.5,
    lineHeight: 14,
  },
  ovrTextBench: {
    fontSize: 11,
    lineHeight: 12,
  },
  posText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  posTextBench: {
    fontSize: 7,
  },
  formGlowBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
      },
    }),
  },
  formGlowDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
  },
  avatarBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 1,
  },
  avatarBoxBench: {
    marginVertical: 0,
  },
  jerseyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E26',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  jerseyNumBench: {
    fontSize: 9,
  },
  fatigueBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#1C1C22',
    borderRadius: 6,
    padding: 1,
    borderWidth: 0.5,
    borderColor: '#FF9F0A',
  },
  nameBanner: {
    width: '100%',
    backgroundColor: 'rgba(28, 28, 36, 0.9)',
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 215, 0, 0.3)',
  },
  nameBannerBench: {
    paddingVertical: 1.5,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  nameTextBench: {
    fontSize: 7.5,
  },
  statsStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statMini: {
    color: '#FFFFFF',
    fontSize: 6.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  statLabel: {
    color: '#8B8B9A',
    fontSize: 5.5,
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#000000',
  },
});
