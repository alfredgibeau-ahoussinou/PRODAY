import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';

interface FeedQuestionHeroProps {
  question: string;
  weekKey: string;
  colors: AppColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tribune?: boolean;
}

export const FeedQuestionHero: React.FC<FeedQuestionHeroProps> = ({
  question,
  weekKey,
  colors: c,
  t,
  tribune = false,
}) => {
  const accent = tribune ? SUPPORTER_SITE.accent : c.brand;
  const soft = tribune ? SUPPORTER_SITE.soft : c.brandSoft;
  const fg = tribune ? SUPPORTER_SITE.foreground : c.text;
  const muted = tribune ? SUPPORTER_SITE.muted : c.textMuted;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: tribune ? 'rgba(255,255,255,0.03)' : c.surface,
          borderColor: tribune ? SUPPORTER_SITE.border : c.border,
        },
        tribune && styles.wrapTribune,
      ]}
    >
      {tribune ? (
        <LinearGradient
          colors={[SUPPORTER_SITE.glow, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <View style={[styles.accent, { backgroundColor: accent }]} />
      )}

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: soft }]}>
            <Icon name="chat" size={18} color={accent} />
          </View>
          <View style={styles.topMeta}>
            <ProDayText variant="caption" style={[styles.eyebrow, { color: accent }]}>
              {tribune ? t('supporter.fil.weeklyBadge') : t('feed.weekly.badge')}
            </ProDayText>
            <ProDayText variant="caption" style={{ color: muted }}>
              {t('feed.weekly.weekLabel', { n: weekKey })}
            </ProDayText>
          </View>
          {tribune ? (
            <View style={styles.livePill}>
              <ProDayText variant="caption" style={styles.livePillText}>
                Live
              </ProDayText>
            </View>
          ) : null}
        </View>

        <ProDayText variant="title" style={[styles.question, { color: fg }]}>
          {question}
        </ProDayText>

        <ProDayText variant="caption" style={{ color: muted }}>
          {tribune ? t('supporter.fil.weeklyBy') : t('feed.weekly.byAdmin')}
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
  wrapTribune: {
    borderRadius: 2,
    borderLeftWidth: 2,
    borderLeftColor: SUPPORTER_SITE.accent,
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
  question: { lineHeight: 30, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  livePill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  livePillText: {
    color: SUPPORTER_SITE.live,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
