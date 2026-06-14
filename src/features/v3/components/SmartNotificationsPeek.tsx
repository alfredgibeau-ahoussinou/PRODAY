import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing } from '../../../theme/designTokens';
import type {
  NotificationKind,
  PrioritizedNotification,
} from '../../../core/notifications/notificationPriority.engine';

interface SmartNotificationsPeekProps {
  push: PrioritizedNotification[];
  inboxPreview: PrioritizedNotification[];
  total: number;
  onPress?: () => void;
}

const KIND_LABEL: Record<NotificationKind, string> = {
  health: 'Santé',
  match: 'Match',
  opportunity: 'Mercato',
  social: 'Social',
};

const KIND_COLOR: Record<NotificationKind, string> = {
  health: '#0F766E',
  match: '#2563EB',
  opportunity: '#D97706',
  social: '#7C3AED',
};

export const SmartNotificationsPeek: React.FC<SmartNotificationsPeekProps> = ({
  push,
  inboxPreview,
  total,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const items = [...push, ...inboxPreview].slice(0, 3);

  const card = (
    <GlassCard variant="default" style={styles.card}>
      <ProDayText variant="eyebrow" muted style={styles.eyebrow}>
        Notifications intelligentes
      </ProDayText>
      <ProDayText variant="section">
        {push.length > 0 ? 'Prioritaires' : 'Inbox'}
      </ProDayText>
      {items.length === 0 ? (
        <ProDayText variant="body" muted>
          Aucune alerte — votre journée est sous contrôle.
        </ProDayText>
      ) : (
        <View style={styles.list}>
          {items.map((entry) => (
            <View key={entry.id} style={[styles.row, { borderColor: colors.border }]}>
              <View style={[styles.badge, { backgroundColor: `${KIND_COLOR[entry.kind]}22` }]}>
                <ProDayText
                  variant="caption"
                  style={[styles.badgeText, { color: KIND_COLOR[entry.kind] }]}
                >
                  {KIND_LABEL[entry.kind]}
                </ProDayText>
              </View>
              <View style={styles.copy}>
                <ProDayText variant="caption" accent style={styles.title}>
                  {entry.title}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {entry.body}
                </ProDayText>
              </View>
            </View>
          ))}
        </View>
      )}
      {total > items.length ? (
        <ProDayText variant="caption" muted>
          +{total - items.length} autre(s) notification(s)
        </ProDayText>
      ) : null}
    </GlassCard>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} accessibilityRole="button" scaleTo={0.99} haptic>
        {card}
      </PressableSpring>
    );
  }

  return card;
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  eyebrow: { fontSize: 10, letterSpacing: 2 },
  list: { gap: spacing.xs, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 52,
    alignItems: 'center',
  },
  badgeText: { fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },
  copy: { flex: 1 },
  title: { fontWeight: '700', fontSize: 12 },
});
