import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useAdminData } from '../../context/AdminDataContext';
import { adminChrome } from './adminStyles';
import { spacing } from '../../theme/designTokens';

interface AdminTopBarProps {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  onMenu: () => void;
  onSearch: () => void;
  inboxCount?: number;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  title,
  subtitle,
  showMenu = true,
  onMenu,
  onSearch,
  inboxCount = 0,
}) => {
  const { refreshing, lastRefreshedAt } = useAdminData();
  const styles = useMemo(() => createStyles(), []);

  const syncLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={styles.bar}>
      {showMenu ? (
        <PressableSpring onPress={onMenu} style={styles.iconBtn} scaleTo={0.94} haptic>
          <Icon name="menu" size={20} color={adminChrome.text} />
          {inboxCount > 0 ? (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{inboxCount > 9 ? '9+' : inboxCount}</Text>
            </View>
          ) : null}
        </PressableSpring>
      ) : (
        <View style={styles.brandDot} />
      )}

      <View style={styles.titleCol}>
        <Text style={styles.kicker}>ProDay Admin</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          <Text style={styles.sync}>
            {refreshing ? 'Actualisation…' : `Mis à jour ${syncLabel}`}
          </Text>
        )}
      </View>

      <PressableSpring onPress={onSearch} style={styles.searchBtn} scaleTo={0.94} haptic>
        <Icon name="search" size={18} color={adminChrome.accent} />
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      backgroundColor: adminChrome.band,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: adminChrome.accent,
      marginHorizontal: 16,
    },
    menuBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 2,
      borderColor: adminChrome.band,
    },
    menuBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    titleCol: { flex: 1, minWidth: 0 },
    kicker: {
      color: adminChrome.accent,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 1,
    },
    title: {
      color: adminChrome.text,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    subtitle: { color: adminChrome.textMuted, fontSize: 12, marginTop: 2 },
    sync: { color: adminChrome.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
    searchBtn: {
      width: 40,
      height: 40,
      borderRadius: 2,
      backgroundColor: adminChrome.soft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.accentMuted,
    },
  });
}
