import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

type ReelsEmptyStateProps = {
  loading?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
};

export const ReelsEmptyState: React.FC<ReelsEmptyStateProps> = ({
  loading,
  canPublish,
  onPublish,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);
  const hints = useMemo(
    () => [
      { icon: 'videocam' as const, label: t('reels.empty.hint.publish') },
      { icon: 'person' as const, label: t('reels.empty.hint.profile') },
      { icon: 'people' as const, label: t('reels.community') },
    ],
    [t]
  );

  if (loading) {
    return (
      <View style={styles.root} pointerEvents="none">
        <ProDayGradient kind="heroDark" style={styles.bgGlow} />
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#fff" size="large" />
          <ProDayText variant="caption" inverse muted style={styles.loadingText}>
            {t('reels.empty.loading')}
          </ProDayText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <ProDayGradient kind="heroDark" style={styles.bgGlow} />
      <View style={styles.glowOrb} />

      <View style={styles.panel}>
        <View style={styles.iconRing}>
          <ProDayGradient kind="cta" style={styles.iconGradient}>
            <View style={styles.iconInner}>
              <Icon name="videocam" size={36} color="#fff" />
            </View>
          </ProDayGradient>
        </View>

        <ProDayText variant="section" inverse style={styles.title}>
          {t('reels.empty.title')}
        </ProDayText>
        <ProDayText variant="body" inverse muted style={styles.subtitle}>
          {t('reels.empty.subtitle')}
        </ProDayText>

        <View style={styles.hints}>
          {hints.map((hint) => (
            <View key={hint.label} style={styles.hintChip}>
              <Icon name={hint.icon} size={14} color="rgba(255,255,255,0.85)" />
              <ProDayText variant="caption" inverse style={styles.hintText}>
                {hint.label}
              </ProDayText>
            </View>
          ))}
        </View>

        {canPublish && onPublish ? (
          <PressableSpring onPress={onPublish} scaleTo={0.96} haptic style={styles.ctaWrap}>
            <ProDayGradient kind="cta" style={styles.cta}>
              <Icon name="add" size={18} color="#fff" />
              <ProDayText variant="caption" inverse style={styles.ctaText}>
                {t('reels.empty.cta')}
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        ) : (
          <View style={[styles.ctaGhost, { borderColor: colors.brand }]}>
            <ProDayText variant="caption" inverse style={styles.ctaGhostText}>
              {t('reels.empty.guestHint')}
            </ProDayText>
          </View>
        )}
      </View>
    </View>
  );
};

function createStyles(topInset: number) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050508',
      paddingHorizontal: spacing.lg,
      paddingTop: topInset + 120,
      paddingBottom: spacing.xxl,
    },
    bgGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.55,
    },
    glowOrb: {
      position: 'absolute',
      top: '28%',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(255,255,255,0.04)',
      transform: [{ scaleX: 1.4 }],
    },
    panel: {
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      backgroundColor: 'rgba(255,255,255,0.06)',
      gap: spacing.md,
    },
    iconRing: {
      padding: 3,
      borderRadius: 44,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      marginBottom: spacing.xs,
    },
    iconGradient: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontWeight: '800',
      textAlign: 'center',
      fontSize: 20,
      lineHeight: 26,
    },
    subtitle: {
      textAlign: 'center',
      lineHeight: 22,
      color: 'rgba(255,255,255,0.72)',
    },
    hints: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    hintChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    hintText: {
      fontWeight: '700',
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    ctaWrap: { width: '100%', marginTop: spacing.sm },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
    ctaText: { fontWeight: '800', fontSize: 14 },
    ctaGhost: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    ctaGhostText: {
      textAlign: 'center',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.75)',
      lineHeight: 18,
    },
    loadingCard: {
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    loadingText: { fontWeight: '600' },
  });
}
