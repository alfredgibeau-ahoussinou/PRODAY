import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

const CoachMatchSkinContext = createContext(false);

export function CoachMatchSkinProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  return (
    <CoachMatchSkinContext.Provider value={enabled}>{children}</CoachMatchSkinContext.Provider>
  );
}

function useCoachMatchSkin() {
  return useContext(CoachMatchSkinContext);
}

type SiteTokens = Pick<CoachThemeTokens, 'surface' | 'border' | 'foreground' | 'muted'>;

function matchSiteTokens(coachSkin: boolean, coachTokens: CoachThemeTokens): SiteTokens {
  return coachSkin ? coachTokens : MATCH_SITE;
}

function matchAccent(coachSkin: boolean, themeAccent: string, coachTokens: CoachThemeTokens) {
  return coachSkin ? coachTokens.accent : themeAccent;
}

/** Section terminal Match Center — kicker / titre / support. */
export function MatchSectionCard({
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
  const { colors } = useAppTheme();
  const coachSkin = useCoachMatchSkin();
  const coachTokens = useCoachTokens();
  const accent = matchAccent(coachSkin, colors.accent, coachTokens);
  const styles = useMemo(
    () => createCardStyles(accent, coachSkin, coachTokens),
    [accent, coachSkin, coachTokens],
  );

  return (
    <View style={[styles.card, style]}>
      {kicker ? (
        <ProDayText variant="caption" style={styles.kicker}>
          {kicker}
        </ProDayText>
      ) : null}
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" style={styles.body}>
          {body}
        </ProDayText>
      ) : null}
      {children}
    </View>
  );
}

export function MatchKpiRow({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  const { colors } = useAppTheme();
  const coachSkin = useCoachMatchSkin();
  const coachTokens = useCoachTokens();
  const accent = matchAccent(coachSkin, colors.accent, coachTokens);
  const styles = useMemo(
    () => createKpiStyles(accent, coachSkin, coachTokens),
    [accent, coachSkin, coachTokens],
  );

  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.cell, index < items.length - 1 && styles.cellBorder]}
        >
          <ProDayText
            variant="title"
            style={[styles.value, item.tone ? { color: item.tone } : null]}
          >
            {item.value}
          </ProDayText>
          <ProDayText variant="caption" style={styles.label} numberOfLines={1}>
            {item.label}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

export function MatchActionRow({
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
  const { colors } = useAppTheme();
  const coachSkin = useCoachMatchSkin();
  const coachTokens = useCoachTokens();
  const accent = matchAccent(coachSkin, colors.accent, coachTokens);
  const styles = useMemo(
    () => createActionStyles(accent, coachSkin, coachTokens),
    [accent, coachSkin, coachTokens],
  );

  return (
    <View style={styles.row}>
      <PressableSpring onPress={onPrimary} scaleTo={0.97} haptic style={styles.primary}>
        <ProDayText variant="caption" style={styles.primaryText}>
          {primary}
        </ProDayText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring onPress={onSecondary} scaleTo={0.97} style={styles.secondary}>
          <ProDayText variant="caption" style={styles.secondaryText}>
            {secondary}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function MatchEmptyState({
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
    <MatchSectionCard title={title} body={body}>
      {cta && onPress ? <MatchActionRow primary={cta} onPrimary={onPress} /> : null}
    </MatchSectionCard>
  );
}

/** Conteneur hairline pour SearchBar / selects. */
export function MatchFilterBar({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[filterStyles.bar, style]}>{children}</View>;
}

/** Panneau léger (liste / détail) avec barre gauche accent. */
export function MatchLightPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const coachSkin = useCoachMatchSkin();
  const coachTokens = useCoachTokens();
  const accent = matchAccent(coachSkin, colors.accent, coachTokens);
  const styles = useMemo(
    () => createCardStyles(accent, coachSkin, coachTokens),
    [accent, coachSkin, coachTokens],
  );
  return <View style={[styles.card, style]}>{children}</View>;
}

function createCardStyles(accent: string, coachSkin: boolean, coachTokens: CoachThemeTokens) {
  const site = matchSiteTokens(coachSkin, coachTokens);
  return StyleSheet.create({
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      borderLeftWidth: coachSkin ? StyleSheet.hairlineWidth : 2,
      borderLeftColor: coachSkin ? site.border : accent,
      borderRadius: coachSkin ? 16 : 2,
      padding: spacing.md,
      gap: spacing.xs,
      backgroundColor: site.surface,
    },
    kicker: {
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 2.4,
      fontSize: 10,
      fontWeight: '700',
    },
    title: {
      color: site.foreground,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    body: {
      color: site.muted,
      lineHeight: 18,
    },
  });
}

function createKpiStyles(accent: string, coachSkin: boolean, coachTokens: CoachThemeTokens) {
  const site = matchSiteTokens(coachSkin, coachTokens);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      backgroundColor: site.surface,
      borderRadius: coachSkin ? 16 : 0,
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
      borderRightColor: site.border,
    },
    value: {
      color: accent,
      fontWeight: '800',
    },
    label: {
      color: site.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 9,
      fontWeight: '700',
    },
  });
}

function createActionStyles(accent: string, coachSkin: boolean, coachTokens: CoachThemeTokens) {
  const site = matchSiteTokens(coachSkin, coachTokens);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    primary: {
      borderRadius: coachSkin ? 18 : 2,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: accent,
    },
    primaryText: { color: '#fff', fontWeight: '800', letterSpacing: 0.2 },
    secondary: {
      borderRadius: coachSkin ? 18 : 2,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      backgroundColor: 'transparent',
    },
    secondaryText: { color: site.foreground, fontWeight: '700' },
  });
}

const filterStyles = StyleSheet.create({
  bar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
    borderRadius: 2,
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: MATCH_SITE.surface,
  },
});
