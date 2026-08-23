import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDaySymbol } from '../branding/ProDaySymbol';
import { useSponsorData } from '../../context/SponsorDataContext';
import { sponsorChrome } from './sponsorStyles';
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
        <Text style={styles.brand}>Pro Day Sponsor</Text>
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
              {refreshing ? 'Synchronisation…' : `Sync ${syncLabel}`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.mark}>
        <ProDaySymbol size={36} variant="sponsor" tone="white" />
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
      backgroundColor: sponsorChrome.shell,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: sponsorChrome.shellBorder,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: sponsorChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
    },
    titleCol: { flex: 1, minWidth: 0 },
    brand: {
      color: sponsorChrome.gold,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    title: {
      color: sponsorChrome.text,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    subtitle: { color: sponsorChrome.textMuted, fontSize: 11, marginTop: 2 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    syncDot: { width: 5, height: 5, borderRadius: 3 },
    syncDotOk: { backgroundColor: '#34D399' },
    syncDotBusy: { backgroundColor: sponsorChrome.gold },
    sync: { color: sponsorChrome.textMuted, fontSize: 10, fontWeight: '600' },
    mark: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.35)',
      overflow: 'hidden',
      padding: 3,
    },
    markImage: { width: '100%', height: '100%' },
  });
}
