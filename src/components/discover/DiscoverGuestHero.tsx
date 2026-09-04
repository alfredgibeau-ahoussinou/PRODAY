import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { useTranslation } from '../../context/LocaleContext';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { ProDayWordmark } from '../branding/ProDayWordmark';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
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
 * En-tête Invité compact et élégant — laisse place immédiatement au Match Hero et aux fonctionnalités.
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
  const variant = brandVariantForProductLine(productLine);
  const accent = poleAccent(variant);
  const onAccent = poleOnAccent(variant);
  const poleName = PRODAY_POLE_LABELS[variant];

  return (
    <View style={[styles.shell, { paddingTop: insets.top + chrome.topExtra + 8 }]}>
      {/* Top Bar : Logo + Actions Connexion */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <ProDaySymbol size={32} variant="master" tone="white" />
          <ProDayWordmark width={95} onDark align="left" />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={onLogin} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>{t('discover.hasAccount') || 'Connexion'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={onSignup} style={styles.signupBtn}>
            <Text style={styles.signupBtnText}>S&apos;inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Découverte Pill */}
      <View style={styles.bannerRow}>
        <View style={styles.discoverBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.discoverBadgeText}>APERÇU INTERACTIF DE L&apos;APPLICATION</Text>
        </View>

        {universeLabel && onUniversePress ? (
          <TouchableOpacity activeOpacity={0.8} onPress={onUniversePress} style={styles.universeBtn}>
            <Text style={styles.universeText}>{universeLabel}</Text>
            <Icon name="chevron-down" size={12} color="#F5D04A" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signupBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#00E676',
  },
  signupBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  discoverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  discoverBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  universeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  universeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
