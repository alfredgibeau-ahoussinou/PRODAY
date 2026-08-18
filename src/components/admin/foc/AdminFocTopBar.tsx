import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';
import { adminChrome, adminType, ADMIN_ON_ACCENT } from '../../../theme/adminTheme';
import { ADMIN_FOC_TOPBAR_HEIGHT } from '../../../navigation/adminFocConfig';
import { spacing } from '../../../theme/designTokens';

interface AdminFocTopBarProps {
  title: string;
  subtitle?: string;
  onSearch: () => void;
  onNotifications: () => void;
  notificationCount: number;
  onMenu?: () => void;
  showMenu?: boolean;
}

export const AdminFocTopBar: React.FC<AdminFocTopBarProps> = ({
  title,
  subtitle,
  onSearch,
  onNotifications,
  notificationCount,
  onMenu,
  showMenu = false,
}) => {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.bar}>
      <LinearGradient
        colors={[adminChrome.atmosphereTop, adminChrome.shellElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.signalLine} />

      {showMenu && onMenu ? (
        <PressableSpring onPress={onMenu} style={styles.iconBtn} scaleTo={0.94} haptic>
          <Icon name="menu" size={20} color={adminChrome.text} />
        </PressableSpring>
      ) : null}

      <View style={styles.titleCol}>
        <Text style={styles.kicker}>ProDay OPS</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <PressableSpring onPress={onSearch} style={styles.iconBtnAccent} scaleTo={0.94} haptic>
          <Icon name="search" size={17} color={adminChrome.accentHot} />
        </PressableSpring>

        <PressableSpring onPress={onNotifications} style={styles.iconBtn} scaleTo={0.94} haptic>
          <Icon name="notifications" size={17} color={adminChrome.text} />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          ) : null}
        </PressableSpring>
      </View>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    bar: {
      height: ADMIN_FOC_TOPBAR_HEIGHT + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: adminChrome.shell,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
      overflow: 'hidden',
    },
    signalLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: adminChrome.accent,
      opacity: 0.65,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: adminChrome.radiusSm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    iconBtnAccent: {
      width: 38,
      height: 38,
      borderRadius: adminChrome.radiusSm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: adminChrome.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.accentMuted,
    },
    titleCol: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    kicker: {
      color: adminChrome.accentHot,
      fontFamily: adminType.bodyExtra,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    title: {
      color: adminChrome.text,
      fontFamily: adminType.display,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    subtitle: {
      color: adminChrome.textMuted,
      fontFamily: adminType.body,
      fontSize: 11,
      marginTop: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      borderRadius: 5,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 2,
      borderColor: adminChrome.shell,
    },
    badgeText: {
      color: ADMIN_ON_ACCENT,
      fontFamily: adminType.bodyExtra,
      fontSize: 9,
      fontWeight: '800',
    },
  });
}
