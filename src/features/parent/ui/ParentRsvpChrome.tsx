/**
 * Composition visuelle Parent RSVP — hero prochain événement + CTAs présence.
 * Univers Parent (teal), pas le navy Club.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useThemedScreen } from '../../../hooks/useThemedScreen';
import { PARENT_SITE } from '../../../content/parentPageIdentity';
import { radius, spacing } from '../../../theme/designTokens';
import {
  formatParentEventType,
  formatParentEventWhen,
  needsParentRsvpResponse,
  parentRsvpStatusLabel,
  parentRsvpSuccessCopy,
  resolveParentRsvpTone,
  type ParentRsvpChoice,
} from './parentRsvpModel';
import { isLateRsvp, type RsvpStatus, type TeamEvent } from '../../../models/TeamEvent';

/** Hero prochain événement + Je viens / Absent / Peut-être. */
export function ParentRsvpEventHero({
  event,
  childName,
  childUid,
  busy,
  onChoose,
  footer,
}: {
  event: TeamEvent;
  childName: string;
  childUid: string;
  busy?: boolean;
  onChoose: (choice: ParentRsvpChoice) => void;
  footer?: React.ReactNode;
}) {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => heroStyles(c.surface, c.border), [c.surface, c.border]);
  const rsvp = event.rsvps?.[childUid];
  const tone = resolveParentRsvpTone(rsvp);
  const needs = needsParentRsvpResponse(rsvp);
  const where = [event.location_label, event.city].filter(Boolean).join(' · ');

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[PARENT_SITE.accentSoft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: PARENT_SITE.accent }]} />
        <View style={styles.head}>
          <View style={styles.iconBadge}>
            <Icon name="calendar" size={20} color={PARENT_SITE.accent} />
          </View>
          <View style={styles.headCopy}>
            <ProDayText variant="caption" style={styles.kicker}>
              Prochain événement · {childName}
            </ProDayText>
            <ProDayText variant="section" numberOfLines={2} style={styles.title}>
              {event.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {formatParentEventType(event)} · {formatParentEventWhen(event.starts_at)}
              {where ? ` · ${where}` : ''}
            </ProDayText>
          </View>
          <View
            style={[
              styles.pill,
              tone === 'yes' || tone === 'late'
                ? styles.pillOk
                : tone === 'no'
                  ? styles.pillNo
                  : tone === 'maybe'
                    ? styles.pillMaybe
                    : styles.pillPending,
            ]}
          >
            <ProDayText variant="caption" style={styles.pillLabel}>
              {parentRsvpStatusLabel(rsvp)}
            </ProDayText>
          </View>
        </View>

        {!needs && rsvp ? (
          <View style={styles.success}>
            <Icon name="checkmark-circle" size={16} color={PARENT_SITE.accent} />
            <ProDayText variant="caption" style={styles.successText}>
              {parentRsvpSuccessCopy(rsvp, childName)}
            </ProDayText>
          </View>
        ) : (
          <ProDayText variant="caption" muted style={styles.prompt}>
            Confirmez en un tap — le coach est notifié.
          </ProDayText>
        )}

        <ParentRsvpChoiceRow
          current={rsvp}
          busy={busy}
          onChoose={onChoose}
        />

        {footer}
      </View>
    </AnimatedEntrance>
  );
}

export function ParentRsvpChoiceRow({
  current,
  busy,
  onChoose,
}: {
  current?: RsvpStatus;
  busy?: boolean;
  onChoose: (choice: ParentRsvpChoice) => void;
}) {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => choiceStyles(c.border, c.surfaceMuted), [c.border, c.surfaceMuted]);

  const choices: {
    id: ParentRsvpChoice;
    label: string;
    selected: boolean;
  }[] = [
    { id: 'yes', label: 'Je viens', selected: current === 'yes' || (!!current && isLateRsvp(current)) },
    { id: 'no', label: 'Absent', selected: current === 'no' },
    { id: 'maybe', label: 'Peut-être', selected: current === 'maybe' },
  ];

  return (
    <View style={styles.row}>
      {choices.map((choice) => {
        const on = choice.selected;
        const primary = choice.id === 'yes';
        return (
          <PressableSpring
            key={choice.id}
            onPress={() => onChoose(choice.id)}
            disabled={busy}
            scaleTo={0.97}
            haptic
            style={[
              styles.btn,
              on && primary ? styles.btnYesOn : null,
              on && choice.id === 'no' ? styles.btnNoOn : null,
              on && choice.id === 'maybe' ? styles.btnMaybeOn : null,
              !on ? styles.btnOff : null,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: busy }}
            accessibilityLabel={choice.label}
          >
            {busy && on ? (
              <ActivityIndicator color={primary ? '#042f2e' : PARENT_SITE.ink} />
            ) : (
              <ProDayText
                variant="caption"
                style={[
                  styles.btnLabel,
                  on && primary ? styles.btnLabelYes : null,
                  on && choice.id === 'no' ? styles.btnLabelNo : null,
                  on && choice.id === 'maybe' ? styles.btnLabelMaybe : null,
                ]}
              >
                {choice.label}
              </ProDayText>
            )}
          </PressableSpring>
        );
      })}
    </View>
  );
}

export function ParentRsvpEmptyCard({
  childName,
  onOpenAgenda,
}: {
  childName?: string;
  onOpenAgenda?: () => void;
}) {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => emptyStyles(c.surface, c.border), [c.surface, c.border]);
  const name = childName?.trim() || 'votre enfant';

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.box}>
        <LinearGradient
          colors={[PARENT_SITE.accentSoft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.iconWrap}>
          <Icon name="calendar" size={22} color={PARENT_SITE.accent} />
        </View>
        <ProDayText variant="section" style={styles.title}>
          Aucune séance à venir
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.body}>
          Dès qu’une convocation arrive pour {name}, vous pourrez répondre « Je viens » ou
          « Absent » ici en un tap.
        </ProDayText>
        {onOpenAgenda ? (
          <PressableSpring onPress={onOpenAgenda} scaleTo={0.97} haptic style={styles.cta}>
            <ProDayText variant="caption" style={styles.ctaLabel}>
              Voir l’agenda
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </AnimatedEntrance>
  );
}

function heroStyles(surface: string, border: string) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
      padding: spacing.lg,
      paddingLeft: spacing.lg + 6,
      gap: spacing.sm,
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
    head: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: PARENT_SITE.accentSoft,
      flexShrink: 0,
    },
    headCopy: { flex: 1, minWidth: 0, gap: 4 },
    kicker: {
      color: PARENT_SITE.accent,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    title: { fontWeight: '800', color: PARENT_SITE.ink },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      flexShrink: 0,
    },
    pillPending: { backgroundColor: 'rgba(251, 191, 36, 0.18)' },
    pillOk: { backgroundColor: PARENT_SITE.accentSoft },
    pillNo: { backgroundColor: 'rgba(239, 68, 68, 0.18)' },
    pillMaybe: { backgroundColor: 'rgba(148, 163, 184, 0.2)' },
    pillLabel: { fontWeight: '800', fontSize: 11, color: PARENT_SITE.ink },
    prompt: { marginTop: 2 },
    success: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingVertical: 6,
    },
    successText: { flex: 1, color: PARENT_SITE.ink, fontWeight: '600' },
  });
}

function choiceStyles(border: string, muted: string) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    btn: {
      flexGrow: 1,
      flexBasis: '28%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 11,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    btnOff: {
      backgroundColor: muted,
      borderColor: border,
    },
    btnYesOn: {
      backgroundColor: PARENT_SITE.accent,
      borderColor: PARENT_SITE.accent,
    },
    btnNoOn: {
      backgroundColor: 'rgba(239, 68, 68, 0.22)',
      borderColor: 'rgba(239, 68, 68, 0.45)',
    },
    btnMaybeOn: {
      backgroundColor: 'rgba(148, 163, 184, 0.28)',
      borderColor: border,
    },
    btnLabel: { fontWeight: '800', color: PARENT_SITE.ink },
    btnLabelYes: { color: '#042f2e' },
    btnLabelNo: { color: '#FCA5A5' },
    btnLabelMaybe: { color: PARENT_SITE.ink },
  });
}

function emptyStyles(surface: string, border: string) {
  return StyleSheet.create({
    box: {
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
      padding: spacing.xl,
      gap: spacing.sm,
      alignItems: 'flex-start',
      overflow: 'hidden',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: PARENT_SITE.accentSoft,
    },
    title: { fontWeight: '800', color: PARENT_SITE.ink },
    body: { lineHeight: 18 },
    cta: {
      marginTop: spacing.xs,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      backgroundColor: PARENT_SITE.accent,
    },
    ctaLabel: { color: '#042f2e', fontWeight: '800' },
  });
}
