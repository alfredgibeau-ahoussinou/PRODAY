import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import { useWeeklyQuestion } from '../../hooks/useWeeklyQuestion';
import { canParticipateWeeklyQuestion } from '../../utils/weeklyQuestionAccess';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface WeeklyQuestionHomeCardProps {
  profile: User;
  onOpenFeed: () => void;
}

export const WeeklyQuestionHomeCard: React.FC<WeeklyQuestionHomeCardProps> = ({
  profile,
  onOpenFeed,
}) => {
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const canParticipate = canParticipateWeeklyQuestion(profile.role);
  const { question, responses, myResponse, loading } = useWeeklyQuestion(profile);

  if (!canParticipate || loading || !question) return null;

  const ctaLabel = myResponse
    ? t('feed.weekly.homeCardViewAnswers', { n: responses.length })
    : t('feed.weekly.homeCardAnswer');

  return (
    <PressableSpring
      onPress={onOpenFeed}
      scaleTo={0.99}
      haptic
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.brandSoft }]}>
        <Icon name="chat" size={18} color={c.brand} />
      </View>
      <View style={styles.body}>
        <ProDayText variant="caption" style={[styles.eyebrow, { color: c.brand }]}>
          {t('feed.weekly.homeCardTitle')}
        </ProDayText>
        <ProDayText variant="body" numberOfLines={2} style={styles.question}>
          {question.question}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {responses.length > 0
            ? t('feed.weekly.responsesTitle', { n: responses.length })
            : t('feed.weekly.empty')}
        </ProDayText>
      </View>
      <View style={[styles.cta, { backgroundColor: c.brand }]}>
        <ProDayText variant="caption" inverse style={styles.ctaText}>
          {ctaLabel}
        </ProDayText>
        <Icon name="chevron-forward" size={14} color={c.brandInverse} />
      </View>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, gap: 4 },
    eyebrow: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    question: { fontWeight: '700', lineHeight: 20 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      maxWidth: 120,
    },
    ctaText: { fontWeight: '800', flexShrink: 1 },
  });
}
