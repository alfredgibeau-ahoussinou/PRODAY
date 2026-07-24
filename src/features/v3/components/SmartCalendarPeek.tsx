import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing } from '../../../theme/designTokens';
import type { SmartCalendarEntry } from '../models/calendar';

interface SmartCalendarPeekProps {
  today: SmartCalendarEntry[];
  upcoming: SmartCalendarEntry[];
  onPress?: () => void;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export const SmartCalendarPeek: React.FC<SmartCalendarPeekProps> = ({ today, upcoming, onPress }) => {
  const { colors } = useAppTheme();
  const items = today.length > 0 ? today : upcoming.slice(0, 3);

  const card = (
    <GlassCard variant="default" style={styles.card}>
      <ProDayText variant="eyebrow" muted style={styles.eyebrow}>
        Calendrier
      </ProDayText>
      <ProDayText variant="section">
        {today.length > 0 ? "Aujourd'hui" : 'À venir'}
      </ProDayText>
      {items.length === 0 ? (
        <ProDayText variant="body" muted>
          Aucun événement planifié. Des objectifs apparaîtront ici.
        </ProDayText>
      ) : (
        <View style={styles.list}>
          {items.map((entry) => (
            <View key={entry.id} style={[styles.row, { borderColor: colors.border }]}>
              <ProDayText variant="caption" accent style={styles.time}>
                {formatTime(entry.startsAt)}
              </ProDayText>
              <View style={styles.copy}>
                <ProDayText variant="caption" accent style={styles.title}>
                  {entry.title}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {entry.subtitle}
                </ProDayText>
              </View>
            </View>
          ))}
        </View>
      )}
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  time: { fontWeight: '800', fontSize: 12, minWidth: 44 },
  copy: { flex: 1 },
  title: { fontWeight: '700', fontSize: 12 },
});
