import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { MatchCard, SpaceScreen, SpaceSection } from '../../features/supporterSpace/components';
import { SUPPORTER_SPACE } from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type {
  MergedSupporterFootballFacade,
  UnifiedMatch,
  UnifiedStandingRow,
  UnifiedTeamRef,
} from '../../services/supporterFootball';
import { filterMatchesForFollows } from '../../services/supporterFootball';
import type { Follow } from '../../models/Follow';

type Props = {
  team: UnifiedTeamRef;
  facade: MergedSupporterFootballFacade;
  onClose: () => void;
  onOpenMatch: (m: UnifiedMatch) => void;
  isFollowed: boolean;
  onToggleFollow: () => void;
};

export const SupporterSpaceClubDetailScreen: React.FC<Props> = ({
  team,
  facade,
  onClose,
  onOpenMatch,
  isFollowed,
  onToggleFollow,
}) => {
  const [next, setNext] = useState<UnifiedMatch[]>([]);
  const [last, setLast] = useState<UnifiedMatch[]>([]);
  const [standings, setStandings] = useState<UnifiedStandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const syntheticFollow: Follow = {
          id: `local-${team.id}`,
          follower_uid: 'local',
          target_type: 'club',
          target_id: team.id,
          target_label: team.name,
          created_at: new Date(),
        };
        const followed = await facade.getFollowedClubMatches([syntheticFollow]);
        if (cancelled) return;
        const matched = filterMatchesForFollows(followed, [syntheticFollow]);
        const upcoming = matched
          .filter((m) => m.status === 'scheduled' || m.status === 'live' || m.status === 'halftime')
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        const finished = matched
          .filter((m) => m.status === 'finished')
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setNext(upcoming.slice(0, 8));
        setLast(finished.slice(0, 8));
        setStandings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facade, team]);

  return (
    <SpaceScreen>
      <View style={styles.head}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Icon name="arrow-back" size={22} color={SUPPORTER_SPACE.foreground} />
        </Pressable>
        <ProDayText variant="title" style={styles.title} numberOfLines={1}>
          {team.shortName || team.name}
        </ProDayText>
        <Pressable onPress={onToggleFollow} style={styles.follow}>
          <ProDayText variant="caption" style={styles.followText}>
            {isFollowed ? 'Suivi' : 'Suivre'}
          </ProDayText>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={SUPPORTER_SPACE.bright} /> : null}

      <SpaceSection title="Prochain match">
        {next.length ? (
          next.map((m) => <MatchCard key={m.id} match={m} onPress={() => onOpenMatch(m)} />)
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            Aucun prochain match trouvé.
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Dernier résultat">
        {last.length ? (
          last.map((m) => <MatchCard key={m.id} match={m} onPress={() => onOpenMatch(m)} />)
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            Aucun résultat récent.
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Classement">
        {standings.length ? (
          standings.map((row) => (
            <ProDayText key={row.team.id} variant="body" style={styles.muted}>
              {row.position}. {row.team.name} — {row.points} pts
            </ProDayText>
          ))
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            Classement : stub — saison Sportmonks requise (Phase 1.5).
          </ProDayText>
        )}
      </SpaceSection>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: { color: SUPPORTER_SPACE.foreground, flex: 1, fontSize: 20 },
  follow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: SUPPORTER_SPACE.soft,
  },
  followText: { color: SUPPORTER_SPACE.bright },
  muted: { color: SUPPORTER_SPACE.muted },
});
