import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CoachChapterScroll, CoachText } from '../../../components/coach/coachPortalUi';
import { CoachPane } from '../../../components/coach/CoachScreenHeader';
import { Icon } from '../../../components/ui/Icon';
import { COACH_SITE, getCoachPageIdentity } from '../../../content/coachPageIdentity';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { useCoachShellNav } from './CoachShellNavContext';
import { radius, spacing } from '../../../theme/designTokens';

type Props = {
  items: CoachNavResolvedItem[];
};

/** Hub Menu — grille statique SportEasy (sans bounce). */
export function CoachMenuPane({ items }: Props) {
  const shellNav = useCoachShellNav();
  const styles = useMemo(() => createStyles(), []);

  return (
    <CoachPane title={getCoachPageIdentity('plus').title}>
      <CoachChapterScroll>
        <CoachText variant="caption" muted style={styles.lead}>
          Tous les outils de gestion d&apos;équipe au même endroit.
        </CoachText>
        <View style={styles.grid}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => shellNav?.requestNav(item.id)}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ disabled: item.locked }}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={item.icon}
                  size={22}
                  color={item.locked ? COACH_SITE.muted : COACH_SITE.accent}
                  variant="outline"
                />
                {item.aiBadge ? <View style={styles.aiDot} /> : null}
                {item.locked ? (
                  <View style={styles.lockBadge}>
                    <Icon name="lock" size={10} color={COACH_SITE.muted} />
                  </View>
                ) : null}
              </View>
              <CoachText variant="caption" style={styles.tileLabel} numberOfLines={2}>
                {item.label}
              </CoachText>
              {item.hint ? (
                <CoachText variant="caption" muted numberOfLines={2} style={styles.tileHint}>
                  {item.hint}
                </CoachText>
              ) : null}
            </Pressable>
          ))}
        </View>
      </CoachChapterScroll>
    </CoachPane>
  );
}

function createStyles() {
  return StyleSheet.create({
    lead: {
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    tile: {
      width: '48%',
      flexGrow: 1,
      minWidth: 148,
      backgroundColor: COACH_SITE.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: COACH_SITE.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'flex-start',
      gap: 6,
    },
    tilePressed: {
      backgroundColor: COACH_SITE.elevated,
      opacity: 0.92,
    },
    iconWrap: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COACH_SITE.bg,
    },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COACH_SITE.accent,
    },
    lockBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COACH_SITE.elevated,
    },
    tileLabel: {
      fontWeight: '700',
      color: COACH_SITE.foreground,
      fontSize: 13,
    },
    tileHint: {
      fontSize: 11,
      lineHeight: 14,
    },
  });
}
