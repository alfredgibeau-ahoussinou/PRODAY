import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import {
  CLUB_PORTAL_CHAPTERS,
  type ClubPortalChapterId,
} from '../../content/clubPortalChapters';
import { CLUB_SITE } from '../../content/clubPageIdentity';
import { useClubPageIdentity } from './ClubPageFrame';
import { spacing } from '../../theme/designTokens';

/** Rail chapitres — pills terminal (hairline + accent site). */
export function ClubChapterRail({
  active,
  onChange,
}: {
  active: ClubPortalChapterId;
  onChange: (id: ClubPortalChapterId) => void;
}) {
  const styles = useMemo(() => createRailStyles(), []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      style={styles.railScroll}
      bounces={false}
    >
      {CLUB_PORTAL_CHAPTERS.map((ch) => {
        const on = active === ch.id;
        return (
          <PressableSpring
            key={ch.id}
            onPress={() => onChange(ch.id)}
            scaleTo={0.97}
            haptic
            style={[
              styles.pill,
              on && styles.pillOn,
            ]}
          >
            <ProDayText
              variant="caption"
              style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}
            >
              {ch.shortLabel}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
}

export function ClubChapterScroll({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const identity = useClubPageIdentity();

  return (
    <ScrollView
      style={scrollStyles.scroll}
      contentContainerStyle={[
        scrollStyles.content,
        identity?.layout === 'briefing' && scrollStyles.briefingContent,
        identity?.layout === 'editorial' && scrollStyles.editorialContent,
        identity?.layout === 'studio' && scrollStyles.studioContent,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={CLUB_SITE.accent}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function ClubSectionCard({
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
  const identity = useClubPageIdentity();
  const editorial = identity?.layout === 'editorial';

  return (
    <View style={[cardStyles.card, editorial && cardStyles.cardEditorial, style]}>
      {kicker ? (
        <ProDayText variant="caption" style={cardStyles.kicker}>
          {kicker}
        </ProDayText>
      ) : null}
      <ProDayText
        variant={editorial ? 'title' : 'section'}
        style={[cardStyles.title, editorial && cardStyles.titleEditorial]}
      >
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" style={cardStyles.body}>
          {body}
        </ProDayText>
      ) : null}
      {children}
    </View>
  );
}

export function ClubKpiRow({ items }: { items: { label: string; value: string }[] }) {
  const identity = useClubPageIdentity();
  const briefing = identity?.layout === 'briefing';

  return (
    <View style={[kpiStyles.row, briefing && kpiStyles.rowBriefing]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            kpiStyles.cell,
            index < items.length - 1 && kpiStyles.cellBorder,
            briefing && kpiStyles.cellBriefing,
          ]}
        >
          <ProDayText variant="title" style={kpiStyles.value}>
            {item.value}
          </ProDayText>
          <ProDayText variant="caption" style={kpiStyles.label} numberOfLines={1}>
            {item.label}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

export function ClubActionRow({
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
    <View style={actionStyles.row}>
      <PressableSpring
        onPress={onPrimary}
        scaleTo={0.97}
        haptic
        style={actionStyles.primary}
      >
        <ProDayText variant="caption" style={actionStyles.primaryText}>
          {primary}
        </ProDayText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring
          onPress={onSecondary}
          scaleTo={0.97}
          style={actionStyles.secondary}
        >
          <ProDayText variant="caption" style={actionStyles.secondaryText}>
            {secondary}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function ClubEmptyState({
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
    <ClubSectionCard title={title} body={body}>
      {cta && onPress ? <ClubActionRow primary={cta} onPrimary={onPress} /> : null}
    </ClubSectionCard>
  );
}

export function ClubLightPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const identity = useClubPageIdentity();
  return (
    <View
      style={[
        cardStyles.card,
        identity?.layout === 'tree' && cardStyles.treePanel,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function createRailStyles() {
  return StyleSheet.create({
    railScroll: {
      flexGrow: 0,
      maxHeight: 44,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: CLUB_SITE.border,
      backgroundColor: CLUB_SITE.bg,
    },
    rail: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
      alignItems: 'center',
    },
    pill: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    pillOn: {
      borderColor: CLUB_SITE.accent,
      backgroundColor: CLUB_SITE.soft,
    },
    pillText: { fontWeight: '700', fontSize: 11, letterSpacing: 0.3 },
    pillTextOn: { color: CLUB_SITE.accent },
    pillTextOff: { color: CLUB_SITE.muted },
  });
}

const scrollStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  briefingContent: { gap: spacing.lg },
  editorialContent: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  studioContent: { gap: spacing.sm, paddingTop: spacing.md },
});

const cardStyles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: CLUB_SITE.accent,
    borderRadius: 2,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardEditorial: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: CLUB_SITE.border,
  },
  treePanel: {
    borderRadius: 0,
  },
  kicker: {
    color: CLUB_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: CLUB_SITE.foreground,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  titleEditorial: {
    letterSpacing: -0.8,
    fontSize: 22,
  },
  body: {
    color: CLUB_SITE.muted,
    lineHeight: 18,
  },
});

const kpiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rowBriefing: {},
  cell: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: CLUB_SITE.border,
  },
  cellBriefing: {
    paddingVertical: spacing.lg,
  },
  value: {
    color: CLUB_SITE.accent,
    fontWeight: '800',
  },
  label: {
    color: CLUB_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 9,
    fontWeight: '700',
  },
});

const actionStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  primary: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: CLUB_SITE.accent,
  },
  primaryText: { color: '#fff', fontWeight: '800', letterSpacing: 0.2 },
  secondary: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
  },
  secondaryText: { color: CLUB_SITE.foreground, fontWeight: '700' },
});
