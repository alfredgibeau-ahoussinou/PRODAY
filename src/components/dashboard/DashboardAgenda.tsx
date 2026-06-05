import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useShowcaseImages } from '../../hooks/useShowcaseImages';
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
  const showcase = useShowcaseImages();
  const { colors: c } = useAppTheme();
  return (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <Text style={[styles.eyebrow, { color: c.brand }]}>AGENDA SAISON</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={[styles.link, { color: c.brand }]}>Tout voir</Text>
      </TouchableOpacity>
    </View>

    {items.length === 0 ? (
      <RichEmptyState
        title="Votre calendrier vous attend"
        subtitle="Convocations, matchs amicaux, détections et tournois Arena — tout converge ici dès votre prochain événement."
        image={showcase.friendlyMatch}
        actionLabel="Ouvrir Matchs"
        onAction={onSeeAll}
      />
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => onPressItem(item)}
            activeOpacity={0.85}
          >
            {item.kind === 'tournament' ? (
              <Image
                source={showcase.arenaTournament}
                style={styles.chipImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.chipTop}>
              <Icon
                name={
                  item.kind === 'friendly_match'
                    ? 'handshake'
                    : item.kind === 'tournament'
                      ? 'trophy'
                      : 'calendar'
                }
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
          </TouchableOpacity>
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
  chipImage: {
    width: '100%',
    height: 48,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    marginHorizontal: -spacing.xs,
    marginTop: -spacing.xs,
  },
  chipTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  chipDate: { fontSize: 10, fontWeight: '700', flex: 1 },
  chipTitle: { fontSize: 13, fontWeight: '800', lineHeight: 16 },
  chipSub: { fontSize: 10, marginTop: 4 },
});
