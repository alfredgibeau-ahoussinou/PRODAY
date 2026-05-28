import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from './ui/Icon';
import type { OrganizerReminderItem } from '../hooks/useOrganizerReminders';
import { colors, spacing, radius } from '../theme/designTokens';

interface OrganizerReminderCardProps {
  items: OrganizerReminderItem[];
  loading: boolean;
  onPress: () => void;
  onRemind?: (eventId: string) => void;
  remindingId?: string | null;
}

export const OrganizerReminderCard: React.FC<OrganizerReminderCardProps> = ({
  items,
  loading,
  onPress,
  onRemind,
  remindingId,
}) => {
  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (items.length === 0) return null;

  const totalPending = items.reduce((s, i) => s + i.pendingCount, 0);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.main} onPress={onPress} activeOpacity={0.9}>
        <Icon name="notifications" size={22} color={colors.accent} />
        <View style={styles.body}>
          <Text style={styles.title}>Convocations en attente</Text>
          <Text style={styles.sub}>
            {totalPending} réponse{totalPending > 1 ? 's' : ''} · {items.length} événement
            {items.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.accent} />
      </TouchableOpacity>
      {onRemind &&
        items.slice(0, 2).map(({ event, pendingCount }) => (
          <TouchableOpacity
            key={event.id}
            style={styles.remindBtn}
            onPress={() => onRemind(event.id)}
            disabled={remindingId === event.id}
          >
            {remindingId === event.id ? (
              <ActivityIndicator color={colors.brandInverse} size="small" />
            ) : (
              <Text style={styles.remindText}>
                Relancer « {event.title} » ({pendingCount})
              </Text>
            )}
          </TouchableOpacity>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '900', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  remindBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,51,153,0.2)',
  },
  remindText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
