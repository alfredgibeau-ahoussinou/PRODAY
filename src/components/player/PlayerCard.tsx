import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { radius, spacing, shadows } from '../../theme/designTokens';
import type { User } from '../../models/User';
import type {
  JoueurAgeGroup,
  JoueurGenderVisual,
} from '../../utils/joueurExperienceTheme';
import {
  resolveJoueurAgeGroup,
  resolveJoueurGenderVisual,
  resolvePlayerAgeYears,
} from '../../utils/joueurExperienceTheme';
import {
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_AGE_MOODS,
} from '../../content/joueurPageIdentity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  /** 0-100 wellness / form indicator */
  formPercent?: number;
  clubColors?: { primary: string; secondary: string };
  compact?: boolean;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Age-adaptive theme
// ---------------------------------------------------------------------------

interface CardTheme {
  bg: [string, string];
  ink: string;
  inkMuted: string;
  accent: string;
  accentSoft: string;
  surface: string;
  border: string;
  cardRadius: number;
  statFontSize: number;
  nameFontSize: number;
  showFormBar: boolean;
  showTrend: boolean;
}

function resolveCardTheme(
  ageGroup: JoueurAgeGroup,
  gender: JoueurGenderVisual,
  clubColors?: { primary: string; secondary: string },
): CardTheme {
  const gKey = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'neutral';
  const accents = JOUEUR_AGE_GENDER_ACCENTS[ageGroup][gKey];
  const mood = JOUEUR_AGE_MOODS[ageGroup];

  const base = {
    accent: clubColors?.primary ?? accents.accent,
    accentSoft: accents.soft,
    border: mood.border,
    surface: mood.surface,
  };

  if (ageGroup === 'youth') {
    return {
      ...base,
      bg: clubColors
        ? [clubColors.primary, clubColors.secondary]
        : [mood.wash[0], mood.wash[1]],
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      cardRadius: 24,
      statFontSize: 18,
      nameFontSize: 18,
      showFormBar: false,
      showTrend: false,
    };
  }

  if (ageGroup === 'teen') {
    return {
      ...base,
      bg: clubColors
        ? [clubColors.primary, clubColors.secondary]
        : [mood.wash[0], mood.wash[1]],
      ink: mood.ink,
      inkMuted: mood.inkMuted,
      cardRadius: 18,
      statFontSize: 15,
      nameFontSize: 17,
      showFormBar: true,
      showTrend: true,
    };
  }

  return {
    ...base,
    bg: clubColors
      ? [clubColors.primary, clubColors.secondary]
      : [mood.wash[0], mood.wash[1]],
    ink: mood.ink,
    inkMuted: mood.inkMuted,
    cardRadius: 14,
    statFontSize: 14,
    nameFontSize: 16,
    showFormBar: true,
    showTrend: true,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function trendIcon(trend: PlayerCardTrend): { name: IconName; color: string } {
  if (trend === 'up') return { name: 'chevron-up', color: '#34D399' };
  if (trend === 'down') return { name: 'chevron-down', color: '#F87171' };
  return { name: 'ellipsis-horizontal', color: '#94A3B8' };
}

function formColor(pct: number): string {
  if (pct >= 75) return '#34D399';
  if (pct >= 50) return '#FBBF24';
  return '#F87171';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  stats,
  trend = 'stable',
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
  const age = resolvePlayerAgeYears({
    birthDate: p.birth_date,
    age: p.age,
  });

  const theme = useMemo(
    () => resolveCardTheme(ageGroup, gender, clubColors),
    [ageGroup, gender, clubColors],
  );

  const pos = positionShort(p.position);
  const jersey = p.jersey_number;
  const seasonStats = stats ?? {
    goals: p.season_stats?.goals ?? 0,
    assists: p.season_stats?.assists ?? 0,
    matches: p.season_stats?.matches ?? 0,
  };
  const form = formPercent ?? (seasonStats.matches > 0 ? Math.min(99, 55 + seasonStats.matches * 2) : undefined);

  const card = (
    <LinearGradient
      colors={theme.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        shadows.card,
        {
          borderRadius: theme.cardRadius,
          borderColor: theme.border,
        },
        compact && styles.compact,
      ]}
    >
      {/* Header: avatar + name + position + jersey */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {player.avatar_url ? (
            <Image
              source={{ uri: player.avatar_url }}
              style={[styles.avatar, { borderColor: theme.accent }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: theme.accentSoft, borderColor: theme.accent },
              ]}
            >
              <ProDayText
                variant="section"
                style={{ color: theme.accent, fontSize: 24, fontWeight: '900' }}
              >
                {player.display_name.charAt(0).toUpperCase()}
              </ProDayText>
            </View>
          )}
          {jersey != null ? (
            <View style={[styles.jerseyBadge, { backgroundColor: theme.accent }]}>
              <ProDayText variant="caption" style={styles.jerseyText}>
                {jersey}
              </ProDayText>
            </View>
          ) : null}
        </View>

        <View style={styles.nameCol}>
          <View style={styles.nameRow}>
            <ProDayText
              variant="body"
              style={[styles.name, { color: theme.ink, fontSize: theme.nameFontSize }]}
              numberOfLines={1}
            >
              {player.display_name}
            </ProDayText>
            {theme.showTrend ? (
              <Icon {...trendIcon(trend)} size={16} />
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.posBadge, { backgroundColor: theme.accentSoft }]}>
              <ProDayText
                variant="caption"
                style={[styles.posText, { color: theme.accent }]}
              >
                {pos}
              </ProDayText>
            </View>
            {age != null ? (
              <ProDayText variant="caption" style={{ color: theme.inkMuted }}>
                {age} ans
              </ProDayText>
            ) : null}
            {player.city ? (
              <ProDayText variant="caption" style={{ color: theme.inkMuted }} numberOfLines={1}>
                {player.city}
              </ProDayText>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
        <StatCell
          label={ageGroup === 'youth' ? 'Buts' : 'BUT'}
          value={seasonStats.goals}
          theme={theme}
          ageGroup={ageGroup}
        />
        <StatCell
          label={ageGroup === 'youth' ? 'Passes' : 'PAS'}
          value={seasonStats.assists}
          theme={theme}
          ageGroup={ageGroup}
        />
        <StatCell
          label={ageGroup === 'youth' ? 'Matchs' : 'MAT'}
          value={seasonStats.matches}
          theme={theme}
          ageGroup={ageGroup}
        />
        {seasonStats.avgRating != null ? (
          <StatCell
            label="NOTE"
            value={seasonStats.avgRating.toFixed(1)}
            theme={theme}
            ageGroup={ageGroup}
          />
        ) : null}
      </View>

      {/* Form bar (teen + adult only) */}
      {theme.showFormBar && form != null ? (
        <View style={styles.formRow}>
          <ProDayText variant="caption" style={{ color: theme.inkMuted, fontSize: 11 }}>
            Forme
          </ProDayText>
          <View style={[styles.formTrack, { backgroundColor: theme.surface }]}>
            <View
              style={[
                styles.formFill,
                {
                  width: `${Math.min(100, form)}%`,
                  backgroundColor: formColor(form),
                },
              ]}
            />
          </View>
          <ProDayText
            variant="caption"
            style={{ color: formColor(form), fontSize: 11, fontWeight: '800' }}
          >
            {form}%
          </ProDayText>
        </View>
      ) : null}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.97}>
        {card}
      </PressableSpring>
    );
  }
  return card;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatCell: React.FC<{
  label: string;
  value: number | string;
  theme: CardTheme;
  ageGroup: JoueurAgeGroup;
}> = ({ label, value, theme, ageGroup }) => (
  <View style={styles.statCell}>
    <ProDayText
      variant="caption"
      style={{
        color: theme.inkMuted,
        fontSize: ageGroup === 'youth' ? 10 : 9,
        fontWeight: '700',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </ProDayText>
    <ProDayText
      variant="section"
      style={{
        color: theme.ink,
        fontSize: theme.statFontSize,
        fontWeight: '900',
      }}
    >
      {value}
    </ProDayText>
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
    gap: spacing.md,
  },
  compact: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  jerseyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  nameCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '800',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  posBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  posText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  formTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  formFill: {
    height: '100%',
    borderRadius: 2,
  },
});
