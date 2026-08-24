import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { ProDayLogo } from '../branding/ProDayLogo';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import {
  brandVariantForProductLine,
  poleAccent,
  poleOnAccent,
  PRODAY_POLE_LABELS,
} from '../../theme/prodayBrand';

interface DiscoverGuestHeroProps {
  productLine: ProductLineId;
  onSignup: () => void;
  onLogin: () => void;
  onUniversePress?: () => void;
  universeLabel?: string;
}

/** Home pôle invité — aperçu compte, un accent, un CTA. */
export const DiscoverGuestHero: React.FC<DiscoverGuestHeroProps> = ({
  productLine,
  onSignup,
  onLogin,
  onUniversePress,
  universeLabel,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const copy = getLocalizedDiscoverCopy(productLine, t);
  const variant = brandVariantForProductLine(productLine);
  const accent = poleAccent(variant);
  const onAccent = poleOnAccent(variant);
  const poleName = PRODAY_POLE_LABELS[variant];
  const styles = useMemo(() => createStyles(accent, onAccent), [accent, onAccent]);

  return (
    <View style={[styles.shell, { paddingTop: insets.top + spacing.md }]}>
      {universeLabel && onUniversePress ? (
        <PressableSpring onPress={onUniversePress} scaleTo={0.98} style={styles.universeBtn}>
          <Text style={styles.universeText}>{universeLabel}</Text>
          <Icon name="chevron-down" size={12} color="rgba(255,255,255,0.45)" />
        </PressableSpring>
      ) : null}

      <View style={styles.brandBlock}>
        <ProDayLogo variant={variant} width={88} onDark layout="symbol" />
        <Text style={styles.wordmark}>PRODAY</Text>
        {poleName ? <Text style={styles.poleName}>{poleName}</Text> : null}
      </View>

      <View style={styles.copy}>
        <Text style={styles.hero}>{copy.heroTitle}</Text>
        <Text style={styles.sub}>{copy.heroSub}</Text>
      </View>

      <View style={styles.ctaCol}>
        <PressableSpring onPress={onSignup} scaleTo={0.98} haptic style={styles.signupBtn}>
          <Text style={styles.signupText}>{t('discover.createAccount')}</Text>
        </PressableSpring>
        <PressableSpring onPress={onLogin} scaleTo={0.98} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>{t('discover.hasAccount')}</Text>
        </PressableSpring>
      </View>
    </View>
  );
};

function createStyles(accent: string, onAccent: string) {
  return StyleSheet.create({
    shell: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      gap: spacing.lg,
      alignItems: 'center',
    },
    universeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    universeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.48)',
      letterSpacing: 0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    brandBlock: {
      alignItems: 'center',
      gap: 2,
      width: '100%',
    },
    wordmark: {
      marginTop: spacing.sm,
      fontFamily: fontFamily.brand,
      fontSize: 18,
      letterSpacing: 3.2,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    poleName: {
      fontFamily: fontFamily.brandSemi,
      fontSize: 13,
      letterSpacing: 2.4,
      color: accent,
      textTransform: 'uppercase',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    copy: {
      gap: spacing.sm,
      alignItems: 'center',
      width: '100%',
    },
    hero: {
      fontSize: 24,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: -0.5,
      lineHeight: 30,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.58)',
      textAlign: 'center',
      maxWidth: 320,
    },
    ctaCol: {
      alignSelf: 'stretch',
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    signupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      minHeight: 50,
      backgroundColor: accent,
    },
    signupText: {
      fontSize: 15,
      fontWeight: '800',
      color: onAccent,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    loginBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      minHeight: 40,
    },
    loginBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.55)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
