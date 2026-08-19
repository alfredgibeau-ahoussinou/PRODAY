import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import { FUT18_PREMIUM } from '../../theme/fut18PremiumPalette';
import type { User } from '../../models/User';
import type {
  JoueurAgeGroup,
  JoueurGenderVisual,
} from '../../utils/joueurExperienceTheme';
import {
  resolveJoueurAgeGroup,
  resolveJoueurGenderVisual,
} from '../../utils/joueurExperienceTheme';
import {
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_AGE_MOODS,
} from '../../content/joueurPageIdentity';

export type PlayerCardTrend = 'up' | 'down' | 'stable';

export type PlayerCardPosition =
  | 'GK'
  | 'DC'
  | 'DG'
  | 'DD'
  | 'MDC'
  | 'MC'
  | 'MOC'
  | 'MG'
  | 'MD'
  | 'AG'
  | 'AD'
  | 'BU'
  | 'ATT'
  | 'DEF'
  | 'MID'
  | string;

export interface PlayerCardStats {
  goals: number;
  assists: number;
  matches: number;
  avgRating?: number;
}

export interface PlayerCardProps {
  player: User;
  stats?: PlayerCardStats;
  trend?: PlayerCardTrend;
  formPercent?: number;
  clubColors?: { primary: string; secondary: string };
  compact?: boolean;
  onPress?: () => void;
}

interface CardTheme {
  frame: [string, string, string];
  face: [string, string];
  ink: string;
  inkMuted: string;
  rim: string;
  cardWidth: number;
  cardHeight: number;
}

function resolveCardTheme(
  ageGroup: JoueurAgeGroup,
  gender: JoueurGenderVisual,
  clubColors?: { primary: string; secondary: string },
): CardTheme {
  const gKey = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'neutral';
  const accents = JOUEUR_AGE_GENDER_ACCENTS[ageGroup][gKey];
  const mood = JOUEUR_AGE_MOODS[ageGroup];

  const primary = clubColors?.primary ?? accents.accent;
  const secondary = clubColors?.secondary ?? accents.accentBright;

  if (ageGroup === 'youth') {
    return {
      frame: [secondary, primary, mood.wash[2]],
      face: [mood.wash[1], mood.wash[0]],
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      rim: `${primary}66`,
      cardWidth: 168,
      cardHeight: 228,
    };
  }

  if (ageGroup === 'teen') {
    return {
      frame: [secondary, primary, mood.wash[1]],
      face: [mood.wash[0], mood.wash[2]],
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      rim: `${primary}55`,
      cardWidth: 156,
      cardHeight: 214,
    };
  }

  return {
    frame: [secondary, primary, FUT18_PREMIUM.nightBlue],
    face: [mood.wash[0], mood.wash[2]],
    ink: mood.ink,
    inkMuted: mood.inkMuted,
    rim: `${primary}44`,
    cardWidth: 148,
    cardHeight: 204,
  };
}

function positionShort(pos: string | undefined): string {
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
  if (/attaqu|buteur|striker|avant|bu/.test(p)) return 'BU';
  return pos.slice(0, 3).toUpperCase();
}

function estimateOvr(matches: number, goals: number, assists: number): number {
  const base = 58 + Math.min(20, matches);
  const boost = Math.min(12, goals * 2 + assists);
  return Math.max(55, Math.min(99, base + boost));
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  stats,
  formPercent,
  clubColors,
  compact,
  onPress,
}) => {
  const p = player.profile;
  const ageGroup = resolveJoueurAgeGroup({
    birthDate: p.birth_date,
    age: p.age,
  });
  const gender = resolveJoueurGenderVisual(p.gender);

  const theme = useMemo(
    () => resolveCardTheme(ageGroup, gender, clubColors),
    [ageGroup, gender, clubColors],
  );

  const pos = positionShort(p.position);
  const seasonStats = stats ?? {
    goals: p.season_stats?.goals ?? 0,
    assists: p.season_stats?.assists ?? 0,
    matches: p.season_stats?.matches ?? 0,
  };
  const ovr = estimateOvr(seasonStats.matches, seasonStats.goals, seasonStats.assists);
  const form = formPercent ?? (seasonStats.matches > 0 ? Math.min(99, 55 + seasonStats.matches * 2) : undefined);
  const lastName = player.display_name.trim().split(/\s+/).pop() ?? player.display_name;

  const w = compact ? Math.round(theme.cardWidth * 0.88) : theme.cardWidth;
  const h = compact ? Math.round(theme.cardHeight * 0.88) : theme.cardHeight;

  const card = (
    <View style={[styles.shell, { width: w, height: h, shadowColor: theme.frame[1] }]}>
      <LinearGradient colors={theme.frame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.frame}>
        <LinearGradient colors={theme.face} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.face}>
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'transparent']}
            style={styles.shine}
            pointerEvents="none"
          />
          <View style={styles.topRow}>
            <View style={styles.ratingCol}>
              <ProDayText variant="section" style={[styles.ovr, { color: theme.ink }]}>
                {ovr}
              </ProDayText>
              <ProDayText variant="caption" style={[styles.pos, { color: theme.ink }]}>
                {pos}
              </ProDayText>
              {p.jersey_number != null ? (
                <ProDayText variant="caption" style={[styles.jersey, { color: theme.inkMuted }]}>
                  #{p.jersey_number}
                </ProDayText>
              ) : null}
            </View>
            <View style={styles.photoWrap}>
              {player.avatar_url ? (
                <Image source={{ uri: player.avatar_url }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={[styles.photo, styles.photoPh]}>
                  <ProDayText variant="section" style={{ color: theme.ink, fontWeight: '900' }}>
                    {player.display_name.charAt(0).toUpperCase()}
                  </ProDayText>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.namePlate, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: theme.rim }]}>
            <ProDayText variant="caption" style={[styles.nameText, { color: theme.ink }]} numberOfLines={1}>
              {lastName}
            </ProDayText>
          </View>
          <View style={styles.statsGrid}>
            <StatCell label="BUT" value={seasonStats.goals} ink={theme.ink} />
            <StatCell label="PAS" value={seasonStats.assists} ink={theme.ink} />
            <StatCell label="MAT" value={seasonStats.matches} ink={theme.ink} />
            {form != null ? (
              <StatCell label="FRM" value={`${form}%`} ink={theme.ink} />
            ) : seasonStats.avgRating != null ? (
              <StatCell label="NOTE" value={seasonStats.avgRating.toFixed(1)} ink={theme.ink} />
            ) : null}
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.98}>
        {card}
      </PressableSpring>
    );
  }
  return card;
};

const StatCell: React.FC<{ label: string; value: number | string; ink: string }> = ({
  label,
  value,
  ink,
}) => (
  <View style={styles.statCell}>
    <ProDayText variant="caption" style={[styles.statLabel, { color: ink }]}>
      {label}
    </ProDayText>
    <ProDayText variant="caption" style={[styles.statValue, { color: ink }]}>
      {value}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 8,
  },
  frame: { flex: 1, borderRadius: 14, padding: 3 },
  face: { flex: 1, borderRadius: 12, padding: spacing.sm, paddingTop: spacing.md, overflow: 'hidden' },
  shine: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  topRow: { flex: 1, flexDirection: 'row', gap: 4, minHeight: 0 },
  ratingCol: { width: 44, alignItems: 'center', paddingTop: 4 },
  ovr: { fontSize: 28, fontWeight: '900', lineHeight: 30 },
  pos: { fontWeight: '900', fontSize: 10, letterSpacing: 0.8, marginTop: 2 },
  jersey: { fontSize: 9, fontWeight: '700', marginTop: 4 },
  photoWrap: { flex: 1, borderRadius: radius.sm, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoPh: { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  namePlate: {
    marginTop: 6,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameText: {
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  statCell: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statLabel: { opacity: 0.7, fontSize: 9, fontWeight: '800' },
  statValue: { fontSize: 11, fontWeight: '900' },
});
