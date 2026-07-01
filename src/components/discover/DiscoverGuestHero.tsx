import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { gradientsForLine } from '../../theme/universeGradients';
import { ProductLineLogo } from '../branding/ProductLineLogo';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface DiscoverGuestHeroProps {
  productLine: ProductLineId;
  statsLabel?: string;
  loading?: boolean;
  onSignup: () => void;
  onLogin: () => void;
  onStatsPress?: () => void;
  onUniversePress?: () => void;
  universeLabel?: string;
}

export const DiscoverGuestHero: React.FC<DiscoverGuestHeroProps> = ({
  productLine,
  statsLabel,
  loading,
  onSignup,
  onLogin,
  onStatsPress,
  onUniversePress,
  universeLabel,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const copy = getLocalizedDiscoverCopy(productLine, t);
  const stops = gradientsForLine(productLine);
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[...stops.hero]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.scrim} />

      <View style={[styles.inner, { paddingTop: insets.top + spacing.sm }]}>
        {universeLabel && onUniversePress ? (
          <PressableSpring onPress={onUniversePress} scaleTo={0.98} style={styles.universeBtn}>
            <Text style={styles.universeText}>{universeLabel}</Text>
            <Icon name="chevron-down" size={14} color="rgba(255,255,255,0.8)" />
          </PressableSpring>
        ) : null}

        <ProductLineLogo line={productLine} width={148} onDark />

        <View style={styles.copy}>
          <Text style={styles.hero}>{copy.heroTitle}</Text>
          <Text style={styles.sub}>{copy.heroSub}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#fff" style={styles.loader} />
        ) : statsLabel ? (
          <PressableSpring
            onPress={onStatsPress}
            disabled={!onStatsPress}
            scaleTo={0.98}
            style={styles.statsPill}
          >
            <View style={styles.liveDot} />
            <Text style={styles.statsText} numberOfLines={2}>
              {statsLabel}
            </Text>
            {onStatsPress ? (
              <Icon name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            ) : null}
          </PressableSpring>
        ) : null}

        <View style={styles.ctaRow}>
          <PressableSpring onPress={onSignup} scaleTo={0.98} haptic style={styles.signupWrap}>
            <ProDayGradient kind="cta" style={styles.signupBtn}>
              <Text style={styles.signupText}>{t('discover.createAccount')}</Text>
              <Icon name="chevron-forward" size={16} color="#FFFFFF" />
            </ProDayGradient>
          </PressableSpring>
          <PressableSpring onPress={onLogin} scaleTo={0.98} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>{t('discover.hasAccount')}</Text>
          </PressableSpring>
        </View>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shell: {
      borderBottomLeftRadius: radius.xl + 4,
      borderBottomRightRadius: radius.xl + 4,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    inner: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl + spacing.sm,
      gap: spacing.lg,
      alignItems: 'flex-start',
    },
    universeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    universeText: {
      fontSize: 11,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.6,
    },
    copy: {
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    hero: {
      fontSize: 34,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -1,
      lineHeight: 38,
    },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.82)',
    },
    loader: {
      alignSelf: 'flex-start',
    },
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignSelf: 'stretch',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.accent,
    },
    statsText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
      lineHeight: 18,
    },
    ctaRow: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    signupWrap: {
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    signupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
    },
    signupText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    loginLink: {
      alignSelf: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    loginLinkText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.92)',
      textDecorationLine: 'underline',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
