/**
 * Composition visuelle Accueil Coach — hero jour J + raccourcis hubs.
 * Tokens CoachTheme (bleu PRODAY / équipe), pas navy Club.
 */
import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { CoachText } from './coachPortalUi';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';
import type { TeamEvent } from '../../models/TeamEvent';
import {
  coachDayPriorityKicker,
  coachDayPrioritySubtitle,
  formatCoachCalendarDateStack,
  type CoachDayPriority,
} from '../../utils/coachCalendarHome';
import { coachChrome } from '../../features/coach/theme/coachDesignSystem';

export type CoachCockpitShortcut = {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
};

/** Raccourcis vers hubs existants. */
export function CoachCockpitShortcutRow({ items }: { items: CoachCockpitShortcut[] }) {
  const { tokens } = useCoachTheme();
  const { width } = useWindowDimensions();
  const cols = coachChrome.dashboardCols(width);
  const styles = useMemo(() => shortcutStyles(tokens, cols), [tokens, cols]);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={item.onPress}
          scaleTo={0.97}
          haptic
          style={styles.chip}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Icon name={item.icon} size={14} color={tokens.accent} />
          <CoachText variant="caption" style={styles.chipLabel}>
            {item.label}
          </CoachText>
        </PressableSpring>
      ))}
    </View>
  );
}

/** Hero priorité jour J / live. */
export function CoachDayPriorityHero({
  priority,
  onOpenHub,
  onPointage,
  onComposition,
  onLive,
}: {
  priority: Exclude<CoachDayPriority, { kind: 'calm' }>;
  onOpenHub: () => void;
  onPointage: () => void;
  onComposition?: () => void;
  onLive?: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  const event = priority.event;
  const stack = formatCoachCalendarDateStack(event.starts_at);
  const isLive = priority.kind === 'live';
  const isMatch = priority.kind === 'match' || isLive;

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[tokens.soft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: isLive ? '#FF3B30' : tokens.accent }]} />

        <View style={styles.top}>
          <View style={[styles.iconBadge, { backgroundColor: tokens.soft }]}>
            <Icon
              name={isMatch ? 'trophy' : 'football'}
              size={22}
              color={isLive ? '#FF3B30' : tokens.accent}
            />
          </View>
          <View style={styles.copy}>
            <CoachText variant="caption" style={[styles.kicker, { color: tokens.accent }]}>
              {coachDayPriorityKicker(priority.kind)}
            </CoachText>
            <CoachText variant="section" numberOfLines={2} style={styles.title}>
              {event.title}
            </CoachText>
            <CoachText variant="caption" muted numberOfLines={2}>
              {stack.weekday} {stack.day} {stack.month} · {stack.time}
            </CoachText>
            <CoachText variant="caption" muted numberOfLines={2}>
              {coachDayPrioritySubtitle(priority)}
            </CoachText>
          </View>
          {isLive ? (
            <View style={styles.livePill}>
              <CoachText variant="caption" style={styles.livePillText}>
                LIVE
              </CoachText>
            </View>
          ) : null}
        </View>

        <View style={styles.ctaRow}>
          {isLive && onLive ? (
            <PressableSpring onPress={onLive} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <CoachText variant="caption" style={[styles.ctaPrimaryLabel, { color: tokens.onAccent }]}>
                Ouvrir le live
              </CoachText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
          ) : (
            <PressableSpring onPress={onOpenHub} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <CoachText variant="caption" style={[styles.ctaPrimaryLabel, { color: tokens.onAccent }]}>
                {isMatch ? 'Fiche match' : 'Fiche séance'}
              </CoachText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
          )}
          <PressableSpring
            onPress={onPointage}
            scaleTo={0.97}
            haptic
            style={[styles.ctaGhost, { borderColor: tokens.border }]}
          >
            <Icon name="checkmark-circle" size={13} color={tokens.foreground} />
            <CoachText variant="caption" style={styles.ctaGhostLabel}>
              Pointage
            </CoachText>
          </PressableSpring>
          {isMatch && onComposition ? (
            <PressableSpring
              onPress={onComposition}
              scaleTo={0.97}
              haptic
              style={[styles.ctaGhost, { borderColor: tokens.border }]}
            >
              <Icon name="people" size={13} color={tokens.foreground} />
              <CoachText variant="caption" style={styles.ctaGhostLabel}>
                Compo
              </CoachText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Empty premium Accueil. */
export function CoachDayCalmEmpty({
  onCreate,
  onPlanning,
}: {
  onCreate: () => void;
  onPlanning?: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => emptyStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.box}>
        <LinearGradient
          colors={[tokens.soft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.iconWrap, { backgroundColor: tokens.soft }]}>
          <Icon name="calendar" size={22} color={tokens.accent} />
        </View>
        <CoachText variant="section" style={styles.title}>
          Rien de prévu pour l’instant
        </CoachText>
        <CoachText variant="caption" muted style={styles.body}>
          Créez un match ou un entraînement — le jour J s’affichera ici avec pointage et
          convocations.
        </CoachText>
        <View style={styles.ctaRow}>
          <PressableSpring onPress={onCreate} scaleTo={0.97} haptic style={styles.ctaPrimary}>
            <CoachText variant="caption" style={[styles.ctaPrimaryLabel, { color: tokens.onAccent }]}>
              Créer
            </CoachText>
          </PressableSpring>
          {onPlanning ? (
            <PressableSpring
              onPress={onPlanning}
              scaleTo={0.97}
              haptic
              style={[styles.ctaGhost, { borderColor: tokens.border }]}
            >
              <CoachText variant="caption" style={styles.ctaGhostLabel}>
                Planning
              </CoachText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

function heroStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      padding: spacing.md,
      gap: spacing.md,
      overflow: 'hidden',
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    kicker: {
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    title: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 20,
      letterSpacing: -0.3,
    },
    livePill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: '#FF3B30',
      flexShrink: 0,
    },
    livePillText: { color: '#fff', fontWeight: '800', fontSize: 10 },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: { fontWeight: '800', fontSize: 12 },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
    ctaGhostLabel: { color: tokens.foreground, fontWeight: '800', fontSize: 12 },
  });
}

function shortcutStyles(tokens: CoachThemeTokens, cols: 1 | 2 | 3 | 4) {
  const basis =
    cols >= 4 ? '22%' : cols === 3 ? '30%' : cols === 2 ? '46%' : '100%';
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      flexGrow: 1,
      flexBasis: basis,
      minWidth: cols === 1 ? undefined : 120,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    chipLabel: { color: tokens.foreground, fontWeight: '800' },
  });
}

function emptyStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    box: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      padding: spacing.xl,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { color: tokens.foreground, fontWeight: '800' },
    body: { lineHeight: 18 },
    ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    ctaPrimary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: { fontWeight: '800' },
    ctaGhost: {
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
    ctaGhostLabel: { color: tokens.foreground, fontWeight: '800' },
  });
}
