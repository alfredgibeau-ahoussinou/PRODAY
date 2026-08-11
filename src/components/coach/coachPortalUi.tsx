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
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  COACH_PORTAL_CHAPTERS,
  type CoachPortalChapterId,
} from '../../content/coachPortalChapters';
import { COACH_SITE } from '../../content/coachPageIdentity';
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
  return (
    <View style={[coachCardStyles.card, style]}>
      {kicker ? (
        <ProDayText variant="caption" style={coachCardStyles.kicker}>
          {kicker}
        </ProDayText>
      ) : null}
      <ProDayText variant="section" style={coachCardStyles.title}>
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" style={coachCardStyles.body}>
          {body}
        </ProDayText>
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
  return (
    <View style={coachKpiStyles.row}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[coachKpiStyles.cell, index < items.length - 1 && coachKpiStyles.cellBorder]}
        >
          <ProDayText
            variant="title"
            style={[coachKpiStyles.value, item.tone ? { color: item.tone } : null]}
          >
            {item.value}
          </ProDayText>
          <ProDayText variant="caption" style={coachKpiStyles.label} numberOfLines={1}>
            {item.label}
          </ProDayText>
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
        <ProDayText variant="caption" style={coachActionStyles.primaryText}>
          {primary}
        </ProDayText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring
          onPress={onSecondary}
          scaleTo={0.97}
          style={coachActionStyles.secondary}
        >
          <ProDayText variant="caption" style={coachActionStyles.secondaryText}>
            {secondary}
          </ProDayText>
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
    <CoachSectionCard title={title} body={body}>
      {cta && onPress ? <CoachActionRow primary={cta} onPrimary={onPress} /> : null}
    </CoachSectionCard>
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

const coachCardStyles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: COACH_SITE.accent,
    borderRadius: 2,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  kicker: {
    color: COACH_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  body: {
    color: COACH_SITE.muted,
    lineHeight: 18,
  },
});

const coachKpiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
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
    borderRightColor: COACH_SITE.border,
  },
  value: {
    color: COACH_SITE.accent,
    fontWeight: '800',
  },
  label: {
    color: COACH_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 9,
    fontWeight: '700',
  },
});

const coachActionStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  primary: {
    borderRadius: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: COACH_SITE.accent,
  },
  primaryText: { color: '#fff', fontWeight: '800', letterSpacing: 0.2 },
  secondary: {
    borderRadius: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
  },
  secondaryText: { color: COACH_SITE.foreground, fontWeight: '700' },
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
