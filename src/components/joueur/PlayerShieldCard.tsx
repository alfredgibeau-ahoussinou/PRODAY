import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion/PressableSpring';
import { FUT18_TIER_THEME } from '../../theme/fut18PremiumPalette';
import Svg, { Path } from 'react-native-svg';

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

// Composant SVG de la forme de la carte FUT
function ShieldMask({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  // Shape proportion: width 100, height 140
  // Top horizontal line, top right curves down slightly, straight sides, bottom curves inward to a point.
  const w = width;
  const h = height;
  const path = `M0 12 Q ${w*0.5} -5, ${w} 12 L ${w} ${h*0.75} Q ${w*0.5} ${h*1.05}, 0 ${h*0.75} Z`;
  const innerPath = `M4 15 Q ${w*0.5} -2, ${w-4} 15 L ${w-4} ${h*0.74} Q ${w*0.5} ${h*1.01}, 4 ${h*0.74} Z`;

  return (
    <View style={{ width, height }}>
      {/* Background Frame */}
      <View style={StyleSheet.absoluteFill}>
         <Svg width={w} height={h}>
            <LinearGradient
              colors={FUT18_TIER_THEME.gold.frame}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* We draw the shape with standard Views to avoid complex SVG clipping if possible, but actually let's use standard masking or just simple borders with the FUT style */}
         </Svg>
      </View>
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
  const height = Math.round(width * 1.5);
  const pos = positionShort(position) || 'BU';
  
  // Theme Gold 
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

  // Le but ici est de recréer de manière bcp plus convaincante le design de la carte.
  // Notamment la découpe en biseau (shield) via des borders/border-radius pour coller au vrai style
  // et enlever l'aspect de boîte jaune.

  const content = (
    <View style={[styles.cardContainer, { width, height }, style]}>
      {/* Container principal de la carte (Fond or/jaune) */}
      <View style={chrome.wrapper}>
        
        {/* Le dégradé principal du cadre (Frame) */}
        <LinearGradient 
          colors={['#E5C370', '#8D6E2E', '#F6E294']}
          style={StyleSheet.absoluteFill} 
          start={{ x: 0.1, y: 0 }} 
          end={{ x: 0.9, y: 1 }} 
        />
        
        {/* Face interne */}
        <View style={chrome.innerFace}>
          <LinearGradient
            colors={['#493916', '#1E170A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Rayons du fond façon FUT */}
          <LinearGradient
            colors={['rgba(255, 230, 150, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <View style={styles.contentCol}>
            {/* En-tête (Note, Pos, Photo) */}
            <View style={styles.topRow}>
              {/* Colonne Note OVR + Info */}
              <View style={styles.ratingCol}>
                <ProDayText variant="section" style={[styles.ovr, { color: '#E8D293' }]}>
                  {ratingValue}
                </ProDayText>
                <ProDayText variant="caption" style={[styles.pos, { color: '#C8B06C' }]}>
                  {pos}
                </ProDayText>
                
                <View style={styles.dividerXSM} />

                {/* Nation (Drapeau) */}
                <View style={styles.flagIcon} />
                
                <View style={styles.dividerXSM} />

                {/* Club */}
                <View style={styles.clubIcon}>
                  {clubLogoUrl ? (
                    <Image source={{ uri: clubLogoUrl }} style={styles.clubLogoImg} />
                  ) : (
                    <View style={styles.clubFallback} />
                  )}
                </View>
              </View>

              {/* Photo du joueur */}
              <View style={styles.photoWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="contain" />
                ) : (
                  <Image source={require('../../../assets/generated/player-profile-showcase.png')} style={styles.photo} resizeMode="contain" />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(30, 23, 10, 0.8)', '#1E170A']}
                  style={styles.photoFade}
                  locations={[0.6, 0.9, 1]}
                />
              </View>
            </View>

            {/* Nom du Joueur */}
            <View style={nameStyles.plate}>
              <ProDayText variant="body" style={[nameStyles.text, { color: '#E8D293' }]} numberOfLines={1}>
                {displayName}
              </ProDayText>
              <View style={[nameStyles.line, { backgroundColor: '#C8B06C' }]} />
            </View>
            
            {/* Grille de stats */}
            <View style={styles.statsContainer}>
              <StatGrid stats={cardStats.slice(0, 3)} ink="#E8D293" />
              <View style={[styles.statDivider, { backgroundColor: '#C8B06C' }]} />
              <StatGrid stats={cardStats.slice(3, 6)} ink="#E8D293" />
            </View>
          </View>
        </View>
      </View>

      {/* Shapes SVG pour couper le bas en pointe */}
      <View style={styles.shieldCuts} pointerEvents="none">
         <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
           {/* Masque le coin bas-gauche */}
           <Path d="M 0,100 L 0,85 L 50,105 Z" fill="#121218" />
           {/* Masque le coin bas-droite */}
           <Path d="M 100,100 L 100,85 L 50,105 Z" fill="#121218" />
         </Svg>
      </View>

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

const chrome = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    padding: 3,
    backgroundColor: '#1E170A', // Fond noir derrière le dégradé
    overflow: 'hidden',
  },
  innerFace: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
});

const nameStyles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: -8, // Remonter légèrement le nom sur l'image
  },
  text: {
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 22,
    textAlign: 'center',
  },
  line: {
    height: 1,
    width: '85%',
    marginTop: 2,
    opacity: 0.6,
  },
});

const statStyles = StyleSheet.create({
  grid: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    width: '100%',
  },
  label: {
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'RobotoCondensed-Regular',
    width: 26,
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'RobotoCondensed-Bold',
    width: 22,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: '#F6E294',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  shieldCuts: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20, // Par dessus la carte
  },
  contentCol: { 
    flex: 1,
    paddingBottom: 15,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    flex: 1,
    zIndex: 5,
    position: 'relative',
  },
  ratingCol: {
    width: '32%',
    alignItems: 'center',
    paddingTop: 10,
    paddingLeft: 5,
    zIndex: 10,
  },
  ovr: {
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 42,
    fontFamily: 'RobotoCondensed-Bold',
  },
  pos: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: -5,
    fontFamily: 'RobotoCondensed-Regular',
  },
  dividerXSM: {
    width: '50%',
    height: 1,
    backgroundColor: 'rgba(232, 210, 147, 0.3)',
    marginVertical: 4,
  },
  flagIcon: {
    width: 28,
    height: 18,
    backgroundColor: '#fff', // Fake France/Brazil flag could go here
    opacity: 0.5,
  },
  clubIcon: {
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  clubFallback: {
    width: 24,
    height: 28,
    backgroundColor: '#E8D293',
    opacity: 0.3,
    borderRadius: 12,
  },
  photoWrap: {
    position: 'absolute',
    right: -5,
    bottom: -10, // Le bas de l'image
    width: '90%',
    height: '120%', 
    zIndex: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  statDivider: {
    width: 1,
    height: '75%',
    opacity: 0.5,
  },
});
