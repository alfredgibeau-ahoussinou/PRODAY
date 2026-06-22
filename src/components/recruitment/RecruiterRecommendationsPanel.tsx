import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { RecruiterPlayerMatch } from '../../utils/recruiterPlayerMatching';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

interface RecruiterRecommendationsPanelProps {
  matches: RecruiterPlayerMatch[];
  loading?: boolean;
  onViewPlayer?: (uid: string) => void;
}

/** Joueurs recommandés depuis le répertoire Firestore — scores et raisons réels. */
export const RecruiterRecommendationsPanel: React.FC<RecruiterRecommendationsPanelProps> = ({
  matches,
  loading = false,
  onViewPlayer,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ProDaySurface variant="module" style={styles.block}>
      <ProDayText variant="eyebrow" accent style={styles.blockLabel}>
        {t('recruiter.recommendations.title')}
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {t('recruiter.recommendations.subtitle')}
      </ProDayText>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : matches.length === 0 ? (
        <ProDayText variant="body" muted>
          {t('recruiter.recommendations.empty')}
        </ProDayText>
      ) : (
        matches.map((match) => (
          <PressableSpring
            key={match.player.uid}
            onPress={onViewPlayer ? () => onViewPlayer(match.player.uid) : undefined}
            scaleTo={0.98}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          >
            <View style={styles.rowMain}>
              <ProDayText variant="section" numberOfLines={1}>
                {match.player.display_name}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {[match.player.profile.position, match.player.city].filter(Boolean).join(' · ')}
              </ProDayText>
              {match.reasons.length > 0 ? (
                <ProDayText variant="caption" muted numberOfLines={2} style={styles.reasons}>
                  {match.reasons.join(' · ')}
                </ProDayText>
              ) : null}
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.accentSoft }]}>
              <ProDayText variant="caption" accent style={styles.scoreText}>
                {match.score}%
              </ProDayText>
            </View>
          </PressableSpring>
        ))
      )}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  block: { padding: spacing.lg, marginBottom: spacing.md },
  blockLabel: { marginBottom: 4 },
  sub: { marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2, minWidth: 0 },
  reasons: { marginTop: 2 },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    minWidth: 48,
    alignItems: 'center',
  },
  scoreText: { fontWeight: '800' },
});
