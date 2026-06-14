import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { Icon } from '../ui/Icon';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

type SeasonTab = 'next' | 'agenda';

interface DashboardSeasonPanelProps {
  nextItem: SeasonCalendarItem | null;
  items: SeasonCalendarItem[];
  pendingConvocations: number;
  onNextPress: () => void;
  onItemPress: (item: SeasonCalendarItem) => void;
  onSeeAll: () => void;
  onConvocationsPress?: () => void;
}

export const DashboardSeasonPanel: React.FC<DashboardSeasonPanelProps> = ({
  nextItem,
  items,
  pendingConvocations,
  onNextPress,
  onItemPress,
  onSeeAll,
  onConvocationsPress,
}) => {
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<SeasonTab>('next');

  return (
    <ProDaySurface variant="elevated" accentBar style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="eyebrow" accent>
          Ma saison
        </ProDayText>
        <PressableSpring onPress={onSeeAll} scaleTo={0.96}>
          <ProDayText variant="caption" accent>
            Tout voir →
          </ProDayText>
        </PressableSpring>
      </View>

      <View style={styles.tabs}>
        <TabChip
          label="À venir"
          active={tab === 'next'}
          onPress={() => setTab('next')}
        />
        <TabChip
          label={`Agenda (${items.length})`}
          active={tab === 'agenda'}
          onPress={() => setTab('agenda')}
        />
      </View>

      {pendingConvocations > 0 && onConvocationsPress ? (
        <PressableSpring
          style={[styles.pendingBanner, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}
          onPress={onConvocationsPress}
          scaleTo={0.98}
          haptic
        >
          <Icon name="calendar" size={16} color={colors.accent} variant="filled" />
          <ProDayText variant="caption" accent style={styles.pendingText}>
            {pendingConvocations} convocation{pendingConvocations > 1 ? 's' : ''} en attente
          </ProDayText>
          <Icon name="chevron-forward" size={14} color={colors.accent} />
        </PressableSpring>
      ) : null}

      {tab === 'next' ? (
        nextItem ? (
          <PressableSpring
            style={[styles.eventCard, { borderColor: colors.border }]}
            onPress={onNextPress}
            scaleTo={0.98}
            haptic
          >
            <ProDayGradient kind="card" style={styles.dateChip}>
              <ProDayText variant="caption" inverse style={styles.dateChipText}>
                {formatCalendarDate(nextItem.starts_at)}
              </ProDayText>
            </ProDayGradient>
            <View style={styles.eventBody}>
              <ProDayText variant="title">{nextItem.title}</ProDayText>
              <ProDayText variant="body" muted numberOfLines={1}>
                {nextItem.subtitle} · {nextItem.city}
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.accent} />
          </PressableSpring>
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
            <Icon name="calendar" size={28} color={colors.textMuted} />
            <ProDayText variant="section" style={styles.emptyTitle}>
              Rien de prévu
            </ProDayText>
            <ProDayText variant="body" muted style={styles.emptySub}>
              Consultez le calendrier ou proposez un match.
            </ProDayText>
            <PressableSpring onPress={onSeeAll} scaleTo={0.97} haptic>
              <ProDayGradient kind="cta" style={styles.emptyCta}>
                <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                  Ouvrir Matchs
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>
          </View>
        )
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agendaScroll}
        >
          {items.length === 0 ? (
            <ProDayText variant="body" muted style={styles.agendaEmpty}>
              Aucun événement cette saison.
            </ProDayText>
          ) : (
            items.slice(0, 8).map((item, index) => (
              <StaggerReveal key={item.id} index={index}>
                <PressableSpring
                  style={[styles.agendaCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                  onPress={() => onItemPress(item)}
                  scaleTo={0.96}
                  haptic
                >
                  <ProDayText variant="caption" accent>
                    {formatCalendarDate(item.starts_at)}
                  </ProDayText>
                  <ProDayText variant="section" numberOfLines={2} style={styles.agendaTitle}>
                    {item.title}
                  </ProDayText>
                </PressableSpring>
              </StaggerReveal>
            ))
          )}
        </ScrollView>
      )}
    </ProDaySurface>
  );
};

const TabChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => {
  const { colors } = useAppTheme();
  return (
    <PressableSpring
      style={[
        styles.tabChip,
        active
          ? { backgroundColor: colors.ink }
          : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}
      onPress={onPress}
      scaleTo={0.96}
    >
      <ProDayText
        variant="caption"
        inverse={active}
        style={!active ? { color: colors.textSecondary } : undefined}
      >
        {label}
      </ProDayText>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, padding: spacing.md },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  pendingText: { flex: 1, fontWeight: '700' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  dateChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  dateChipText: { fontWeight: '800', fontSize: 11 },
  eventBody: { flex: 1, gap: 2 },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emptyTitle: { marginTop: spacing.xs },
  emptySub: { textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyCtaText: { fontWeight: '800' },
  agendaScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
  agendaCard: {
    width: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  agendaTitle: { fontSize: 13 },
  agendaEmpty: { paddingVertical: spacing.lg },
});
