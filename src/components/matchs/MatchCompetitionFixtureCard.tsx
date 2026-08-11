import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { CompetitionFixture } from '../../models/Competition';
import { PressableSpring } from '../motion';
import { LivePulseDot } from '../motion/LivePulseDot';
import { ProDayText } from '../ui/ProDayText';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  competitionFixtureScoreLine,
  competitionFixtureStatusLabel,
} from '../competition/competitionLabels';

interface MatchCompetitionFixtureCardProps {
  fixture: CompetitionFixture;
  colors: AppColors;
  onPress: () => void;
  locale?: string;
}

export const MatchCompetitionFixtureCard: React.FC<MatchCompetitionFixtureCardProps> = ({
  fixture,
  colors: c,
  onPress,
  locale = 'fr-FR',
}) => {
  const live = fixture.status === 'live';
  const contested = fixture.status === 'contested';
  const validated = fixture.status === 'validated';
  const barColor = live
    ? MATCH_SITE.live
    : contested
      ? MATCH_SITE.warn
      : validated
        ? c.accent
        : MATCH_SITE.muted;
  const statusColor = live
    ? MATCH_SITE.live
    : contested
      ? MATCH_SITE.warn
      : validated
        ? c.accent
        : MATCH_SITE.muted;

  return (
    <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98} haptic>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.statusRow}>
            {live ? <LivePulseDot active size={6} color={MATCH_SITE.live} /> : null}
            <ProDayText variant="caption" style={[styles.status, { color: statusColor }]}>
              {competitionFixtureStatusLabel(fixture.status)}
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.muted}>
            J{fixture.matchday}
          </ProDayText>
        </View>

        <ProDayText variant="section" style={styles.title} numberOfLines={2}>
          {fixture.home_name} {competitionFixtureScoreLine(fixture)} {fixture.away_name}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {fixture.kickoff_at.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {fixture.source === 'external' ? ' · Ext.' : ''}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.link, { color: c.accent }]}>
          Ouvrir le match →
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
