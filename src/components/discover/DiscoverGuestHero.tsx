import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { brandForProductLine } from '../../models/ProductLine';
import { ProductLineLogo } from '../branding/ProductLineLogo';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { AUTH_SHEET } from '../auth/authSheetPalette';
import { isJoueurProductLine } from '../../utils/playerLevelBadge';
import { JOUEUR_DISCOVER, JOUEUR_SITE } from '../../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

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

/** Hero invité — bandeau noir centré + CTA bêta (maquette v2). */
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
  const brand = brandForProductLine(productLine);
  const joueurLine = isJoueurProductLine(productLine);
  const accent = joueurLine ? PLAYER_DARK.accent : c.accent;
  const styles = useMemo(() => createStyles(c, joueurLine), [c, joueurLine]);

  return (
    <View style={styles.shell}>
      <View style={[styles.card, { paddingTop: insets.top + spacing.lg }]}>
        {universeLabel && onUniversePress ? (
          <PressableSpring onPress={onUniversePress} scaleTo={0.98} style={styles.universeBtn}>
            <Text style={styles.universeText}>{universeLabel}</Text>
            <Icon name="chevron-down" size={14} color="rgba(255,255,255,0.8)" />
          </PressableSpring>
        ) : null}

        <View style={styles.brandBlock}>
          <ProductLineLogo line={productLine} width={132} onDark centered />
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </View>

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
            <View style={[styles.liveDot, { backgroundColor: accent }]} />
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
              <Text
                style={[
                  styles.signupText,
                  productLine === 'sponsor' && styles.signupTextSponsor,
                ]}
              >
                {productLine === 'sponsor' ? copy.ctaText : t('discover.createAccount')}
              </Text>
              <Icon
                name="chevron-forward"
                size={16}
                color={productLine === 'sponsor' ? '#1C1917' : '#0A0A0A'}
              />
            </ProDayGradient>
          </PressableSpring>
          <PressableSpring onPress={onLogin} scaleTo={0.98} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>{t('discover.hasAccount')}</Text>
          </PressableSpring>
        </View>
      </View>
    </View>
  );
};

function createStyles(_c: ReturnType<typeof useAppTheme>['colors'], joueurLine = false) {
  const heroBg = joueurLine ? JOUEUR_DISCOVER.heroBg : AUTH_SHEET.heroBackground;
  const heroMuted = joueurLine ? JOUEUR_DISCOVER.heroMuted : AUTH_SHEET.heroMuted;
  const accent = joueurLine ? PLAYER_DARK.accent : _c.accent;

  return StyleSheet.create({
    shell: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: heroBg,
      borderRadius: radius.xl + 4,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
      alignItems: 'center',
      overflow: 'hidden',
      ...(joueurLine
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: JOUEUR_DISCOVER.heroBorder,
          }
        : null),
    },
    universeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.16)',
    },
    universeText: {
      fontSize: 11,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.6,
    },
    brandBlock: {
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
    },
    tagline: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: heroMuted,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    copy: {
      gap: spacing.sm,
      alignItems: 'center',
      width: '100%',
    },
    hero: {
      fontSize: 30,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -0.9,
      lineHeight: 34,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
      color: heroMuted,
      textAlign: 'center',
      maxWidth: 300,
    },
    loader: {
      alignSelf: 'center',
    },
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      alignSelf: 'stretch',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
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
      marginTop: spacing.xs,
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
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      minHeight: 52,
    },
    signupText: {
      fontSize: 15,
      fontWeight: '800',
      color: joueurLine ? PLAYER_DARK.bg : '#0A0A0A',
    },
    signupTextSponsor: {
      color: '#1C1917',
    },
    loginBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      minHeight: 46,
    },
    loginBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.88)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
