import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type {
  UnifiedLineupPlayer,
  UnifiedLineups,
  UnifiedTeamRef,
} from '../../../services/supporterFootball/types';
import {
  SUPPORTER_SPACE_COPY,
  SUPPORTER_SPACE_MATCH,
} from '../theme/supporterSpaceTheme';

export type RatedPlayerRow = {
  player: UnifiedLineupPlayer;
  team: UnifiedTeamRef;
  side: 'home' | 'away';
};

type Props = {
  lineup: UnifiedLineups | null | undefined;
  homeTeam: UnifiedTeamRef;
  awayTeam: UnifiedTeamRef;
  onPlayerPress?: (player: UnifiedLineupPlayer) => void;
  limit?: number;
};

function collectRated(
  lineup: UnifiedLineups | null | undefined,
  homeTeam: UnifiedTeamRef,
  awayTeam: UnifiedTeamRef,
): RatedPlayerRow[] {
  const rows: RatedPlayerRow[] = [];
  const push = (players: UnifiedLineupPlayer[] | undefined, team: UnifiedTeamRef, side: 'home' | 'away') => {
    for (const player of players ?? []) {
      if (player.rating == null || !Number.isFinite(player.rating)) continue;
      rows.push({ player, team, side });
    }
  };
  push(lineup?.home?.players, homeTeam, 'home');
  push(lineup?.away?.players, awayTeam, 'away');
  return rows.sort((a, b) => (b.player.rating ?? 0) - (a.player.rating ?? 0));
}

/** Top notes joueurs — masqué si l’API n’envoie aucune note. */
export const PlayerRatingsList: React.FC<Props> = ({
  lineup,
  homeTeam,
  awayTeam,
  onPlayerPress,
  limit = 8,
}) => {
  const rows = useMemo(
    () => collectRated(lineup, homeTeam, awayTeam).slice(0, limit),
    [lineup, homeTeam, awayTeam, limit],
  );

  if (!rows.length) return null;

  return (
    <View style={styles.wrap}>
      <ProDayText variant="body" style={styles.title}>
        {SUPPORTER_SPACE_COPY.playerRatings}
      </ProDayText>
      {rows.map((row, index) => {
        const { player, team } = row;
        return (
          <Pressable
            key={`${player.id}-${row.side}`}
            onPress={onPlayerPress ? () => onPlayerPress(player) : undefined}
            style={styles.row}
            disabled={!onPlayerPress}
          >
            <ProDayText variant="caption" style={styles.rank}>
              {index + 1}
            </ProDayText>
            {player.photoUrl ? (
              <Image source={{ uri: player.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPh]} />
            )}
            <View style={styles.meta}>
              <ProDayText variant="body" style={styles.name} numberOfLines={1}>
                {player.name}
              </ProDayText>
              {team.logoUrl ? (
                <Image source={{ uri: team.logoUrl }} style={styles.teamLogo} />
              ) : (
                <ProDayText variant="caption" style={styles.teamName} numberOfLines={1}>
                  {team.shortName || team.name}
                </ProDayText>
              )}
            </View>
            <ProDayText variant="title" style={styles.rating}>
              {Number(player.rating).toFixed(1)}
            </ProDayText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SPACE_MATCH.border,
  },
  rank: {
    color: SUPPORTER_SPACE_MATCH.muted,
    width: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  photo: { width: 40, height: 40, borderRadius: 20 },
  photoPh: { backgroundColor: SUPPORTER_SPACE_MATCH.elevated },
  meta: { flex: 1, gap: 4 },
  name: { color: SUPPORTER_SPACE_MATCH.foreground, fontWeight: '600' },
  teamLogo: { width: 18, height: 18, borderRadius: 9 },
  teamName: { color: SUPPORTER_SPACE_MATCH.muted },
  rating: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '800',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
