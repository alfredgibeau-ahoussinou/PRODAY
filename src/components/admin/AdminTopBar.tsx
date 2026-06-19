import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useAdminData } from '../../context/AdminDataContext';
import { adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';

interface AdminTopBarProps {
  title: string;
  subtitle?: string;
  onMenu: () => void;
  onSearch: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ title, subtitle, onMenu, onSearch }) => {
  const { refreshing, lastRefreshedAt } = useAdminData();
  const styles = useMemo(() => createStyles(), []);

  const syncLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={styles.bar}>
      <PressableSpring onPress={onMenu} style={styles.menuBtn} scaleTo={0.95} haptic>
        <Icon name="menu" size={20} color={adminChrome.text} />
      </PressableSpring>
      <View style={styles.titleCol}>
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
      <PressableSpring onPress={onSearch} style={styles.searchBtn} scaleTo={0.95} haptic>
        <Icon name="search" size={18} color={adminChrome.text} />
      </PressableSpring>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: adminChrome.shell,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: adminChrome.shellBorder,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: adminChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: adminChrome.shellBorder,
    },
    titleCol: { flex: 1, minWidth: 0 },
    title: {
      color: adminChrome.text,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    subtitle: { color: adminChrome.textMuted, fontSize: 11, marginTop: 2 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    syncDot: { width: 5, height: 5, borderRadius: 3 },
    syncDotOk: { backgroundColor: '#34D399' },
    syncDotBusy: { backgroundColor: '#FBBF24' },
    sync: { color: adminChrome.textMuted, fontSize: 10, fontWeight: '600' },
    searchBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: adminChrome.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: adminChrome.shellBorder,
    },
  });
}
