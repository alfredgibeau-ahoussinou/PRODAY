import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion/PressableSpring';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
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

function StatRing({
  label,
  value,
  color,
  size = 54,
}: {
  label: string;
  value: string;
  color: string;
  size?: number;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hasValue = value !== '—';

  return (
    <View style={[ringStyles.wrap, { width: size, height: size + 18 }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="none"
        />
        {hasValue ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * 0.72} ${c}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <View style={ringStyles.center}>
        <ProDayText variant="caption" style={ringStyles.value}>
          {value}
        </ProDayText>
      </View>
      <ProDayText variant="caption" style={ringStyles.label} numberOfLines={2}>
        {label}
      </ProDayText>
    </View>
  );
}

function RatingCircle({ rating, size = 72 }: { rating: number | null | undefined; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const display = rating != null && rating > 0 ? rating.toFixed(1) : '—';

  return (
    <View style={[ratingStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ratingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            {PLAYER_DARK.ratingRing.map((c, i) => (
              <Stop
                key={c}
                offset={`${(i / (PLAYER_DARK.ratingRing.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ratingGrad)"
          strokeWidth={stroke}
          fill="rgba(10,10,15,0.85)"
        />
      </Svg>
      <View style={ratingStyles.center}>
        <ProDayText variant="section" style={ratingStyles.value}>
          {display}
        </ProDayText>
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
  width = 280,
  onPress,
  style,
}: PlayerShieldCardProps) {
  const height = Math.round(width * 1.62);
  const pos = positionShort(position);
  const goals = stats?.goals ?? null;
  const assists = stats?.assists ?? null;
  const ga =
    goals != null || assists != null
      ? String((goals ?? 0) + (assists ?? 0))
      : '—';
  const matches =
    stats?.matches != null && stats.matches > 0 ? String(stats.matches) : stats?.matches === 0 ? '0' : '—';
  const notes =
    stats?.notes != null && stats.notes > 0 ? stats.notes.toFixed(1) : stats?.notes === 0 ? '0' : '—';

  const card = useMemo(
    () => (
      <View style={[styles.shell, { width, height }, style]}>
        <LinearGradient
          colors={PLAYER_DARK.shieldGradient}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.face}
        >
          <View style={styles.watermark} pointerEvents="none">
            <Icon name="star-four-points" size={120} color="rgba(255,255,255,0.04)" variant="outline" />
          </View>

          <View style={styles.hexTop} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0,230,118,0.12)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.photoZone}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={[PLAYER_DARK.accent, '#0D9488', '#121218']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.photo, styles.photoPh]}
              >
                <ProDayText variant="title" style={styles.photoLetter}>
                  {displayName.charAt(0).toUpperCase()}
                </ProDayText>
              </LinearGradient>
            )}
            {pos ? (
              <View style={styles.posBadge}>
                <ProDayText variant="caption" style={styles.posText}>
                  {pos}
                </ProDayText>
              </View>
            ) : null}
          </View>

          <ProDayText variant="section" style={styles.name} numberOfLines={2}>
            {displayName}
          </ProDayText>

          <View style={styles.clubPill}>
            {clubLogoUrl ? (
              <Image source={{ uri: clubLogoUrl }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPh}>
                <Icon name="shield" size={12} color={PLAYER_DARK.bg} variant="filled" />
              </View>
            )}
            <ProDayText variant="caption" style={styles.clubText} numberOfLines={2}>
              {clubName?.trim() || 'Sans club'}
            </ProDayText>
          </View>

          <View style={styles.ringsRow}>
            <StatRing label="Matchs" value={matches} color={PLAYER_DARK.statBlue} />
            <StatRing label="Notes" value={notes} color={PLAYER_DARK.statYellow} />
            <StatRing label="G+A" value={ga} color={PLAYER_DARK.statGreen} />
          </View>

          <View style={styles.ratingWrap}>
            <RatingCircle rating={stats?.rating} size={Math.round(width * 0.32)} />
          </View>
        </LinearGradient>
      </View>
    ),
    [
      width,
      height,
      style,
      photoUrl,
      displayName,
      pos,
      clubName,
      clubLogoUrl,
      matches,
      notes,
      ga,
      stats?.rating,
    ],
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
        {card}
      </PressableSpring>
    );
  }
  return card;
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 13,
  },
  label: {
    color: PLAYER_DARK.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
  },
});

const ratingStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.5,
  },
});

const styles = StyleSheet.create({
  shell: {
    borderRadius: PLAYER_DARK_RADIUS.shield,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PLAYER_DARK.borderStrong,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  face: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 14,
    alignItems: 'center',
    gap: spacing.sm,
  },
  hexTop: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: 14,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: 40,
    opacity: 0.9,
  },
  photoZone: {
    width: '62%',
    aspectRatio: 0.88,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surfaceRaised,
  },
  photo: { width: '100%', height: '100%' },
  photoPh: { alignItems: 'center', justifyContent: 'center' },
  photoLetter: { color: PLAYER_DARK.text, fontWeight: '900' },
  posBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PLAYER_DARK.accent,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  posText: {
    color: PLAYER_DARK.bg,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  name: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  clubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '92%',
  },
  clubLogo: { width: 18, height: 18, borderRadius: 9 },
  clubLogoPh: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PLAYER_DARK.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubText: {
    color: PLAYER_DARK.bg,
    fontWeight: '700',
    fontSize: 11,
    flexShrink: 1,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  ratingWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    alignItems: 'center',
    paddingBottom: 2,
  },
});
