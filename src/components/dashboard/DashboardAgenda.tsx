import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { PressableSpring, StaggerReveal } from '../motion';
import { Icon } from '../ui/Icon';
import { RichEmptyState } from '../ui/RichEmptyState';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

interface DashboardAgendaProps {
  items: SeasonCalendarItem[];
  onPressItem: (item: SeasonCalendarItem) => void;
  onSeeAll: () => void;
}

export const DashboardAgenda: React.FC<DashboardAgendaProps> = ({
  items,
  onPressItem,
  onSeeAll,
}) => {
  const { colors: c } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.brand }]}>AGENDA SAISON</Text>
        <PressableSpring onPress={onSeeAll} scaleTo={0.96} haptic>
          <Text style={[styles.link, { color: c.brand }]}>Tout voir</Text>
        </PressableSpring>
      </View>

      {items.length === 0 ? (
        <RichEmptyState
          title="Votre calendrier vous attend"
          subtitle="Convocations, matchs amicaux et détections — tout converge ici dès votre prochain événement."
          actionLabel="Ouvrir Matchs"
          onAction={onSeeAll}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {items.map((item, index) => (
            <StaggerReveal key={item.id} index={index} delayStep={50}>
              <PressableSpring
                style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => onPressItem(item)}
                scaleTo={0.96}
                haptic
              >
                <View style={styles.chipTop}>
                  <Icon
                    name={item.kind === 'friendly_match' ? 'handshake' : 'calendar'}
                    size={14}
                    color={c.brand}
                  />
                  <Text style={[styles.chipDate, { color: c.brand }]} numberOfLines={1}>
                    {formatCalendarDate(item.starts_at)}
                  </Text>
                </View>
                <Text style={[styles.chipTitle, { color: c.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.chipSub, { color: c.textMuted }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </PressableSpring>
            </StaggerReveal>
          ))}
        </ScrollView>
      )}
    </View>
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
  link: { fontSize: 12, fontWeight: '800' },
  rail: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    width: 148,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chipTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  chipDate: { fontSize: 11, fontWeight: '800', flex: 1 },
  chipTitle: { fontSize: 13, fontWeight: '800', lineHeight: 17 },
  chipSub: { fontSize: 11, marginTop: 4 },
});
