import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../motion';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

export interface AdminFocActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  kind: string;
}

interface AdminFocActivityFeedProps {
  items: AdminFocActivityItem[];
  onPressItem?: (id: string) => void;
}

const KIND_BAR: Record<string, string> = {
  match: adminChrome.pitch,
  user: adminChrome.accent,
  post: adminChrome.accentHot,
  event: adminChrome.pitch,
  club: adminChrome.accent,
  payment: adminChrome.warning,
  moderation: adminChrome.danger,
  default: adminChrome.accentMuted,
};

function barColor(kind: string): string {
  return KIND_BAR[kind] ?? KIND_BAR.default;
}

export const AdminFocActivityFeed: React.FC<AdminFocActivityFeedProps> = ({
  items,
  onPressItem,
}) => {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Activité récente</Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune activité récente.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const row = (
              <View style={styles.row}>
                <View style={[styles.bar, { backgroundColor: barColor(item.kind) }]} />
                <View style={styles.copy}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={styles.time}>{item.timeLabel}</Text>
              </View>
            );

            if (!onPressItem) {
              return <View key={item.id}>{row}</View>;
            }

            return (
              <PressableSpring
                key={item.id}
                onPress={() => onPressItem(item.id)}
                scaleTo={0.98}
              >
                {row}
              </PressableSpring>
            );
          })}
        </View>
      )}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    header: {
      fontFamily: adminType.display,
      fontSize: 16,
      fontWeight: '800',
      color: adminChrome.text,
      letterSpacing: -0.3,
    },
    list: {
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: adminChrome.shellMid,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      paddingVertical: 12,
      paddingRight: spacing.md,
      overflow: 'hidden',
    },
    bar: {
      width: 3,
      alignSelf: 'stretch',
      marginLeft: 0,
      borderRadius: 2,
    },
    copy: {
      flex: 1,
      gap: 2,
      marginLeft: spacing.xs,
    },
    title: {
      fontFamily: adminType.bodyBold,
      fontSize: 13,
      fontWeight: '700',
      color: adminChrome.text,
    },
    sub: {
      fontFamily: adminType.body,
      fontSize: 11,
      color: adminChrome.textMuted,
      lineHeight: 15,
    },
    time: {
      fontFamily: adminType.bodySemi,
      fontSize: 10,
      fontWeight: '600',
      color: adminChrome.textMuted,
    },
    empty: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: adminType.body,
      fontSize: 13,
      color: adminChrome.textMuted,
    },
  });
}
