import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminSectionHeaderProps {
  title: string;
  count?: number;
  hint?: string;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({ title, count, hint }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.accent} />
        <View>
          <Text style={styles.title}>{title}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      </View>
      {count !== undefined ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    accent: {
      width: 4,
      height: 18,
      borderRadius: 2,
      backgroundColor: adminChrome.accent,
    },
    title: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    hint: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: '600',
      marginTop: 2,
    },
    badge: {
      backgroundColor: adminChrome.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      minWidth: 28,
      alignItems: 'center',
    },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  });
}
