import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  weeklyQuestionReactionsService,
  type WeeklyReactionKind,
} from '../../services/weeklyQuestionReactions.service';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const REACTIONS: { kind: WeeklyReactionKind; emoji: string; label: string }[] = [
  { kind: 'like', emoji: '👍', label: 'Like' },
  { kind: 'fire', emoji: '🔥', label: 'Feu' },
  { kind: 'clap', emoji: '👏', label: 'Bravo' },
];

interface WeeklyQuestionReactionBarProps {
  questionId: string;
  responseUid: string;
  viewerUid: string;
}

export const WeeklyQuestionReactionBar: React.FC<WeeklyQuestionReactionBarProps> = ({
  questionId,
  responseUid,
  viewerUid,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [counts, setCounts] = useState<Record<WeeklyReactionKind, number>>({
    like: 0,
    fire: 0,
    clap: 0,
  });
  const [mine, setMine] = useState<WeeklyReactionKind | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [nextCounts, nextMine] = await Promise.all([
      weeklyQuestionReactionsService.getCounts(questionId, responseUid),
      weeklyQuestionReactionsService.getMyReaction(questionId, responseUid, viewerUid),
    ]);
    setCounts(nextCounts);
    setMine(nextMine);
  }, [questionId, responseUid, viewerUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (kind: WeeklyReactionKind) => {
    if (busy) return;
    setBusy(true);
    try {
      await weeklyQuestionReactionsService.toggle(questionId, responseUid, viewerUid, kind);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      {REACTIONS.map(({ kind, emoji, label }) => {
        const active = mine === kind;
        const count = counts[kind];
        return (
          <PressableSpring
            key={kind}
            onPress={() => void toggle(kind)}
            disabled={busy}
            scaleTo={0.95}
            haptic
            style={[
              styles.chip,
              {
                borderColor: active ? c.brand : c.border,
                backgroundColor: active ? c.accentSoft : c.surfaceMuted,
              },
            ]}
          >
            <ProDayText variant="caption">{emoji}</ProDayText>
            {count > 0 ? (
              <ProDayText variant="caption" style={{ fontWeight: '800', color: c.text }}>
                {count}
              </ProDayText>
            ) : (
              <ProDayText variant="caption" muted style={styles.srOnly}>
                {label}
              </ProDayText>
            )}
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
      marginLeft: 48 + spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    srOnly: { fontSize: 10 },
  });
}
