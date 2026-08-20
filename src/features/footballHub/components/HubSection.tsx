import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { FOOTBALL_HUB } from '../theme/footballHubTheme';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  emptyLabel?: string;
  loading?: boolean;
};

export const HubSection: React.FC<Props> = ({
  title,
  actionLabel,
  onAction,
  children,
  emptyLabel,
  loading,
}) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <ProDayText variant="caption" style={styles.action}>
            {actionLabel}
          </ProDayText>
        </Pressable>
      ) : null}
    </View>
    {loading ? (
      <View style={styles.emptyCard}>
        <ProDayText variant="caption" style={styles.muted}>
          Chargement…
        </ProDayText>
      </View>
    ) : emptyLabel ? (
      <View style={styles.emptyCard}>
        <ProDayText variant="body" style={styles.muted}>
          {emptyLabel}
        </ProDayText>
      </View>
    ) : (
      children
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: FOOTBALL_HUB.foreground,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  action: { color: FOOTBALL_HUB.bright },
  muted: { color: FOOTBALL_HUB.muted },
  emptyCard: {
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
});
