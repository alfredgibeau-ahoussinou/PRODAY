import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  COACH_PORTAL_CHAPTERS,
  type CoachPortalChapterId,
} from '../../content/coachPortalChapters';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { MATCH_CHAPTER_PAD } from '../matchs/chapters/matchChapterLayout';
import { radius, spacing } from '../../theme/designTokens';

export function CoachChapterRail({
  active,
  onChange,
}: {
  active: CoachPortalChapterId;
  onChange: (id: CoachPortalChapterId) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      style={styles.railScroll}
      bounces={false}
    >
      {COACH_PORTAL_CHAPTERS.map((ch) => {
        const on = active === ch.id;
        return (
          <PressableSpring
            key={ch.id}
            onPress={() => onChange(ch.id)}
            scaleTo={0.96}
            haptic
            style={[
              styles.pill,
              {
                borderColor: on ? colors.accent : colors.border,
                backgroundColor: on ? colors.accentSoft : colors.surface,
              },
            ]}
          >
            <ProDayText variant="caption" accent={on} muted={!on} style={styles.pillText}>
              {t(ch.shortLabelKey)}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
}

export function CoachChapterScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={stylesPad.scroll}
      contentContainerStyle={stylesPad.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Texte coach — couleurs thème Pôle Coach (fallback COACH_SITE hors shell). */
export function CoachText({
  muted,
  accent,
  inverse,
  style,
  ...rest
}: React.ComponentProps<typeof ProDayText>) {
  const { tokens } = useCoachTheme();
  const color = inverse
    ? '#FFFFFF'
    : accent
      ? tokens.accent
      : muted
        ? tokens.muted
        : tokens.foreground;
  return <ProDayText {...rest} style={[{ color }, style]} />;
}

function useCoachCardStyles() {
  const { tokens } = useCoachTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 18,
          padding: spacing.md,
          gap: spacing.xs,
          backgroundColor: tokens.surface,
          borderLeftWidth: 3,
          borderLeftColor: tokens.accent,
        },
        kicker: {
          color: tokens.accent,
          fontSize: 13,
          fontWeight: '600',
        },
        title: {
          color: tokens.foreground,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        body: {
          color: tokens.muted,
          lineHeight: 20,
        },
      }),
    [tokens],
  );
}

export function CoachSectionCard({
  kicker,
  title,
  body,
  children,
  style,
}: {
  kicker?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const coachCardStyles = useCoachCardStyles();

  return (
    <View style={[coachCardStyles.card, style]}>
      {kicker ? (
        <CoachText variant="caption" muted style={coachCardStyles.kicker}>
          {kicker}
        </CoachText>
      ) : null}
      <CoachText variant="section" style={coachCardStyles.title}>
        {title}
      </CoachText>
      {body ? (
        <CoachText variant="caption" muted style={coachCardStyles.body}>
          {body}
        </CoachText>
      ) : null}
      {children}
    </View>
  );
}

export function CoachKpiRow({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  const { tokens } = useCoachTheme();
  const coachKpiStyles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          borderRadius: 18,
          backgroundColor: tokens.surface,
          overflow: 'hidden',
        },
        cell: {
          flex: 1,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xs,
          alignItems: 'center',
          gap: 4,
        },
        cellBorder: {
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: tokens.border,
        },
        value: {
          color: tokens.foreground,
          fontWeight: '800',
        },
        label: {
          color: tokens.muted,
          fontSize: 11,
          fontWeight: '600',
        },
      }),
    [tokens],
  );

  return (
    <View style={coachKpiStyles.row}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[coachKpiStyles.cell, index < items.length - 1 && coachKpiStyles.cellBorder]}
        >
          <CoachText
            variant="title"
            style={[coachKpiStyles.value, item.tone ? { color: item.tone } : null]}
          >
            {item.value}
          </CoachText>
          <CoachText variant="caption" muted style={coachKpiStyles.label} numberOfLines={1}>
            {item.label}
          </CoachText>
        </View>
      ))}
    </View>
  );
}

export function CoachActionRow({
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <View style={coachActionStyles.row}>
      <PressableSpring
        onPress={onPrimary}
        scaleTo={0.97}
        haptic
        style={coachActionStyles.primary}
      >
        <CoachText variant="section" style={coachActionStyles.primaryText}>
          {primary}
        </CoachText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring
          onPress={onSecondary}
          scaleTo={0.97}
          style={coachActionStyles.secondary}
        >
          <CoachText variant="caption" style={coachActionStyles.secondaryText}>
            {secondary}
          </CoachText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function CoachLightPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const coachCardStyles = useCoachCardStyles();
  return <View style={[coachCardStyles.card, style]}>{children}</View>;
}

export function CoachEmptyState({
  title,
  body,
  cta,
  onPress,
}: {
  title: string;
  body: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <View style={coachEmptyStyles.block}>
      <CoachText variant="section" style={coachEmptyStyles.title}>
        {title}
      </CoachText>
      <CoachText variant="body" muted style={coachEmptyStyles.body}>
        {body}
      </CoachText>
      {cta && onPress ? (
        <PressableSpring onPress={onPress} scaleTo={0.97} haptic style={coachEmptyStyles.cta}>
          <CoachText variant="section" style={coachEmptyStyles.ctaText}>
            {cta}
          </CoachText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function CoachThemeAppearanceSection() {
  const { t } = useTranslation();
  const { tokens, variant, setVariant, teamName } = useCoachTheme();
  const styles = useMemo(() => createThemeAppearanceStyles(tokens), [tokens]);
  const resolvedTeam = teamName.trim() || tokens.teamLabel.trim() || t('coach.calendar.teamFallback');

  return (
    <CoachSectionCard
      kicker={t('coach.portal.theme.section')}
      title={t('coach.portal.theme.section')}
      body={t('coach.portal.theme.variantHint')}
      style={styles.cardNoAccentBorder}
    >
      <View style={styles.segmentRow}>
        {(['solid', 'clear'] as const).map((option) => {
          const on = variant === option;
          return (
            <PressableSpring
              key={option}
              onPress={() => setVariant(option)}
              scaleTo={0.97}
              haptic
              style={[styles.segment, on && styles.segmentOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <CoachText variant="caption" style={on ? styles.segmentTextOn : styles.segmentTextOff}>
                {t(option === 'solid' ? 'coach.portal.theme.solid' : 'coach.portal.theme.clear')}
              </CoachText>
            </PressableSpring>
          );
        })}
      </View>
      <View style={styles.teamColorRow}>
        <CoachText variant="caption" muted numberOfLines={1} style={styles.teamColorLabel}>
          {t('coach.portal.theme.teamColor')} · {resolvedTeam}
        </CoachText>
        <View style={[styles.colorSwatch, { backgroundColor: tokens.accent }]} />
      </View>
    </CoachSectionCard>
  );
}

function createThemeAppearanceStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    cardNoAccentBorder: { borderLeftWidth: 0 },
    segmentRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    segment: {
      flex: 1,
      minHeight: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    segmentOn: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    segmentTextOn: { color: tokens.accent, fontWeight: '800' },
    segmentTextOff: { color: tokens.muted, fontWeight: '600' },
    teamColorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    teamColorLabel: { flex: 1, minWidth: 0 },
    colorSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
  });
}

export function CoachSettingsGroup({ children }: { children: React.ReactNode }) {
  const { tokens } = useCoachTheme();
  const coachSettingsStyles = useMemo(
    () => createCoachSettingsStyles(tokens),
    [tokens],
  );
  return <View style={coachSettingsStyles.group}>{children}</View>;
}

export function CoachSettingsRow({
  icon,
  label,
  onPress,
  locked,
  badge,
  destructive,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  locked?: boolean;
  badge?: string;
  destructive?: boolean;
  last?: boolean;
}) {
  const { tokens } = useCoachTheme();
  const coachSettingsStyles = useMemo(
    () => createCoachSettingsStyles(tokens),
    [tokens],
  );
  const iconColor = destructive ? '#FF3B30' : tokens.foreground;
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.98}
      haptic
      style={[coachSettingsStyles.row, !last && coachSettingsStyles.rowBorder]}
    >
      <View style={coachSettingsStyles.iconCircle}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <CoachText
        variant="section"
        numberOfLines={1}
        style={[coachSettingsStyles.label, destructive && coachSettingsStyles.labelDestructive]}
      >
        {label}
      </CoachText>
      {badge ? (
        <View style={coachSettingsStyles.badge}>
          <CoachText variant="caption" accent style={coachSettingsStyles.badgeText}>
            {badge}
          </CoachText>
        </View>
      ) : null}
      {locked ? <Icon name="lock" size={14} color={tokens.muted} /> : null}
      <Icon name="chevron-forward" size={16} color={tokens.muted} />
    </PressableSpring>
  );
}

const stylesPad = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: {
    ...MATCH_CHAPTER_PAD,
    gap: spacing.md,
    paddingTop: spacing.sm,
    flexGrow: 0,
  },
});

const coachActionStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  primary: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5EA',
  },
  primaryText: { color: '#000', fontWeight: '700' },
  secondary: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.elevated,
  },
  secondaryText: { color: COACH_SITE.foreground, fontWeight: '700' },
});

function createCoachSettingsStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    group: {
      backgroundColor: tokens.surface,
      borderRadius: 18,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    label: { flex: 1, minWidth: 0, fontWeight: '600', fontSize: 17 },
    labelDestructive: { color: '#FF3B30' },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: tokens.soft,
    },
    badgeText: { fontSize: 10, fontWeight: '800' },
  });
}

const coachEmptyStyles = StyleSheet.create({
  block: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { color: COACH_SITE.foreground, fontWeight: '800', fontSize: 22 },
  body: { fontSize: 16 },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: spacing.xl,
  },
  ctaText: { color: '#000', fontWeight: '700' },
});

function createStyles() {
  return StyleSheet.create({
    /** Hauteur bornée — un ScrollView horizontal sans ça s’étire en flex colonne. */
    railScroll: {
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: 40,
    },
    rail: {
      paddingHorizontal: spacing.lg,
      paddingTop: 2,
      paddingBottom: 6,
      gap: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pill: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    pillText: { fontWeight: '800', fontSize: 12 },
  });
}

/** Shared props for portal chapters. */
export type CoachChapterCommonProps = {
  profile: import('../../models/User').User;
  events: import('../../models/TeamEvent').TeamEvent[];
  members: import('../../models/User').User[];
  refreshing?: boolean;
  onRefresh: () => void;
  onOpenChapter: (id: CoachPortalChapterId) => void;
  onOpenSmartTactics?: () => void;
};
