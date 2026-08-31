/**
 * Composition visuelle Entraînements Club — hero séance + liste compacte.
 * Feuille de présence reste dans ClubTrainingsScreen.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import {
  clubEventTone,
  clubRadius,
  clubShadow,
  clubSpace,
} from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';
import type { ClubTrainingAction, ClubTrainingCardModel } from './clubTrainingsModel';

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'live' | 'today' | 'soon' | 'done' | 'warn';
}) {
  const { tokens } = useClubTheme();
  const palette =
    tone === 'live'
      ? { bg: tokens.pitchSoft, fg: tokens.pitch, border: tokens.pitch }
      : tone === 'warn'
        ? { bg: tokens.warningSoft, fg: tokens.warning, border: tokens.warning }
        : tone === 'today'
          ? { bg: tokens.pitchSoft, fg: tokens.pitch, border: tokens.pitch }
          : tone === 'done'
            ? { bg: tokens.elevated, fg: tokens.muted, border: tokens.border }
            : { bg: clubEventTone.training.soft, fg: clubEventTone.training.color, border: clubEventTone.training.color };

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: clubRadius.pill,
        backgroundColor: palette.bg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border + '88',
      }}
    >
      <ClubText variant="label" style={{ color: palette.fg, fontSize: 10, letterSpacing: 0.8 }}>
        {label}
      </ClubText>
    </View>
  );
}

function statusTone(model: ClubTrainingCardModel): 'live' | 'today' | 'soon' | 'done' | 'warn' {
  if (model.isInProgress) return 'live';
  if (model.presence.pending > 0) return 'warn';
  if (model.status === 'finished') return 'done';
  if (model.isToday) return 'today';
  return 'soon';
}

/** Hero prochaine séance — heure, équipe, présence, CTAs. */
export function ClubTrainingDayHero({
  model,
  actions,
  onAction,
}: {
  model: ClubTrainingCardModel;
  actions: ClubTrainingAction[];
  onAction: (id: ClubTrainingAction['id']) => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  const tone = clubEventTone.training;
  const metaBits = [model.teamLabel, model.dayLabel, model.locationLabel].filter(Boolean);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={[styles.card, { borderColor: tone.color + '55' }]}>
        <LinearGradient
          colors={[tokens.pitchSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tone.color }]} />

        <View style={styles.topRow}>
          <StatusPill
            label={
              model.isInProgress
                ? 'EN COURS'
                : model.isToday
                  ? 'AUJOURD’HUI'
                  : model.statusLabel.toUpperCase()
            }
            tone={statusTone(model)}
          />
          <ClubText variant="h2" style={styles.clock}>
            {model.clockLabel}
          </ClubText>
        </View>

        <ClubText variant="caption" muted>
          Entraînement
        </ClubText>
        <ClubText variant="h2" numberOfLines={2} style={styles.title}>
          {model.title}
        </ClubText>

        {metaBits.length > 0 ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.meta}>
            {metaBits.join(' · ')}
          </ClubText>
        ) : null}

        {model.focusLabel ? (
          <ClubText variant="caption" numberOfLines={2} style={styles.focus}>
            {model.focusLabel}
          </ClubText>
        ) : null}

        <View style={styles.presenceRow}>
          <View
            style={[
              styles.presenceIcon,
              {
                backgroundColor:
                  model.presence.pending > 0 ? tokens.warningSoft : tokens.successSoft,
              },
            ]}
          >
            <Icon
              name="people"
              size={14}
              color={model.presence.pending > 0 ? tokens.warning : tokens.success}
            />
          </View>
          <ClubText variant="caption" numberOfLines={2} style={styles.presenceText}>
            {model.presence.label}
          </ClubText>
        </View>

        <View style={styles.ctaRow}>
          {actions.map((action, i) => {
            const primary = i === 0;
            return (
              <PressableSpring
                key={action.id}
                onPress={() => onAction(action.id)}
                scaleTo={0.97}
                haptic
                style={
                  primary ? styles.ctaPrimary : [styles.ctaGhost, { borderColor: tokens.borderStrong }]
                }
              >
                <ClubText
                  variant="caption"
                  style={
                    primary
                      ? styles.ctaPrimaryLabel
                      : { color: tokens.foreground, fontWeight: '800' }
                  }
                >
                  {action.label}
                </ClubText>
                {primary ? <Icon name="chevron-forward" size={12} color={tokens.onAccent} /> : null}
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Ligne liste séance — compacte, tap → présences. */
export function ClubTrainingListRow({
  model,
  index,
  selected,
  onOpenPresence,
  onOpenDetail,
}: {
  model: ClubTrainingCardModel;
  index: number;
  selected?: boolean;
  onOpenPresence: () => void;
  onOpenDetail?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={32}>
      <PressableSpring
        onPress={onOpenPresence}
        scaleTo={0.98}
        haptic
        style={[
          styles.card,
          selected ? { borderColor: clubEventTone.training.color + '88' } : null,
        ]}
      >
        <View style={styles.head}>
          <StatusPill
            label={model.isInProgress ? 'EN COURS' : model.dayLabel.toUpperCase()}
            tone={statusTone(model)}
          />
          <ClubText variant="caption" style={{ fontWeight: '800', color: tokens.foreground }}>
            {model.clockLabel}
          </ClubText>
        </View>

        <ClubText variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
          {model.title}
        </ClubText>

        <View style={styles.footer}>
          <ClubText variant="caption" muted numberOfLines={2} style={{ flex: 1 }}>
            {[model.teamLabel, model.presence.label].filter(Boolean).join(' · ')}
          </ClubText>
          <View style={styles.footerActions}>
            {onOpenDetail ? (
              <PressableSpring
                onPress={onOpenDetail}
                scaleTo={0.97}
                haptic
                style={[styles.miniCta, { borderColor: tokens.borderStrong }]}
              >
                <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                  Détail
                </ClubText>
              </PressableSpring>
            ) : null}
            <Icon name="chevron-forward" size={14} color={tokens.faint} />
          </View>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      paddingLeft: clubSpace.lg + 6,
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
    meta: { lineHeight: 17 },
    focus: {
      color: tokens.muted,
      fontWeight: '600',
      lineHeight: 17,
    },
    presenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      marginTop: 2,
    },
    presenceIcon: {
      width: 28,
      height: 28,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presenceText: {
      flex: 1,
      fontWeight: '600',
      color: tokens.muted,
      lineHeight: 16,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      marginTop: clubSpace.sm,
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
    card: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    miniCta: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });
