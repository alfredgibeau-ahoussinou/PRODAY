/**
 * Composition visuelle Calendrier Club — hero prochain RDV + lignes agenda.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubEventTone,
  clubRadius,
  clubShadow,
  clubSpace,
} from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';
import type { ClubCalendarItemModel } from './clubCalendarModel';

function iconForKind(kind: ClubCalendarItemModel['kind']): IconName {
  if (kind === 'match') return 'trophy';
  if (kind === 'training') return 'football';
  if (kind === 'meeting') return 'people';
  return 'flag';
}

/** Hero prochain événement de la période. */
export function ClubCalendarHero({
  model,
  onOpen,
  onOpenList,
}: {
  model: ClubCalendarItemModel;
  onOpen: () => void;
  onOpenList?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  const tone = clubEventTone[model.kind];

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={[styles.card, { borderColor: tone.color + '55' }]}>
        <LinearGradient
          colors={[tone.soft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tone.color }]} />
        <View style={styles.topRow}>
          <View style={[styles.pill, { backgroundColor: tone.soft, borderColor: tone.color }]}>
            <ClubText variant="label" style={{ color: tone.color, fontSize: 10, letterSpacing: 0.8 }}>
              {tone.label}
            </ClubText>
          </View>
          <ClubText variant="h2" style={styles.clock}>
            {model.clockLabel}
          </ClubText>
        </View>
        <ClubText variant="caption" muted>
          Prochain sur la période
        </ClubText>
        <ClubText variant="h2" numberOfLines={2} style={styles.title}>
          {model.title}
        </ClubText>
        <ClubText variant="caption" muted numberOfLines={1}>
          {model.dayLabel}
        </ClubText>
        <View style={styles.ctaRow}>
          <PressableSpring onPress={onOpen} scaleTo={0.97} haptic style={styles.ctaPrimary}>
            <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
              {model.isMatch ? 'Ouvrir match' : model.isTraining ? 'Ouvrir séance' : 'Ouvrir'}
            </ClubText>
            <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
          </PressableSpring>
          {onOpenList ? (
            <PressableSpring
              onPress={onOpenList}
              scaleTo={0.97}
              haptic
              style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
            >
              <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                {model.isMatch ? 'Matchs' : model.isTraining ? 'Entraînements' : 'Événements'}
              </ClubText>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Ligne agenda compacte. */
export function ClubCalendarAgendaRow({
  model,
  index,
  onPress,
}: {
  model: ClubCalendarItemModel;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);
  const tone = clubEventTone[model.kind];

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View style={[styles.icon, { backgroundColor: tone.soft }]}>
          <Icon name={iconForKind(model.kind)} size={16} color={tone.color} />
        </View>
        <View style={styles.col}>
          <ClubText variant="caption" style={{ color: tone.color, fontWeight: '800' }}>
            {model.kindLabel} · {model.clockLabel}
          </ClubText>
          <ClubText variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
            {model.title}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={1}>
            {model.dayLabel}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xxl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...clubShadow.lift,
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
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: clubRadius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    clock: {
      fontWeight: '800',
      letterSpacing: -0.5,
      fontSize: 24,
      lineHeight: 28,
      color: tokens.foreground,
    },
    title: {
      fontWeight: '800',
      letterSpacing: -0.35,
      color: tokens.foreground,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });

const rowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
