import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { radius, spacing } from '../../theme/designTokens';
import type { User } from '../../models/User';
import type {
  JoueurAgeGroup,
} from '../../utils/joueurExperienceTheme';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';

const PITCH = '#16A34A';

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
// Age-adaptive theme — palette claire, accent vert unique
// ---------------------------------------------------------------------------

interface CardTheme {
  ink: string;
  inkMuted: string;
  accent: string;
  surface: string;
  border: string;
  cardRadius: number;
  statFontSize: number;
  nameFontSize: number;
}

function resolveCardTheme(ageGroup: JoueurAgeGroup): CardTheme {
  return {
    ink: '#0F172A',
    inkMuted: '#64748B',
    accent: PITCH,
    surface: '#FFFFFF',
    border: 'rgba(15, 23, 42, 0.08)',
    cardRadius: ageGroup === 'youth' ? 20 : ageGroup === 'teen' ? 16 : 14,
    statFontSize: ageGroup === 'youth' ? 16 : 14,
    nameFontSize: ageGroup === 'youth' ? 17 : 16,
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  stats,
  clubColors: _clubColors,
  compact,
  onPress,
}) => {
  const p = player.profile;
  const ageGroup = resolveJoueurAgeGroup({
    birthDate: p.birth_date,
    age: p.age,
  });

  const theme = useMemo(() => resolveCardTheme(ageGroup), [ageGroup]);

  const pos = positionShort(p.position);
  const seasonStats = stats ?? {
    goals: p.season_stats?.goals ?? 0,
    assists: p.season_stats?.assists ?? 0,
    matches: p.season_stats?.matches ?? 0,
  };

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderRadius: theme.cardRadius,
          borderColor: theme.border,
        },
        compact && styles.compact,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {player.avatar_url ? (
            <Image source={{ uri: player.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ProDayText
                variant="section"
                style={{ color: theme.accent, fontSize: 22, fontWeight: '700' }}
              >
                {player.display_name.charAt(0).toUpperCase()}
              </ProDayText>
            </View>
          )}
        </View>

        <View style={styles.nameCol}>
          <ProDayText
            variant="body"
            style={[styles.name, { color: theme.ink, fontSize: theme.nameFontSize }]}
            numberOfLines={1}
          >
            {player.display_name}
          </ProDayText>
          <ProDayText variant="caption" style={{ color: theme.accent, fontWeight: '700' }}>
            {pos}
          </ProDayText>
        </View>
      </View>

      <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
        <StatCell label="BUT" value={seasonStats.goals} theme={theme} />
        <StatCell label="PAS" value={seasonStats.assists} theme={theme} />
        <StatCell label="MAT" value={seasonStats.matches} theme={theme} />
      </View>
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatCell: React.FC<{
  label: string;
  value: number | string;
  theme: CardTheme;
}> = ({ label, value, theme }) => (
  <View style={styles.statCell}>
    <ProDayText
      variant="caption"
      style={{
        color: theme.inkMuted,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.4,
      }}
    >
      {label}
    </ProDayText>
    <ProDayText
      variant="section"
      style={{
        color: theme.ink,
        fontSize: theme.statFontSize,
        fontWeight: '800',
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
    borderWidth: StyleSheet.hairlineWidth,
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
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '700',
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
});
