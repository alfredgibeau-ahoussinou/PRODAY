import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from './ui/Icon';
import { LivePulseDot, PressableSpring, SkeletonList, StaggerReveal } from './motion';
import type { OrganizerReminderItem } from '../hooks/useOrganizerReminders';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

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
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <SkeletonList count={1} variant="row" />
      </View>
    );
  }
  if (items.length === 0) return null;

  const totalPending = items.reduce((s, i) => s + i.pendingCount, 0);

  return (
    <View style={styles.wrap}>
      <PressableSpring style={styles.main} onPress={onPress} scaleTo={0.98} haptic>
        <Icon name="notifications" size={22} color={c.brand} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <LivePulseDot active size={8} color={c.brand} inactiveColor={c.brandSoft} />
            <Text style={styles.title}>Convocations en attente</Text>
          </View>
          <Text style={styles.sub}>
            {totalPending} réponse{totalPending > 1 ? 's' : ''} · {items.length} événement
            {items.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={c.brand} />
      </PressableSpring>
      {onRemind &&
        items.slice(0, 2).map(({ event, pendingCount }, index) => (
          <StaggerReveal key={event.id} index={index}>
            <PressableSpring
              style={styles.remindBtn}
              onPress={() => onRemind(event.id)}
              disabled={remindingId === event.id}
              scaleTo={0.98}
              haptic={remindingId !== event.id}
            >
              {remindingId === event.id ? (
                <ActivityIndicator color={c.brandInverse} size="small" />
              ) : (
                <Text style={styles.remindText}>
                  Relancer « {event.title} » ({pendingCount})
                </Text>
              )}
            </PressableSpring>
          </StaggerReveal>
        ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.brandSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.brand,
      overflow: 'hidden',
    },
    main: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 14, fontWeight: '900', color: c.text },
    sub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    remindBtn: {
      backgroundColor: c.brand,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,51,153,0.2)',
    },
    remindText: { color: c.brandInverse, fontWeight: '800', fontSize: 12 },
  });
}
