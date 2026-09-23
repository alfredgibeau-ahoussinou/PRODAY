/**
 * Chrome Calendrier **partagé** Coach ↔ Club/Admin.
 *
 * Le pôle Coach a besoin d'un Calendrier (barre basse Accueil / Calendrier /
 * Équipe / Menu, README §0.2). Plutôt que d'écrire une seconde composition qui
 * dériverait de celle du Club, la composition visuelle est **extraite ici** et
 * reçoit son thème par injection :
 *
 *  - `tokens` : jetons de surface du pôle (`ProSurfaceTokens`), satisfaits par
 *    `ClubThemeTokens` **et** `CoachThemeTokens` ;
 *  - `Text` : le composant texte du pôle (`ClubText`, `CoachText`), qui porte la
 *    couleur et la famille système.
 *
 * La typographie et la forme viennent du socle professionnel partagé
 * (`proType`, `proForm`, `proRadius`, `proSpace`), donc **les deux pôles
 * rendent exactement le même rythme**. `ClubCalendarChrome` et le chrome Coach
 * ne sont plus que des enveloppes de thème.
 *
 * Les libellés sont surchargeables (`labels`) tout en conservant par défaut
 * ceux du pôle Club, afin qu'aucun texte affiché ne change brutalement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { proEventTone, proForm, proRadius, proSpace, proType } from '../../theme/professionalDesign';
import type { ProSurfaceTokens } from '../../theme/professionalDesign';
import type { CalendarItemModel } from './calendarModel';

/**
 * Contrat texte minimal partagé. Les pôles fournissent un **adaptateur stable**
 * (déclaré au niveau module) qui branche `ClubText` ou `CoachText`.
 */
export type CalendarChromeTextProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export type CalendarChromeText = (props: CalendarChromeTextProps) => React.ReactNode;

type CalendarChromeTheme = {
  tokens: ProSurfaceTokens;
  Text: CalendarChromeText;
  /** Chevron / texte discret du pôle. */
  faintText?: string;
};

const CalendarChromeContext = createContext<CalendarChromeTheme | null>(null);

export function CalendarChromeProvider({
  tokens,
  Text,
  faintText,
  children,
}: CalendarChromeTheme & { children: React.ReactNode }) {
  const value = useMemo<CalendarChromeTheme>(
    () => ({ tokens, Text, faintText }),
    [tokens, Text, faintText],
  );
  return (
    <CalendarChromeContext.Provider value={value}>{children}</CalendarChromeContext.Provider>
  );
}

function useCalendarChrome(): CalendarChromeTheme {
  const ctx = useContext(CalendarChromeContext);
  if (!ctx) {
    throw new Error('CalendarChrome : enveloppe de thème manquante (CalendarChromeProvider).');
  }
  return ctx;
}

export type CalendarHeroLabels = {
  heroCaption: string;
  openMatch: string;
  openTraining: string;
  openFallback: string;
  listMatch: string;
  listTraining: string;
  listEvent: string;
};

export const CALENDAR_HERO_LABELS: CalendarHeroLabels = {
  heroCaption: 'Prochain sur la période',
  openMatch: 'Ouvrir match',
  openTraining: 'Ouvrir séance',
  openFallback: 'Ouvrir',
  listMatch: 'Matchs',
  listTraining: 'Entraînements',
  listEvent: 'Événements',
};

function openLabel(model: CalendarItemModel, labels: CalendarHeroLabels): string {
  if (model.isMatch) return labels.openMatch;
  if (model.isTraining) return labels.openTraining;
  return labels.openFallback;
}

function listLabel(model: CalendarItemModel, labels: CalendarHeroLabels): string {
  if (model.isMatch) return labels.listMatch;
  if (model.isTraining) return labels.listTraining;
  return labels.listEvent;
}

function iconForKind(kind: CalendarItemModel['kind']): IconName {
  if (kind === 'match') return 'trophy';
  if (kind === 'training') return 'football';
  if (kind === 'meeting') return 'people';
  return 'flag';
}

/** Hero du prochain événement de la période. */
export function CalendarHero({
  model,
  onOpen,
  onOpenList,
  labels = CALENDAR_HERO_LABELS,
}: {
  model: CalendarItemModel;
  onOpen: () => void;
  onOpenList?: () => void;
  labels?: CalendarHeroLabels;
}) {
  const { tokens, Text } = useCalendarChrome();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);

  const tone = proEventTone[model.kind];

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.pill, { backgroundColor: tone.soft, borderColor: tone.color }]}>
            <Text style={[proType.label, { color: tone.color, fontSize: 10, letterSpacing: 0.8 }]}>
              {tone.label}
            </Text>
          </View>
          <Text style={styles.clock}>{model.clockLabel}</Text>
        </View>
        <Text style={[proType.caption, { color: tokens.muted }]}>{labels.heroCaption}</Text>
        <Text numberOfLines={2} style={styles.title}>
          {model.title}
        </Text>
        <Text style={[proType.caption, { color: tokens.muted }]} numberOfLines={1}>
          {model.dayLabel}
        </Text>
        <View style={styles.ctaRow}>
          <PressableSpring onPress={onOpen} scaleTo={0.97} haptic style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryLabel}>{openLabel(model, labels)}</Text>
            <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
          </PressableSpring>
          {onOpenList ? (
            <PressableSpring
              onPress={onOpenList}
              scaleTo={0.97}
              haptic
              style={[styles.ctaGhost, { borderColor: tokens.borderStrong ?? tokens.border }]}
            >
              <Text style={[proType.caption, styles.ctaGhostLabel]}>{listLabel(model, labels)}</Text>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Ligne d'agenda compacte. */
export function CalendarAgendaRow({
  model,
  index,
  onPress,
}: {
  model: CalendarItemModel;
  index: number;
  onPress: () => void;
}) {
  const { tokens, Text, faintText } = useCalendarChrome();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);
  const tone = proEventTone[model.kind];

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View style={[styles.icon, { backgroundColor: tone.soft }]}>
          <Icon name={iconForKind(model.kind)} size={16} color={tone.color} />
        </View>
        <View style={styles.col}>
          <Text style={[proType.caption, { color: tone.color, fontWeight: '800' }]}>
            {model.kindLabel} · {model.clockLabel}
          </Text>
          <Text numberOfLines={2} style={[proType.body, styles.title]}>
            {model.title}
          </Text>
          <Text numberOfLines={1} style={[proType.caption, { color: tokens.muted }]}>
            {model.dayLabel}
          </Text>
        </View>
        <Icon name="chevron-forward" size={15} color={faintText ?? tokens.faint ?? tokens.muted} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const heroStyles = (tokens: ProSurfaceTokens) =>
  StyleSheet.create({
    card: {
      gap: proSpace.sm,
      paddingVertical: proSpace.lg,
      paddingHorizontal: proSpace.lg,
      borderRadius: proForm.groupRadius,
      backgroundColor: tokens.surface,
      overflow: 'hidden',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: proSpace.sm,
    },
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: proRadius.pill,
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
      gap: proSpace.sm,
      marginTop: proSpace.xs,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: proRadius.pill,
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
      borderRadius: proRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
    ctaGhostLabel: {
      color: tokens.foreground,
      fontWeight: '800',
    },
  });

const rowStyles = (tokens: ProSurfaceTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      paddingVertical: proSpace.md,
      paddingHorizontal: proSpace.md,
      borderRadius: proForm.groupRadius,
      backgroundColor: tokens.surface,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: proRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontWeight: '700' },
  });
