import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

interface DashboardNextUpProps {
  item: SeasonCalendarItem | null;
  pendingCount: number;
  onPress: () => void;
  onConvocationsPress?: () => void;
}

export const DashboardNextUp: React.FC<DashboardNextUpProps> = ({
  item,
  pendingCount,
  onPress,
  onConvocationsPress,
}) => {
  const { colors: c } = useAppTheme();

  return (
    <AnimatedEntrance kind="fadeUp" index={1}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: c.brand }]}>PROCHAIN RENDEZ-VOUS</Text>
          {pendingCount > 0 && onConvocationsPress ? (
            <PressableSpring
              style={[
                styles.pendingChip,
                { backgroundColor: c.accentSoft, borderColor: c.brand },
              ]}
              onPress={onConvocationsPress}
              scaleTo={0.94}
              haptic
            >
              <Text style={[styles.pendingText, { color: c.brand }]}>
                {pendingCount} convoc. en attente
              </Text>
            </PressableSpring>
          ) : null}
        </View>

        {item ? (
          <PressableSpring
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={onPress}
            scaleTo={0.97}
            haptic
          >
            <View style={[styles.accentBar, { backgroundColor: c.brand }]} />
            <View style={styles.body}>
              <Text style={[styles.date, { color: c.brand }]}>{formatCalendarDate(item.starts_at)}</Text>
              <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.sub, { color: c.textSecondary }]}>
                {item.subtitle} · {item.city}
              </Text>
              <View style={styles.ctaRow}>
                <Text style={[styles.cta, { color: c.brand }]}>
                  {item.team_event_id
                    ? 'Voir la convocation'
                    : item.friendly_match_id
                      ? 'Voir le match amical'
                      : 'Voir le calendrier'}
                </Text>
                <Icon name="chevron-forward" size={16} color={c.brand} />
              </View>
            </View>
          </PressableSpring>
        ) : (
          <View
            style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Icon name="calendar" size={28} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>Aucun événement planifié</Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>
              Créez une convocation ou proposez un match amical.
            </Text>
            <PressableSpring
              style={[styles.emptyBtn, { backgroundColor: c.brand }]}
              onPress={onPress}
              scaleTo={0.96}
              haptic
            >
              <Text style={[styles.emptyBtnText, { color: c.brandInverse }]}>Ouvrir la saison</Text>
            </PressableSpring>
          </View>
        )}
      </View>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pendingChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pendingText: { fontSize: 10, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: { width: 5 },
  body: { flex: 1, padding: spacing.lg },
  date: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  sub: { fontSize: 13, marginTop: 4 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  cta: { fontSize: 12, fontWeight: '800' },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  emptyTitle: { fontWeight: '900', fontSize: 15, marginTop: spacing.sm },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  emptyBtnText: { fontWeight: '800', fontSize: 13 },
});
