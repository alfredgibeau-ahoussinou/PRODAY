import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { useSponsorData } from '../../context/SponsorDataContext';
import { sponsorChrome } from './sponsorStyles';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';

interface SponsorTopBarProps {
  title: string;
  subtitle?: string;
  onMenu: () => void;
}

export const SponsorTopBar: React.FC<SponsorTopBarProps> = ({ title, subtitle, onMenu }) => {
  const { refreshing, lastRefreshedAt } = useSponsorData();
  const styles = useMemo(() => createStyles(), []);

  const syncLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '…';

  return (
    <View style={styles.bar} testID="sponsor-top-bar">
      <PressableSpring
        onPress={onMenu}
        style={styles.menuBtn}
        scaleTo={0.95}
        haptic
        testID="sponsor-menu-button"
      >
        <Icon name="menu" size={20} color={sponsorChrome.text} />
      </PressableSpring>
      <View style={styles.titleCol}>
        <Text style={styles.brand}>Sponsor</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          <View style={styles.syncRow}>
            <View style={[styles.syncDot, refreshing ? styles.syncDotBusy : styles.syncDotOk]} />
            <Text style={styles.sync}>
              {refreshing ? 'Sync…' : syncLabel}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.mark}>
        <ProDaySymbol size={32} variant="sponsor" tone="white" />
      </View>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: SPONSOR_THEME.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: SPONSOR_THEME.borderSubtle,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: SPONSOR_THEME.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
    },
    titleCol: { flex: 1, minWidth: 0 },
    brand: {
      color: SPONSOR_THEME.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      marginBottom: 2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      color: SPONSOR_THEME.text,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    subtitle: { color: SPONSOR_THEME.textMuted, fontSize: 11, marginTop: 2 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    syncDot: { width: 5, height: 5, borderRadius: 3 },
    syncDotOk: { backgroundColor: SPONSOR_THEME.success },
    syncDotBusy: { backgroundColor: SPONSOR_THEME.primary },
    sync: { color: SPONSOR_THEME.textMuted, fontSize: 10, fontWeight: '600' },
    mark: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: SPONSOR_THEME.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
      overflow: 'hidden',
    },
  });
}
