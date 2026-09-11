import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { MotmStanding } from '../../models/MotmVote';
import { motmVotesService } from '../../services/motmVotes.service';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing, radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface MatchMvpVoteWidgetProps {
  event: TeamEvent;
  currentUid: string;
  accentColor?: string;
  onVoted?: () => void;
}

export const MatchMvpVoteWidget: React.FC<MatchMvpVoteWidgetProps> = ({
  event,
  currentUid,
  accentColor = MATCH_SITE.accent,
  onVoted,
}) => {
  const [standings, setStandings] = useState<MotmStanding[]>([]);
  const [myNominee, setMyNominee] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const nominees = React.useMemo(() => {
    const map = new Map<string, string>();
    (event.lineup?.slots ?? []).forEach((s) => {
      if (s.uid && s.display_name) map.set(s.uid, s.display_name);
    });
    Object.entries(event.player_match_stats ?? {}).forEach(([uid, stat]) => {
      if (uid && stat.player_name) map.set(uid, stat.player_name);
    });
    event.invitee_uids.forEach((uid) => {
      if (!map.has(uid)) map.set(uid, uid);
    });
    return Array.from(map.entries()).map(([uid, name]) => ({ uid, name }));
  }, [event.lineup?.slots, event.player_match_stats, event.invitee_uids]);

  const refresh = useCallback(async () => {
    try {
      const [next, mine] = await Promise.all([
        motmVotesService.standings(event.id),
        motmVotesService.getMyVote(event.id, currentUid),
      ]);
      setStandings(next);
      setMyNominee(mine?.nominee_uid ?? null);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [event.id, currentUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleVote = async (nominee: { uid: string; name: string }) => {
    if (busy || nominee.uid === currentUid) return;
    setBusy(true);
    try {
      prodayHaptics.confirm();
      await motmVotesService.vote({
        team_event_id: event.id,
        voter_uid: currentUid,
        nominee_uid: nominee.uid,
        nominee_name: nominee.name,
      });
      await refresh();
      onVoted?.();
    } catch (e) {
      Alert.alert('Vote MVP', e instanceof Error ? e.message : 'Impossible d’enregistrer votre vote.');
    } finally {
      setBusy(false);
    }
  };

  const voteOptions = nominees.filter((n) => n.uid !== currentUid);
  if (voteOptions.length === 0) return null;

  const topVoted = standings.length > 0 ? standings[0] : null;

  return (
    <View style={[styles.card, { borderColor: `${accentColor}55` }]}>
      <View style={styles.header}>
        <Icon name="trophy" size={16} color={accentColor} />
        <ProDayText variant="caption" style={[styles.kicker, { color: accentColor }]}>
          VOTE DU MEILLEUR JOUEUR (MVP / MOTM)
        </ProDayText>
      </View>

      <ProDayText variant="caption" muted style={styles.sub}>
        Élisez l'homme ou la femme du match après le coup de sifflet final.
      </ProDayText>

      {topVoted && topVoted.votes > 0 ? (
        <View style={[styles.mvpLeaderCard, { backgroundColor: `${accentColor}18`, borderColor: accentColor }]}>
          <Icon name="trophy" size={18} color={accentColor} />
          <View style={{ flex: 1 }}>
            <ProDayText variant="caption" style={[styles.leaderLabel, { color: accentColor }]}>
              MVP ACTUEL ({topVoted.votes} vote{topVoted.votes > 1 ? 's' : ''})
            </ProDayText>
            <ProDayText variant="section" style={styles.leaderName}>
              {topVoted.name}
            </ProDayText>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={accentColor} size="small" style={{ marginVertical: spacing.sm }} />
      ) : (
        <View style={styles.optionsList}>
          {voteOptions.slice(0, 8).map((n) => {
            const votes = standings.find((s) => s.uid === n.uid)?.votes ?? 0;
            const selected = myNominee === n.uid;
            return (
              <PressableSpring
                key={n.uid}
                onPress={() => void handleVote(n)}
                disabled={busy}
                scaleTo={0.97}
                haptic
                style={[
                  styles.optionRow,
                  {
                    borderColor: selected ? accentColor : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: selected ? `${accentColor}25` : 'rgba(255, 255, 255, 0.03)',
                  },
                ]}
              >
                <ProDayText variant="caption" style={[styles.optionName, selected && { color: accentColor }]}>
                  {n.name}
                </ProDayText>
                <View style={styles.voteCountPill}>
                  {votes > 0 ? (
                    <ProDayText
                      variant="caption"
                      style={[styles.badgeText, { color: accentColor }]}
                    >
                      {votes} {votes > 1 ? 'votes' : 'vote'}
                    </ProDayText>
                  ) : (
                    <ProDayText variant="caption" muted>
                      Voter
                    </ProDayText>
                  )}
                </View>
              </PressableSpring>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: MATCH_SITE.surface,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kicker: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  sub: {
    marginBottom: spacing.xs,
  },
  mvpLeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  leaderLabel: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionsList: {
    gap: 6,
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  optionName: {
    fontWeight: '700',
    flex: 1,
  },
  voteCountPill: {
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
