import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion/PressableSpring';
import {
  PLAYER_DARK,
  PLAYER_DARK_RADIUS,
} from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { Icon } from '../ui/Icon';
import type { PlayerShieldCardStats } from './PlayerShieldCard';

export type { PlayerShieldCardStats };

export type PlayerShieldCardCompactProps = {
  displayName: string;
  position?: string | null;
  photoUrl?: string | null;
  clubName?: string | null;
  stats?: PlayerShieldCardStats;
  /** Accent optionnel (ex. thème club) — sinon PlayerThemeContext. */
  accent?: string;
  accentSoft?: string;
  /** Meta libre sous le club (licence, statut…) — pas de score inventé. */
  metaLabel?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function positionShort(pos: string | undefined | null): string {
  if (!pos) return '—';
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

function CompactRating({ rating }: { rating: number | null | undefined }) {
  const size = 44;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const display = rating != null && rating > 0 ? rating.toFixed(1) : '—';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="compactRatingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#compactRatingGrad)"
          strokeWidth={stroke}
          fill={PLAYER_DARK.bgElevated}
        />
      </Svg>
      <View style={compactStyles.ratingCenter}>
        <ProDayText variant="caption" style={compactStyles.rating}>
          {display}
        </ProDayText>
      </View>
    </View>
  );
}

/** Variante compacte — listes mercato, équipe, comparaison. */
export function PlayerShieldCardCompact({
  displayName,
  position,
  photoUrl,
  clubName,
  stats,
  accent,
  accentSoft,
  metaLabel,
  onPress,
  style,
}: PlayerShieldCardCompactProps) {
  const playerTheme = usePlayerThemeColors();
  const accentColor = accent ?? playerTheme.accent;
  const softColor = accentSoft ?? playerTheme.accentSoft;
  const pos = positionShort(position ?? undefined);
  const matches =
    stats?.matches != null && stats.matches >= 0 ? String(stats.matches) : null;
  const meta =
    metaLabel?.trim() ||
    (matches != null ? `${matches} match${matches !== '1' ? 's' : ''}` : null);

  const card = useMemo(
    () => (
      <View style={[compactStyles.shell, style]}>
        <LinearGradient
          colors={PLAYER_DARK.shieldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={compactStyles.face}
        >
          <View
            style={[compactStyles.hexTop, { backgroundColor: softColor }]}
            pointerEvents="none"
          />
          <View style={compactStyles.photoWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={compactStyles.photo} resizeMode="cover" />
            ) : (
              <View style={[compactStyles.photo, compactStyles.photoPh]}>
                <ProDayText variant="caption" style={compactStyles.photoLetter}>
                  {displayName.charAt(0).toUpperCase()}
                </ProDayText>
              </View>
            )}
            <View style={[compactStyles.posBadge, { backgroundColor: accentColor }]}>
              <ProDayText variant="caption" style={compactStyles.posText}>
                {pos}
              </ProDayText>
            </View>
          </View>

          <View style={compactStyles.copy}>
            <ProDayText variant="section" style={compactStyles.name} numberOfLines={2}>
              {displayName}
            </ProDayText>
            <ProDayText variant="caption" style={compactStyles.club} numberOfLines={1}>
              {clubName?.trim() || 'Sans club'}
            </ProDayText>
            {meta ? (
              <ProDayText variant="caption" style={compactStyles.meta}>
                {meta}
              </ProDayText>
            ) : null}
          </View>

          <CompactRating rating={stats?.rating} />
        </LinearGradient>
      </View>
    ),
    [
      style,
      photoUrl,
      displayName,
      pos,
      clubName,
      meta,
      stats?.rating,
      accentColor,
      softColor,
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

const compactStyles = StyleSheet.create({
  shell: {
    borderRadius: PLAYER_DARK_RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
  hexTop: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 28,
    height: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  photoWrap: {
    width: 52,
    height: 60,
    borderRadius: 10,
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
    top: 4,
    right: 4,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  posText: {
    color: PLAYER_DARK.bg,
    fontWeight: '900',
    fontSize: 8,
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  name: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 15,
  },
  club: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  meta: {
    color: PLAYER_DARK.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  ratingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rating: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    fontSize: 13,
  },
});
