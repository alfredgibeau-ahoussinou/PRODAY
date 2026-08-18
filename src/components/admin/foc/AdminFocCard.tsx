import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../motion';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

interface AdminFocCardProps {
  children: React.ReactNode;
  title?: string;
  action?: { label: string; onPress: () => void };
}

export const AdminFocCard: React.FC<AdminFocCardProps> = ({ children, title, action }) => {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      {(title || action) ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {action ? (
            <PressableSpring onPress={action.onPress} scaleTo={0.95}>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </PressableSpring>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radiusLg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      overflow: 'hidden',
      shadowColor: adminChrome.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 2,
    },
    accentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: adminChrome.accent,
      opacity: 0.55,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: adminType.display,
      fontSize: 16,
      fontWeight: '800',
      color: adminChrome.text,
      letterSpacing: -0.3,
    },
    actionLabel: {
      fontFamily: adminType.bodyBold,
      fontSize: 12,
      fontWeight: '700',
      color: adminChrome.accent,
    },
  });
}
