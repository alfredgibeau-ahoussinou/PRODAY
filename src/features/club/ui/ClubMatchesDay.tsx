/**
 * Composition visuelle Match day Club — hero jour J + liste score-forward.
 * Navigation détail via MatchEventHubScreen (bindings dans ClubMatchesScreen).
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
import type { ClubMatchCardModel, ClubMatchHubAction } from './clubMatchesModel';

function ScorePair({
  home,
  away,
  showScore,
  large,
}: {
  home: number | null;
  away: number | null;
  showScore: boolean;
  large?: boolean;
}) {
  const { tokens } = useClubTheme();
  const scoreStyle = large
    ? { fontSize: 36, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -1 }
    : { fontSize: 22, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.5 };
  return (
    <View style={{ alignItems: 'center', gap: 2, minWidth: large ? 88 : 72 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: large ? 10 : 8 }}>
        <ClubText style={[scoreStyle, { color: tokens.foreground }]}>
          {showScore && home != null ? String(home) : '—'}
        </ClubText>
        <ClubText variant="caption" muted style={{ fontWeight: '800' }}>
          –
        </ClubText>
        <ClubText style={[scoreStyle, { color: tokens.foreground }]}>
          {showScore && away != null ? String(away) : '—'}
        </ClubText>
      </View>
      <ClubText variant="caption" muted style={{ fontWeight: '700', letterSpacing: 1.2 }}>
        VS
      </ClubText>
    </View>
  );
}

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
      ? { bg: tokens.dangerSoft, fg: tokens.danger, border: tokens.danger }
      : tone === 'warn'
        ? { bg: tokens.warningSoft, fg: tokens.warning, border: tokens.warning }
        : tone === 'today'
          ? { bg: tokens.pitchSoft, fg: tokens.pitch, border: tokens.pitch }
          : tone === 'done'
            ? { bg: tokens.elevated, fg: tokens.muted, border: tokens.border }
            : { bg: clubEventTone.match.soft, fg: clubEventTone.match.color, border: clubEventTone.match.color };

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

function statusTone(model: ClubMatchCardModel): 'live' | 'today' | 'soon' | 'done' | 'warn' {
  if (model.isLive) return 'live';
  if (model.presence.pending > 0) return 'warn';
  if (model.status === 'finished') return 'done';
  if (model.isToday) return 'today';
  return 'soon';
}

/** Hero Match day — score, adversaire, heure, présence, CTAs hub. */
export function ClubMatchDayHero({
  model,
  actions,
  onAction,
}: {
  model: ClubMatchCardModel;
  actions: ClubMatchHubAction[];
  onAction: (chapter: ClubMatchHubAction['id']) => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  const tone = clubEventTone.match;
  const metaBits = [model.teamLabel, model.dayLabel, model.locationLabel].filter(Boolean);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={[styles.card, { borderColor: tone.color + '55' }]}>
        <LinearGradient
          colors={['rgba(91,163,255,0.24)', tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tone.color }]} />

        <View style={styles.topRow}>
          <StatusPill label={model.isLive ? 'EN DIRECT' : model.isToday ? 'AUJOURD’HUI' : model.statusLabel.toUpperCase()} tone={statusTone(model)} />
          <ClubText variant="h2" style={styles.clock}>
            {model.clockLabel}
          </ClubText>
        </View>

        <ClubText variant="caption" muted style={styles.typeLine}>
          {model.typeLabel}
        </ClubText>

        <View style={styles.scoreBlock}>
          <View style={styles.side}>
            <ClubText variant="h3" numberOfLines={2} style={styles.sideLabel}>
              {model.homeLabel}
            </ClubText>
          </View>
          <ScorePair home={model.homeScore} away={model.awayScore} showScore={model.showScore} large />
          <View style={[styles.side, { alignItems: 'flex-end' }]}>
            <ClubText variant="h3" numberOfLines={2} style={[styles.sideLabel, { textAlign: 'right' }]}>
              {model.awayLabel}
            </ClubText>
          </View>
        </View>

        {metaBits.length > 0 ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.meta}>
            {metaBits.join(' · ')}
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
                style={primary ? styles.ctaPrimary : [styles.ctaGhost, { borderColor: tokens.borderStrong }]}
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

/** Ligne liste match — score réel si dispo, sinon tirets. */
export function ClubMatchListRow({
  model,
  index,
  onOpen,
  onConvocations,
}: {
  model: ClubMatchCardModel;
  index: number;
  onOpen: () => void;
  onConvocations?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={32}>
      <PressableSpring onPress={onOpen} scaleTo={0.98} haptic style={styles.card}>
        <View style={styles.head}>
          <StatusPill
            label={model.isLive ? 'LIVE' : model.dayLabel.toUpperCase()}
            tone={statusTone(model)}
          />
          <ClubText variant="caption" style={{ fontWeight: '800', color: tokens.foreground }}>
            {model.clockLabel}
          </ClubText>
        </View>

        <View style={styles.scoreBlock}>
          <View style={styles.side}>
            <ClubText variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
              {model.homeLabel}
            </ClubText>
          </View>
          <ScorePair home={model.homeScore} away={model.awayScore} showScore={model.showScore} />
          <View style={[styles.side, { alignItems: 'flex-end' }]}>
            <ClubText
              variant="body"
              numberOfLines={2}
              style={{ fontWeight: '700', textAlign: 'right' }}
            >
              {model.awayLabel}
            </ClubText>
          </View>
        </View>

        <View style={styles.footer}>
          <ClubText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
            {[model.teamLabel, model.presence.label].filter(Boolean).join(' · ')}
          </ClubText>
          <View style={styles.footerActions}>
            {onConvocations && model.presence.pending > 0 ? (
              <PressableSpring
                onPress={onConvocations}
                scaleTo={0.97}
                haptic
                style={[styles.miniCta, { borderColor: tokens.warning + '66' }]}
              >
                <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
                  Convocs
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
    typeLine: {
      letterSpacing: 0.2,
    },
    scoreBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    side: { flex: 1, minWidth: 0 },
    sideLabel: {
      fontWeight: '800',
      letterSpacing: -0.25,
      color: tokens.foreground,
    },
    meta: { lineHeight: 17 },
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
    scoreBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    side: { flex: 1, minWidth: 0 },
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
