import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachSectionCard, CoachText } from './coachPortalUi';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import {
  buildCoachPlayerAiInsights,
  type CoachPlayerAiInsightsInput,
} from '../../utils/coachAiInsights';

type Props = Omit<CoachPlayerAiInsightsInput, 'playerName'> & {
  playerName?: string;
};

/** Analyse IA joueur — bullets honnêtes depuis données réelles + notes coach. */
export function CoachPlayerAiPanel(props: Props) {
  const insight = buildCoachPlayerAiInsights({
    ...props,
    playerName: props.playerName ?? 'Joueur',
  });

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

const styles = StyleSheet.create({
  list: { marginTop: spacing.sm, gap: spacing.xs },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COACH_SITE.accent,
    marginTop: 6,
  },
  bulletText: { flex: 1, lineHeight: 18 },
});
