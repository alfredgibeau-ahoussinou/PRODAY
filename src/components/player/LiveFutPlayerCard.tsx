import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlayerShieldCard } from '../joueur/PlayerShieldCard';

export type FutCardTier = 'gold' | 'special' | 'silver' | 'bronze';

export interface LiveFutCardData {
  id: string;
  name: string;
  pos: string; // e.g. 'BU', 'MOC', 'DC', 'G'
  ovr: number; // e.g. 88
  tier?: FutCardTier;
  clubName?: string;
  countryCode?: string;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  strongFoot?: string;
  heightCm?: number;
  weightKg?: number;
}

interface LiveFutPlayerCardProps {
  player: LiveFutCardData;
  size?: 'normal' | 'compact' | 'hero';
  onPress?: () => void;
  showFlipBio?: boolean;
}

/**
 * LiveFutPlayerCard — Affiche la même carte officielle ProDay que la page Compte (PlayerShieldCard).
 */
export const LiveFutPlayerCard: React.FC<LiveFutPlayerCardProps> = ({
  player,
  size = 'hero',
  onPress,
}) => {
  const width = size === 'compact' ? 180 : size === 'normal' ? 220 : 250;

  const stats = {
    matches: player.matchesPlayed ?? 18,
    notes: player.ovr || 85,
    goals: player.goals ?? 14,
    assists: player.assists ?? 8,
    rating: player.ovr || 85,
  };

  return (
    <View style={styles.wrapper}>
      <PlayerShieldCard
        displayName={player.name}
        position={player.pos}
        clubName={player.clubName || 'FC ProDay'}
        stats={stats}
        width={width}
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
