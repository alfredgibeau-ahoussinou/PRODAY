import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedDiscoverCopy } from '../../i18n/localizedContent';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { ProDayWordmark } from '../branding/ProDayWordmark';
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
import { type DiscoverHomeChrome } from './discoverPoleHome';
import { useDiscoverMetrics } from './useDiscoverMetrics';

interface DiscoverGuestHeroProps {
  productLine: ProductLineId;
  onSignup: () => void;
  onLogin: () => void;
  onUniversePress?: () => void;
  universeLabel?: string;
}

/**
 * Home pôle invité — Design épuré, moderne et compréhensible avec logo officiel ProDay.
 */
export const DiscoverGuestHero: React.FC<DiscoverGuestHeroProps> = ({
  productLine,
  onSignup,
  onLogin,
  onUniversePress,
  universeLabel,
}) => {
  const insets = useSafeAreaInsets();
  const { homeChrome: chrome } = useDiscoverMetrics();
  const { t } = useTranslation();
  const copy = getLocalizedDiscoverCopy(productLine, t);
  const variant = brandVariantForProductLine(productLine);
  const accent = poleAccent(variant);
  const onAccent = poleOnAccent(variant);
  const poleName = PRODAY_POLE_LABELS[variant];
  const styles = useMemo(
    () => createStyles(accent, onAccent, chrome),
    [accent, onAccent, chrome],
  );

  return (
    <View style={[styles.shell, { paddingTop: insets.top + chrome.topExtra + 12 }]}>
      {universeLabel && onUniversePress ? (
        <PressableSpring onPress={onUniversePress} scaleTo={0.96} style={styles.universeBtn}>
          <Text style={styles.universeText}>{universeLabel}</Text>
          <Icon name="chevron-down" size={14} color="#F5D04A" />
        </PressableSpring>
      ) : null}

      <View style={styles.brandBlock}>
        <ProDaySymbol size={64} variant="master" tone="white" />
        <ProDayWordmark width={130} onDark align="center" />
        {poleName ? (
          <View style={styles.polePill}>
            <View style={[styles.poleDot, { backgroundColor: accent }]} />
            <Text style={[styles.poleName, { color: accent }]}>{poleName}</Text>
          </View>
        ) : null}
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

function createStyles(accent: string, onAccent: string, chrome: DiscoverHomeChrome) {
  return StyleSheet.create({
    shell: {
      paddingHorizontal: spacing.lg,
      marginBottom: 20,
      gap: 16,
      alignItems: 'center',
    },
    universeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    universeText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    brandBlock: {
      alignItems: 'center',
      gap: 10,
      width: '100%',
    },
    polePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      marginTop: 2,
    },
    poleDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    poleName: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    copy: {
      gap: 8,
      alignItems: 'center',
      width: '100%',
    },
    hero: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      lineHeight: 30,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: 'rgba(255, 255, 255, 0.65)',
      textAlign: 'center',
      maxWidth: 340,
    },
    ctaCol: {
      alignSelf: 'stretch',
      gap: 10,
      alignItems: 'stretch',
      marginTop: 6,
    },
    signupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: 26,
      minHeight: 52,
      backgroundColor: '#F5D04A',
    },
    signupText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#000000',
      letterSpacing: 0.2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    loginBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      minHeight: 40,
    },
    loginBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.7)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
