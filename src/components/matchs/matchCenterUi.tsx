import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useJoueurPageIdentity } from '../player/joueurPortalUi';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';

const CoachMatchSkinContext = createContext(false);
const JoueurMatchSkinContext = createContext(false);

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

export function JoueurMatchSkinProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  return (
    <JoueurMatchSkinContext.Provider value={enabled}>{children}</JoueurMatchSkinContext.Provider>
  );
}

function useCoachMatchSkin() {
  return useContext(CoachMatchSkinContext);
}

function useJoueurMatchSkin() {
  return useContext(JoueurMatchSkinContext);
}

export type MatchSkinTokens = {
  accent: string;
  soft: string;
  live: string;
  warn: string;
  border: string;
  foreground: string;
  muted: string;
  surface: string;
  elevated: string;
  cardRadius: number;
  joueurSkin: boolean;
  coachSkin: boolean;
};

/** Tokens Match Center — coach / joueur FUT18 / défaut. */
export function useMatchSkinTokens(): MatchSkinTokens {
  const { colors } = useAppTheme();
  const coachSkin = useCoachMatchSkin();
  const joueurSkin = useJoueurMatchSkin();
  const coachTokens = useCoachTokens();
  const identity = useJoueurPageIdentity();
  const playerTheme = usePlayerThemeColors();

  return useMemo(() => {
    if (coachSkin) {
      return {
        accent: coachTokens.accent,
        soft: coachTokens.soft ?? 'rgba(255,255,255,0.08)',
        live: MATCH_SITE.live,
        warn: MATCH_SITE.warn,
        border: coachTokens.border,
        foreground: coachTokens.foreground,
        muted: coachTokens.muted,
        surface: coachTokens.surface,
        elevated: coachTokens.elevated ?? coachTokens.surface,
        cardRadius: 16,
        joueurSkin: false,
        coachSkin: true,
      };
    }
    if (joueurSkin) {
      return {
        accent: playerTheme.accent,
        soft: playerTheme.accentSoft,
        live: playerTheme.accent,
        warn: JOUEUR_SITE.warn,
        border: PLAYER_DARK.border,
        foreground: PLAYER_DARK.text,
        muted: PLAYER_DARK.textMuted,
        surface: playerTheme.surface,
        elevated: playerTheme.surfaceRaised,
        cardRadius: identity?.density === 'playful' ? 20 : 16,
        joueurSkin: true,
        coachSkin: false,
      };
    }
    return {
      accent: colors.accent,
      soft: MATCH_SITE.soft,
      live: MATCH_SITE.live,
      warn: MATCH_SITE.warn,
      border: MATCH_SITE.border,
      foreground: MATCH_SITE.foreground,
      muted: MATCH_SITE.muted,
      surface: MATCH_SITE.surface,
      elevated: MATCH_SITE.elevated,
      cardRadius: 2,
      joueurSkin: false,
      coachSkin: false,
    };
  }, [coachSkin, joueurSkin, coachTokens, identity, colors.accent, playerTheme]);
}

type SiteTokens = Pick<CoachThemeTokens, 'surface' | 'border' | 'foreground' | 'muted'>;

function matchSiteTokens(
  coachSkin: boolean,
  joueurSkin: boolean,
  coachTokens: CoachThemeTokens,
  skin: MatchSkinTokens,
): SiteTokens {
  if (coachSkin) return coachTokens;
  if (joueurSkin) {
    return {
      surface: skin.surface,
      border: skin.border,
      foreground: skin.foreground,
      muted: skin.muted,
    };
  }
  return MATCH_SITE;
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
  const skin = useMatchSkinTokens();
  const coachSkin = skin.coachSkin;
  const coachTokens = useCoachTokens();
  const styles = useMemo(
    () => createCardStyles(skin.accent, coachSkin, skin.joueurSkin, coachTokens, skin),
    [skin, coachSkin, coachTokens],
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
  const skin = useMatchSkinTokens();
  const coachSkin = skin.coachSkin;
  const coachTokens = useCoachTokens();
  const styles = useMemo(
    () => createKpiStyles(skin.accent, coachSkin, skin.joueurSkin, coachTokens, skin),
    [skin, coachSkin, coachTokens],
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
  const skin = useMatchSkinTokens();
  const coachSkin = skin.coachSkin;
  const coachTokens = useCoachTokens();
  const styles = useMemo(
    () => createActionStyles(skin.accent, coachSkin, skin.joueurSkin, coachTokens, skin),
    [skin, coachSkin, coachTokens],
  );

  return (
    <View style={styles.row}>
      <PressableSpring onPress={onPrimary} scaleTo={0.98} haptic style={styles.primary}>
        <ProDayText variant="caption" style={styles.primaryText}>
          {primary}
        </ProDayText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring onPress={onSecondary} scaleTo={0.98} style={styles.secondary}>
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
  const skin = useMatchSkinTokens();
  const styles = useMemo(() => createFilterStyles(skin), [skin]);
  return <View style={[styles.bar, style]}>{children}</View>;
}

/** Panneau léger (liste / détail) avec barre gauche accent. */
export function MatchLightPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const skin = useMatchSkinTokens();
  const coachSkin = skin.coachSkin;
  const coachTokens = useCoachTokens();
  const styles = useMemo(
    () => createCardStyles(skin.accent, coachSkin, skin.joueurSkin, coachTokens, skin),
    [skin, coachSkin, coachTokens],
  );
  return <View style={[styles.card, style]}>{children}</View>;
}

function createCardStyles(
  accent: string,
  coachSkin: boolean,
  joueurSkin: boolean,
  coachTokens: CoachThemeTokens,
  skin: MatchSkinTokens,
) {
  const site = matchSiteTokens(coachSkin, joueurSkin, coachTokens, skin);
  return StyleSheet.create({
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      borderLeftWidth: joueurSkin || coachSkin ? StyleSheet.hairlineWidth : 2,
      borderLeftColor: joueurSkin || coachSkin ? site.border : accent,
      borderRadius: skin.cardRadius,
      padding: spacing.md,
      gap: spacing.xs,
      backgroundColor: site.surface,
      ...(joueurSkin
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }
        : null),
    },
    kicker: {
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: joueurSkin ? 2 : 2.4,
      fontSize: joueurSkin ? 9 : 10,
      fontWeight: '800',
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

function createKpiStyles(
  accent: string,
  coachSkin: boolean,
  joueurSkin: boolean,
  coachTokens: CoachThemeTokens,
  skin: MatchSkinTokens,
) {
  const site = matchSiteTokens(coachSkin, joueurSkin, coachTokens, skin);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      backgroundColor: site.surface,
      borderRadius: skin.cardRadius,
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

function createActionStyles(
  accent: string,
  coachSkin: boolean,
  joueurSkin: boolean,
  coachTokens: CoachThemeTokens,
  skin: MatchSkinTokens,
) {
  const site = matchSiteTokens(coachSkin, joueurSkin, coachTokens, skin);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    primary: {
      borderRadius: skin.cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: accent,
    },
    primaryText: { color: '#fff', fontWeight: '800', letterSpacing: joueurSkin ? 0.8 : 0.2 },
    secondary: {
      borderRadius: skin.cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: site.border,
      backgroundColor: joueurSkin ? 'rgba(255,255,255,0.04)' : 'transparent',
    },
    secondaryText: { color: site.foreground, fontWeight: '700' },
  });
}

function createFilterStyles(skin: MatchSkinTokens) {
  return StyleSheet.create({
    bar: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: skin.border,
      borderRadius: skin.cardRadius,
      padding: spacing.sm,
      gap: spacing.sm,
      backgroundColor: skin.joueurSkin ? PLAYER_DARK.bgElevated : skin.surface,
    },
  });
}
