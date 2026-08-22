/**
 * Composition visuelle cockpit Président — priorités, finance, pont Club.
 * Graphite / champagne (tokens Président), pas navy Club.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import type { PresidentThemeTokens } from '../theme/presidentTokens';
import {
  presidentLayout,
  presidentRadius,
  presidentShadow,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import { PresidentText } from './presidentUi';
import type {
  PresidentCockpitPriority,
  PresidentFinanceSnapshot,
} from './presidentCockpitModel';

export function PresidentFinanceSnapshotCard({
  snapshot,
  loading,
  onOpenFinance,
}: {
  snapshot: PresidentFinanceSnapshot;
  loading?: boolean;
  onOpenFinance: () => void;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => financeStyles(tokens), [tokens]);
  const positive = snapshot.soldeEur >= 0;

  return (
    <AnimatedEntrance kind="fadeUp" index={1} delayStep={32}>
      <PressableSpring
        onPress={onOpenFinance}
        scaleTo={0.98}
        haptic
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir Finances"
      >
        <LinearGradient
          colors={[tokens.champagneSoft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.accent }]} />
        <View style={[styles.iconBadge, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="bag" size={20} color={tokens.champagne} />
        </View>
        <View style={styles.copy}>
          <PresidentText variant="label" champagne>
            Finances
          </PresidentText>
          {loading ? (
            <ActivityIndicator color={tokens.accent} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <PresidentText
              variant="h2"
              style={{ color: positive ? tokens.champagneBright : tokens.danger }}
            >
              {snapshot.label}
            </PresidentText>
          )}
          <PresidentText variant="caption" muted numberOfLines={2}>
            {snapshot.hint}
          </PresidentText>
        </View>
        <View style={[styles.ctaChip, { borderColor: tokens.borderStrong }]}>
          <PresidentText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
            Ouvrir
          </PresidentText>
          <Icon name="chevron-forward" size={12} color={tokens.foreground} />
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

export function PresidentPriorityCard({
  priority,
  index,
  onPress,
}: {
  priority: PresidentCockpitPriority;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => priorityStyles(tokens), [tokens]);
  const accent =
    priority.tone === 'alert'
      ? tokens.danger
      : priority.tone === 'warn'
        ? tokens.warn
        : tokens.success;
  const soft =
    priority.tone === 'alert'
      ? tokens.dangerSoft
      : priority.tone === 'warn'
        ? tokens.warnSoft
        : tokens.successSoft;

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 2} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.card}>
        <View style={[styles.rail, { backgroundColor: accent }]} />
        <View style={[styles.index, { backgroundColor: soft }]}>
          <PresidentText variant="caption" style={{ color: accent, fontWeight: '800' }}>
            {index + 1}
          </PresidentText>
        </View>
        <View style={styles.copy}>
          <PresidentText variant="body" style={{ fontWeight: '800' }} numberOfLines={2}>
            {priority.title}
          </PresidentText>
          <PresidentText variant="caption" muted numberOfLines={2}>
            {priority.body}
          </PresidentText>
        </View>
        <View style={[styles.ctaChip, { borderColor: tokens.borderStrong }]}>
          <PresidentText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
            {priority.ctaLabel}
          </PresidentText>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

export function PresidentClubBridgeCard({
  clubName,
  onOpenClub,
}: {
  clubName: string;
  onOpenClub: () => void;
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => bridgeStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={6} delayStep={28}>
      <PressableSpring onPress={onOpenClub} scaleTo={0.98} haptic style={styles.card}>
        <View style={[styles.iconBadge, { backgroundColor: tokens.accentSoft }]}>
          <Icon name="football" size={18} color={tokens.champagne} />
        </View>
        <View style={styles.copy}>
          <PresidentText variant="label" champagne>
            Opérations Club
          </PresidentText>
          <PresidentText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
            {clubName}
          </PresidentText>
          <PresidentText variant="caption" muted numberOfLines={2}>
            Retour au pôle Club pour le jour J, convocations et outils.
          </PresidentText>
        </View>
        <Icon name="chevron-forward" size={16} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

export function PresidentCockpitShortcutRow({
  items,
}: {
  items: { id: string; label: string; icon: IconName; onPress: () => void }[];
}) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => shortcutStyles(tokens), [tokens]);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={item.onPress}
          scaleTo={0.97}
          haptic
          style={styles.chip}
        >
          <Icon name={item.icon} size={14} color={tokens.champagne} />
          <PresidentText variant="caption" style={styles.chipLabel}>
            {item.label}
          </PresidentText>
        </PressableSpring>
      ))}
    </View>
  );
}

function financeStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.md,
      paddingVertical: presidentSpace.lg,
      paddingHorizontal: presidentLayout.cardPad,
      paddingLeft: presidentLayout.cardPad + 6,
      borderRadius: presidentRadius.xl,
      borderWidth: 1,
      borderColor: tokens.borderLuxury,
      backgroundColor: tokens.surfaceRaised,
      overflow: 'hidden',
      ...presidentShadow.card,
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
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: presidentRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    ctaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: presidentRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.ink,
      flexShrink: 0,
    },
  });
}

function priorityStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.md,
      paddingVertical: presidentSpace.md,
      paddingHorizontal: presidentLayout.cardPad,
      paddingLeft: presidentLayout.cardPad + 6,
      borderRadius: presidentRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      overflow: 'hidden',
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    index: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    ctaChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: presidentRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.ink,
      flexShrink: 0,
    },
  });
}

function bridgeStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.md,
      padding: presidentLayout.cardPad,
      borderRadius: presidentRadius.lg,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.surfaceMuted,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: presidentRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
  });
}

function shortcutStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: presidentSpace.sm },
    chip: {
      flexGrow: 1,
      flexBasis: '22%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    chipLabel: { color: tokens.foreground, fontWeight: '800' },
  });
}
