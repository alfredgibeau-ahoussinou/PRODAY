import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachSectionCard, CoachText } from './coachPortalUi';
import { useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';
import {
  buildCoachPlayerAiInsights,
  type CoachPlayerAiInsightsInput,
} from '../../utils/coachAiInsights';

type Props = Omit<CoachPlayerAiInsightsInput, 'playerName'> & {
  playerName?: string;
  /** Une ligne dans la liste joueurs. */
  compact?: boolean;
};

/** Analyse IA joueur — bullets honnêtes depuis données réelles + notes coach. */
export function CoachPlayerAiPanel(props: Props) {
  const styles = useCoachThemedStyles(createStyles);
  const insight = buildCoachPlayerAiInsights({
    ...props,
    playerName: props.playerName ?? 'Joueur',
  });

  if (props.compact) {
    const line =
      insight.bullets[0] ??
      (insight.level === 'none' ? insight.emptyHint : 'Analyse en cours…');
    return (
      <CoachText variant="caption" muted numberOfLines={2} style={styles.compactLine}>
        {line}
      </CoachText>
    );
  }

  if (insight.level === 'none') {
    return (
      <CoachSectionCard
        kicker="Analyse IA"
        title="Données insuffisantes"
        body={insight.emptyHint}
      />
    );
  }

  return (
    <CoachSectionCard kicker="Analyse IA" title="Synthèse joueur">
      <View style={styles.list}>
        {insight.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.dot} />
            <CoachText variant="caption" style={styles.bulletText}>
              {b}
            </CoachText>
          </View>
        ))}
      </View>
    </CoachSectionCard>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    list: { marginTop: spacing.sm, gap: spacing.xs },
    bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
      marginTop: 6,
    },
    bulletText: { flex: 1, lineHeight: 18 },
    compactLine: { fontSize: 11, lineHeight: 15 },
  });
}
