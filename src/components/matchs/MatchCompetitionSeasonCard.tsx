import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { CompetitionSeason } from '../../models/Competition';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { competitionSeasonStatusLabel } from '../competition/competitionLabels';

interface MatchCompetitionSeasonCardProps {
  season: CompetitionSeason;
  colors: AppColors;
  onPress: () => void;
}

export const MatchCompetitionSeasonCard: React.FC<MatchCompetitionSeasonCardProps> = ({
  season,
  colors: c,
  onPress,
}) => {
  const active = season.status === 'active';
  const barColor = active ? c.accent : MATCH_SITE.muted;

  return (
    <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98} haptic>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText
            variant="caption"
            style={[styles.status, { color: active ? c.accent : MATCH_SITE.muted }]}
          >
            {competitionSeasonStatusLabel(season.status)}
          </ProDayText>
          {season.external_provider ? (
            <ProDayText variant="caption" style={styles.muted}>
              Miroir externe
            </ProDayText>
          ) : null}
        </View>

        <ProDayText variant="section" style={styles.title} numberOfLines={2}>
          {season.competition_name}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {season.label}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.link, { color: c.accent }]}>
          Ouvrir la saison →
        </ProDayText>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
    backgroundColor: MATCH_SITE.surface,
    marginBottom: 2,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  status: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontWeight: '800',
    color: MATCH_SITE.foreground,
    letterSpacing: -0.3,
  },
  muted: { color: MATCH_SITE.muted },
  link: { fontWeight: '800', marginTop: 2 },
});
