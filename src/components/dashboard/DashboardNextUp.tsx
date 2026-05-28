import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

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
}) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.eyebrow}>PROCHAIN RENDEZ-VOUS</Text>
      {pendingCount > 0 && onConvocationsPress ? (
        <TouchableOpacity style={styles.pendingChip} onPress={onConvocationsPress}>
          <Text style={styles.pendingText}>{pendingCount} convoc. en attente</Text>
        </TouchableOpacity>
      ) : null}
    </View>

    {item ? (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.accentBar} />
        <View style={styles.body}>
          <Text style={styles.date}>{formatCalendarDate(item.starts_at)}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>
            {item.subtitle} · {item.city}
          </Text>
          <View style={styles.ctaRow}>
            <Text style={styles.cta}>
              {item.team_event_id
                ? 'Voir la convocation'
                : item.friendly_match_id
                  ? 'Voir le match amical'
                  : item.tournament_id
                    ? 'Voir le tournoi'
                    : 'Voir le calendrier'}
            </Text>
            <Icon name="chevron-forward" size={16} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    ) : (
      <View style={styles.empty}>
        <Icon name="calendar" size={28} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucun événement planifié</Text>
        <Text style={styles.emptySub}>
          Créez une convocation ou proposez un match amical.
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onPress}>
          <Text style={styles.emptyBtnText}>Ouvrir la saison</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  pendingChip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pendingText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 5, backgroundColor: colors.accent },
  body: { flex: 1, padding: spacing.lg },
  date: { fontSize: 11, fontWeight: '800', color: colors.accent },
  title: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 4 },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  cta: { fontSize: 12, fontWeight: '800', color: colors.accent },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontWeight: '900', fontSize: 15, marginTop: spacing.sm, color: colors.text },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  emptyBtnText: { color: colors.brandInverse, fontWeight: '800', fontSize: 13 },
});
