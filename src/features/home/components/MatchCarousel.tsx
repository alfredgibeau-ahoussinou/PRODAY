import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { MatchRecommendation } from '../../../core/types/recommendation';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring, StaggerReveal, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { formatDistanceKm } from '../../../utils/geoLocation';
import { spacing, radius } from '../../../theme/designTokens';

interface MatchCarouselProps {
  matches: MatchRecommendation[];
  onJoin: (match: MatchRecommendation) => void;
  onDetails: () => void;
}

/** Carousel matchs recommandés par l'IA (spec §4.4). */
export const MatchCarousel: React.FC<MatchCarouselProps> = ({
  matches,
  onJoin,
  onDetails,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  if (matches.length === 0) {
    return (
      <AnimatedEntrance kind="fadeUp">
        <GlassCard variant="default" style={styles.empty}>
          <ProDayText variant="section">{t('home.matches.title')}</ProDayText>
          <ProDayText variant="body" muted style={styles.emptyCopy}>
            {t('home.matches.empty')}
          </ProDayText>
          <PressableSpring onPress={onDetails} scaleTo={0.98} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              {t('home.matches.explore')}
            </ProDayText>
          </PressableSpring>
        </GlassCard>
      </AnimatedEntrance>
    );
  }

  return (
    <AnimatedEntrance kind="fadeUp">
      <View style={styles.shell}>
        <View style={styles.titleRow}>
          <ProDayText variant="section">{t('home.matches.title')}</ProDayText>
          <PressableSpring onPress={onDetails} scaleTo={0.98} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              {t('home.matches.seeAll')}
            </ProDayText>
          </PressableSpring>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {matches.map((match, index) => (
            <StaggerReveal key={match.id} index={index} delayStep={45}>
              <GlassCard variant="default" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.scoreBadge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.scoreText}>
                  {match.iaScore}%
                </ProDayText>
              </View>
              {!match.healthCompatible ? (
                <ProDayText variant="caption" muted style={styles.warn}>
                  Charge élevée
                </ProDayText>
              ) : null}
            </View>
            <ProDayText variant="caption" numberOfLines={2} style={styles.matchTitle}>
              {match.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {match.city}
              {match.distanceKm != null ? ` · ${formatDistanceKm(match.distanceKm)}` : ''}
            </ProDayText>
            <PressableSpring
              onPress={() => onJoin(match)}
              style={[styles.joinBtn, { backgroundColor: colors.accent }]}
              scaleTo={0.97}
              haptic
            >
              <Icon name="football" size={14} color="#FFFFFF" />
              <ProDayText variant="caption" inverse style={styles.joinLabel}>
                {t('home.matches.join')}
              </ProDayText>
            </PressableSpring>
              </GlassCard>
            </StaggerReveal>
          ))}
        </ScrollView>
      </View>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.md },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  link: { fontWeight: '600' },
  scroll: { gap: spacing.sm },
  card: { width: 200, padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  scoreText: { fontWeight: '700', fontSize: 10 },
  warn: { fontSize: 9 },
  matchTitle: { fontWeight: '700', minHeight: 32 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  joinLabel: { fontWeight: '700' },
  empty: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyCopy: { lineHeight: 22 },
});
