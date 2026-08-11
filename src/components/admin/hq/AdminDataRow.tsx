import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

type Props = {
  priority?: string;
  title: string;
  subtitle: string;
  trailing?: string;
  selected?: boolean;
  onPress: () => void;
};

/** Dense list row — replaces AdminEntityCard in HQ modes. */
export function AdminDataRow({
  priority,
  title,
  subtitle,
  trailing,
  selected,
  onPress,
}: Props) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      {priority ? (
        <Text style={[styles.prio, priority === 'critical' && styles.prioCritical]}>
          {priority.slice(0, 1).toUpperCase()}
        </Text>
      ) : (
        <View style={styles.prioSpacer} />
      )}
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
      backgroundColor: 'transparent',
    },
    rowSelected: {
      backgroundColor: adminChrome.rowActive,
    },
    prio: {
      width: 18,
      fontFamily: adminChrome.mono,
      fontSize: 11,
      fontWeight: '800',
      color: adminChrome.textMuted,
      textAlign: 'center',
    },
    prioCritical: { color: adminChrome.danger },
    prioSpacer: { width: 18 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      color: adminChrome.text,
      fontSize: 14,
      fontWeight: '600',
    },
    subtitle: {
      color: adminChrome.textMuted,
      fontSize: 12,
    },
    trailing: {
      fontFamily: adminChrome.mono,
      fontSize: 10,
      color: adminChrome.textMuted,
    },
  });
}
