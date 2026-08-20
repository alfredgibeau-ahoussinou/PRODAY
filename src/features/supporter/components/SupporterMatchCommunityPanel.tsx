import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import { spacing, radius } from '../../../theme/designTokens';
import {
  supporterMatchCommunityService,
  type SupporterCommunitySnapshot,
} from '../../../services/supporterMatchCommunity.service';

type Props = {
  matchId: string;
  homeScore?: number;
  awayScore?: number;
  matchStatus?: string;
  kickoffAt?: Date;
};

const SCORE_OPTIONS = ['1-0', '2-1', '1-1', '0-0', '2-0', '0-2'];

/** Communauté match — MOTM, prédiction score, réactions (Firestore). */
export const SupporterMatchCommunityPanel: React.FC<Props> = ({
  matchId,
  homeScore,
  awayScore,
  matchStatus,
  kickoffAt,
}) => {
  const [snapshot, setSnapshot] = useState<SupporterCommunitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await supporterMatchCommunityService.loadSnapshot(matchId));
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const motmOptions =
    snapshot?.poll?.options ?? supporterMatchCommunityService.defaultMotmOptions;
  const myMotm = snapshot?.poll?.votes
    ? Object.entries(snapshot.poll.votes).find(([, v]) => v)?.[1]
    : undefined;

  const beforeKickoff =
    matchStatus === 'upcoming' &&
    kickoffAt != null &&
    kickoffAt.getTime() > Date.now();

  const showPredictionResult =
    matchStatus === 'finished' || matchStatus === 'live';

  const voteMotm = async (option: string) => {
    setPending(`motm:${option}`);
    setError(null);
    setSnapshot((s) =>
      s
        ? {
            ...s,
            poll: {
              matchId,
              options: motmOptions,
              votes: { ...(s.poll?.votes ?? {}), optimistic: option },
            },
          }
        : s,
    );
    try {
      await supporterMatchCommunityService.voteMotm(matchId, option);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote impossible');
      await load();
    } finally {
      setPending(null);
    }
  };

  const predict = async (label: string) => {
    const parsed = supporterMatchCommunityService.parsePredictionLabel(label);
    if (!parsed) return;
    setPending(`pred:${label}`);
    setError(null);
    setSnapshot((s) =>
      s
        ? {
            ...s,
            myPrediction: {
              uid: 'local',
              homeScore: parsed.home,
              awayScore: parsed.away,
              label,
            },
          }
        : s,
    );
    try {
      await supporterMatchCommunityService.submitPrediction(
        matchId,
        label,
        parsed.home,
        parsed.away,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prédiction impossible');
      await load();
    } finally {
      setPending(null);
    }
  };

  const react = async (emoji: string) => {
    setPending(`react:${emoji}`);
    try {
      await supporterMatchCommunityService.setReaction(matchId, emoji);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Réaction impossible');
    } finally {
      setPending(null);
    }
  };

  if (loading && !snapshot) {
    return <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.md }} />;
  }

  return (
    <View style={styles.root}>
      <ProDayText variant="section" style={styles.title}>
        Communauté
      </ProDayText>
      <ProDayText variant="caption" style={styles.hint}>
        Sondages communautaires — sans pari d'argent
      </ProDayText>

      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" style={styles.label}>
        Homme du match
      </ProDayText>
      <View style={styles.chips}>
        {motmOptions.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => void voteMotm(opt)}
            disabled={Boolean(pending)}
            style={[styles.chip, myMotm === opt && styles.chipOn]}
          >
            <ProDayText variant="caption" style={myMotm === opt ? styles.chipTextOn : styles.chipText}>
              {opt}
            </ProDayText>
          </Pressable>
        ))}
      </View>

      <ProDayText variant="caption" style={styles.label}>
        Prédiction score
      </ProDayText>
      {beforeKickoff ? (
        <View style={styles.chips}>
          {SCORE_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => void predict(opt)}
              disabled={Boolean(pending) || Boolean(snapshot?.myPrediction)}
              style={[styles.chip, snapshot?.myPrediction?.label === opt && styles.chipOn]}
            >
              <ProDayText
                variant="caption"
                style={snapshot?.myPrediction?.label === opt ? styles.chipTextOn : styles.chipText}
              >
                {opt}
              </ProDayText>
            </Pressable>
          ))}
        </View>
      ) : (
        <ProDayText variant="caption" style={styles.muted}>
          {snapshot?.myPrediction
            ? `Ta prédiction : ${snapshot.myPrediction.label}`
            : "Prédictions closes — coup d'envoi passé"}
        </ProDayText>
      )}

      {showPredictionResult && homeScore != null && awayScore != null ? (
        <ProDayText variant="caption" style={styles.muted}>
          Score : {homeScore} – {awayScore}
          {snapshot?.myPrediction
            ? snapshot.myPrediction.homeScore === homeScore &&
              snapshot.myPrediction.awayScore === awayScore
              ? ' · Bravo !'
              : ' · Résultat affiché après FT'
            : ''}
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" style={styles.label}>
        Réactions
      </ProDayText>
      <View style={styles.chips}>
        {supporterMatchCommunityService.reactionEmojis.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => void react(emoji)}
            disabled={Boolean(pending)}
            style={[styles.chip, snapshot?.myReaction?.emoji === emoji && styles.chipOn]}
          >
            <ProDayText variant="caption" style={styles.chipTextOn}>
              {emoji}
              {snapshot?.reactionCounts[emoji] ? ` ${snapshot.reactionCounts[emoji]}` : ''}
            </ProDayText>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingVertical: spacing.md },
  title: { color: SUPPORTER_SITE.foreground },
  hint: { color: SUPPORTER_SITE.muted, fontSize: 11 },
  error: { color: '#f87171', fontSize: 11 },
  label: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  chipOn: { backgroundColor: SUPPORTER_SITE.soft, borderColor: SUPPORTER_SITE.accent },
  chipText: { color: SUPPORTER_SITE.muted },
  chipTextOn: { color: SUPPORTER_SITE.foreground },
  muted: { color: SUPPORTER_SITE.muted, marginTop: spacing.sm },
});
