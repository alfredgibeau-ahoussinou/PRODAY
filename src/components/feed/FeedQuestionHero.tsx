import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface FeedQuestionHeroProps {
  question: string;
  weekKey: string;
  colors: AppColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const FeedQuestionHero: React.FC<FeedQuestionHeroProps> = ({
  question,
  weekKey,
  colors: c,
  t,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.accent, { backgroundColor: c.brand }]} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: c.brandSoft }]}>
            <Icon name="chat" size={18} color={c.brand} />
          </View>
          <View style={styles.topMeta}>
            <ProDayText variant="caption" style={[styles.eyebrow, { color: c.brand }]}>
              {t('feed.weekly.badge')}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {t('feed.weekly.weekLabel', { n: weekKey })}
            </ProDayText>
          </View>
        </View>

        <ProDayText variant="title" style={[styles.question, { color: c.text }]}>
          {question}
        </ProDayText>

        <ProDayText variant="caption" muted>
          {t('feed.weekly.byAdmin')}
        </ProDayText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: {
    height: 4,
    width: '100%',
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMeta: { flex: 1, gap: 2 },
  eyebrow: { fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  question: { lineHeight: 30, fontSize: 22 },
});
