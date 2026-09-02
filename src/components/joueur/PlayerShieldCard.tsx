import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion/PressableSpring';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { Icon } from '../ui/Icon';

export type PlayerShieldCardStats = {
  matches?: number | null;
  notes?: number | null;
  goals?: number | null;
  assists?: number | null;
  rating?: number | null;
};

export type PlayerShieldCardProps = {
  displayName: string;
  position?: string | null;
  photoUrl?: string | null;
  clubName?: string | null;
  clubLogoUrl?: string | null;
  stats?: PlayerShieldCardStats;
  width?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function positionShort(pos: string | undefined | null): string | null {
  if (!pos?.trim()) return null;
  const p = pos
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/gardien|goal|gk|gb/.test(p)) return 'GK';
  if (/lateral\s*g|arriere\s*g|dg/.test(p)) return 'DG';
  if (/lateral\s*d|arriere\s*d|dd/.test(p)) return 'DD';
  if (/milieu\s*def|mdc|sentinelle/.test(p)) return 'MDC';
  if (/defens|arriere|cb|dc/.test(p)) return 'DC';
  if (/milieu\s*off|moc|meneur|10/.test(p)) return 'MOC';
  if (/milieu|mid|mc|relayeur/.test(p)) return 'MC';
  if (/ailier\s*g|mg|ag/.test(p)) return 'AG';
  if (/ailier\s*d|md|ad/.test(p)) return 'AD';
  if (/attaqu|buteur|striker|avant|bu|st/.test(p)) return 'ST';
  return pos.slice(0, 3).toUpperCase();
}

function GlassStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.glassStat}>
      <ProDayText variant="section" style={styles.statValue}>
        {value}
      </ProDayText>
      <ProDayText variant="caption" style={styles.statLabel}>
        {label}
      </ProDayText>
    </View>
  );
}

export function PlayerShieldCard({
  displayName,
  position,
  photoUrl,
  clubName,
  clubLogoUrl,
  stats,
  width = 280,
  onPress,
  style,
}: PlayerShieldCardProps) {
  // Ratio plus moderne et élancé (1.35 ou 1.4)
  const height = Math.round(width * 1.35);
  const pos = positionShort(position) || 'PRO';
  
  const ratingValue = stats?.rating != null ? Math.round(stats.rating * 10) : 85;
  const matches = stats?.matches || 0;
  const ratingNote = stats?.notes ? stats.notes.toFixed(1) : '—';
  const ga = (stats?.goals || 0) + (stats?.assists || 0);

  const content = (
    <View style={[styles.cardContainer, { width, height }, style]}>
      {/* Background Image full cover */}
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Image 
          source={require('../../../assets/generated/player-profile-showcase.png')} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
        />
      )}

      {/* Modern gradient overlays to ensure text readability */}
      <LinearGradient
        colors={['rgba(15, 15, 20, 0.7)', 'transparent', 'transparent']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 1]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(15, 15, 20, 0.6)', 'rgba(15, 15, 20, 1)']}
        style={StyleSheet.absoluteFill}
        locations={[0.4, 0.75, 1]}
      />

      {/* Inner Content Padding */}
      <View style={styles.innerContent}>
        
        {/* TOP BAR: Glass badges */}
        <View style={styles.topBar}>
          <View style={styles.glassBadge}>
            <ProDayText variant="section" style={styles.ovrText}>{ratingValue}</ProDayText>
            <View style={styles.badgeDivider} />
            <ProDayText variant="caption" style={styles.posText}>{pos}</ProDayText>
          </View>
          
          <View style={styles.glassBadgeCircle}>
            {clubLogoUrl ? (
              <Image source={{ uri: clubLogoUrl }} style={styles.clubLogoImg} />
            ) : (
              <Icon name="shield" size={14} color="#FFF" variant="outline" />
            )}
          </View>
        </View>

        <View style={styles.spacer} />

        {/* BOTTOM SECTION: Info & Stats */}
        <View style={styles.bottomSection}>
          
          <View style={styles.nameContainer}>
            <ProDayText variant="title" style={styles.nameText} numberOfLines={1}>
              {displayName}
            </ProDayText>
            <ProDayText variant="caption" style={styles.clubName} numberOfLines={1}>
              {clubName || 'Agent Libre'}
            </ProDayText>
          </View>

          {/* Glass Panel Stats */}
          <View style={styles.glassPanel}>
            <GlassStat label="Matchs" value={matches} />
            <View style={styles.panelDivider} />
            <GlassStat label="Note" value={ratingNote} />
            <View style={styles.panelDivider} />
            <GlassStat label="G+A" value={ga} />
          </View>

        </View>

      </View>
      
      {/* Subtle border overlay to emphasize the rounded corners */}
      <View style={styles.borderOverlay} pointerEvents="none" />
    </View>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.97} haptic>
        {content}
      </PressableSpring>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 32,
    backgroundColor: '#0F0F14',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  innerContent: {
    flex: 1,
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  ovrText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  badgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  posText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  glassBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clubLogoImg: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    gap: 12,
  },
  nameContainer: {
    gap: 2,
  },
  nameText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  clubName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  glassPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glassStat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  panelDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
