import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion/PressableSpring';
import { FUT18_TIER_THEME } from '../../theme/fut18PremiumPalette';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';

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

function StatGrid({
  stats,
  ink,
}: {
  stats: Array<{ l: string; v: string | number }>;
  ink: string;
}) {
  return (
    <View style={statStyles.grid}>
      {stats.map((s, idx) => (
        <View key={idx} style={statStyles.row}>
          <ProDayText variant="caption" style={[statStyles.value, { color: ink }]}>
            {s.v}
          </ProDayText>
          <ProDayText variant="caption" style={[statStyles.label, { color: ink }]}>
            {s.l}
          </ProDayText>
        </View>
      ))}
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
  width = 240,
  onPress,
  style,
}: PlayerShieldCardProps) {
  const height = Math.round(width * 1.45);
  const pos = positionShort(position) || 'BU';
  
  // Choose Gold tier as the default visual for the player profile card to match the premium FIFA look
  const theme = FUT18_TIER_THEME.gold;
  const ink = theme.ink;
  
  const ratingValue = stats?.rating != null ? Math.round(stats.rating * 10) : 85;

  const cardStats = [
    { l: 'MAT', v: stats?.matches || 0 },
    { l: 'BUT', v: stats?.goals || 0 },
    { l: 'PAS', v: stats?.assists || 0 },
    { l: 'NOT', v: stats?.notes ? stats.notes.toFixed(1) : '—' },
    { l: 'G+A', v: (stats?.goals || 0) + (stats?.assists || 0) },
    { l: 'PHY', v: ratingValue - 3 },
  ];

  const content = (
    <View style={[styles.cardContainer, { width, height }, style]}>
      <View style={chrome.wrapper}>
        <LinearGradient colors={theme.frame} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        
        <View style={chrome.innerFace}>
          <LinearGradient
            colors={theme.face}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'transparent', 'rgba(255,255,255,0.1)']}
            style={chrome.shine}
            locations={[0, 0.4, 1]}
            start={{ x: -0.5, y: -0.5 }}
            end={{ x: 1.5, y: 1.5 }}
          />
          
          <View style={styles.col}>
            <View style={styles.topRow}>
              <View style={styles.ratingCol}>
                <ProDayText variant="section" style={[styles.ovr, { color: ink }]}>
                  {ratingValue}
                </ProDayText>
                <ProDayText variant="caption" style={[styles.pos, { color: ink }]}>
                  {pos}
                </ProDayText>
                
                <View style={styles.flagIcon} />
                <View style={styles.clubIcon}>
                  {clubLogoUrl && <Image source={{ uri: clubLogoUrl }} style={styles.clubLogoImg} />}
                </View>
              </View>
              <View style={styles.photoWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]} />
                )}
              </View>
            </View>
            <View style={nameStyles.plate}>
              <ProDayText variant="body" style={[nameStyles.text, { color: ink }]} numberOfLines={1}>
                {displayName}
              </ProDayText>
              <View style={[nameStyles.line, { backgroundColor: theme.inkMuted }]} />
            </View>
            
            <View style={styles.statsContainer}>
              <StatGrid stats={cardStats.slice(0, 3)} ink={ink} />
              <View style={[styles.statDivider, { backgroundColor: theme.inkMuted }]} />
              <StatGrid stats={cardStats.slice(3, 6)} ink={ink} />
            </View>
          </View>

        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
        {content}
      </PressableSpring>
    );
  }
  return content;
}

const chrome = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
    padding: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  innerFace: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 33,
    borderBottomRightRadius: 33,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
  },
});

const nameStyles = StyleSheet.create({
  plate: {
    marginTop: -8,
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 20,
    textAlign: 'center',
  },
  line: {
    height: 1,
    width: '85%',
    marginTop: 2,
    opacity: 0.4,
  },
});

const statStyles = StyleSheet.create({
  grid: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    opacity: 0.8,
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'RobotoCondensed-Regular',
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'RobotoCondensed-Bold',
  },
});

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    backgroundColor: 'transparent',
  },
  col: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    height: '55%',
    zIndex: 5,
  },
  ratingCol: {
    width: '35%',
    alignItems: 'center',
    paddingTop: 4,
    gap: 2,
  },
  ovr: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
    fontFamily: 'RobotoCondensed-Bold',
  },
  pos: {
    fontWeight: '500',
    fontSize: 14,
    marginTop: -4,
    fontFamily: 'RobotoCondensed-Regular',
  },
  flagIcon: {
    width: 26,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  clubIcon: {
    width: 24,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoWrap: {
    width: '75%',
    height: '110%',
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  statDivider: {
    width: 1,
    height: '80%',
    opacity: 0.3,
  },
});
