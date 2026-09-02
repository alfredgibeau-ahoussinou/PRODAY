import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useMatchSkinTokens } from './matchCenterUi';
import { spacing } from '../../theme/designTokens';

interface MatchCalendarCardProps {
  kindLabel: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  city: string;
  linkLabel: string;
  onPress: () => void;
  onExportCalendar?: () => void;
}

export const MatchCalendarCard: React.FC<MatchCalendarCardProps> = ({
  kindLabel,
  dateLabel,
  title,
  subtitle,
  city,
  linkLabel,
  onPress,
  onExportCalendar,
}) => {
  const skin = useMatchSkinTokens();
  const styles = useMemo(() => createStyles(skin), [skin]);

  return (
    <PressableSpring
      style={[styles.card, { borderColor: skin.border }]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.bar, { backgroundColor: skin.accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText variant="caption" style={[styles.kind, { color: skin.accent }]}>
            {kindLabel}
          </ProDayText>
          <View style={styles.topRight}>
            <ProDayText variant="caption" style={[styles.date, { color: skin.muted }]}>
              {dateLabel}
            </ProDayText>
            {onExportCalendar ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onExportCalendar();
                }}
                hitSlop={8}
                style={styles.calendarBtn}
                accessibilityRole="button"
                accessibilityLabel="Ajouter au calendrier"
              >
                <Icon name="calendar" size={14} color={skin.accent} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <ProDayText variant="section" numberOfLines={2} style={[styles.title, { color: skin.foreground }]}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.meta, { color: skin.muted }]} numberOfLines={1}>
          {subtitle} · {city}
        </ProDayText>
        <ProDayText variant="caption" style={[styles.link, { color: skin.accent }]}>
          {linkLabel}
        </ProDayText>
      </View>
    </PressableSpring>
  );
};

function createStyles(skin: ReturnType<typeof useMatchSkinTokens>) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: skin.surface,
      borderRadius: skin.cardRadius,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    bar: { width: 3 },
    body: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: 4,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    topRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    calendarBtn: {
      padding: 2,
      borderRadius: 4,
    },
    kind: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontSize: 9,
      fontWeight: '800',
    },
    date: { fontSize: 10, fontWeight: '600' },
    title: { fontWeight: '800' },
    meta: { fontSize: 12 },
    link: {
      marginTop: 2,
      fontWeight: '800',
      fontSize: 11,
    },
  });
}
