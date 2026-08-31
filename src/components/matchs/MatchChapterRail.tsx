import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Platform, View } from 'react-native';
import type { MatchChapterId } from '../../content/matchChapters';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { useTranslation } from '../../context/LocaleContext';
import { getMatchChapters, getJoueurMatchChapters } from '../../i18n/localizedChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import type { ResolvedPlayerThemeColors } from '../../utils/resolvePlayerThemeColors';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

interface MatchChapterRailProps {
  active: MatchChapterId;
  onSelect: (id: MatchChapterId) => void;
  amicauxBadge?: number;
  convocationsBadge?: number;
  centreBadge?: number | string;
  /** Labels stages type jeu vidéo (pôle Joueur). */
  gameMode?: boolean;
  /** Peau Pôle Coach — pills sombres, pas de rail terminal. */
  coachSkin?: boolean;
}

const GAME_STAGE_LABELS: Partial<Record<MatchChapterId, string>> = {
  calendrier: 'Calendrier',
  convocations: 'Convocations',
  centre: 'En direct',
  amicaux: 'Amicaux',
};

/** Navigation Match Center — onglets terminal (hairline, pas de pills). */
export const MatchChapterRail: React.FC<MatchChapterRailProps> = ({
  active,
  onSelect,
  amicauxBadge,
  convocationsBadge,
  centreBadge,
  gameMode = false,
  coachSkin = false,
}) => {
  const { colors } = useAppTheme();
  const coachTokens = useCoachTokens();
  const playerTheme = usePlayerThemeColors();
  const { t } = useTranslation();
  const chapters = useMemo(
    () => (gameMode ? getJoueurMatchChapters(t) : getMatchChapters(t)),
    [gameMode, t],
  );
  const chipAccent = gameMode ? playerTheme.accent : colors.accent;
  const joueurChipBg = playerTheme.surface ?? PLAYER_DARK.surface;
  const styles = useMemo(
    () => createStyles(chipAccent, gameMode, coachSkin, coachTokens, playerTheme),
    [chipAccent, gameMode, coachSkin, coachTokens, playerTheme],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.wrap}
      bounces={false}
    >
      {chapters.map((ch) => {
        const on = ch.id === active;
        const badge =
          ch.id === 'amicaux' && amicauxBadge && amicauxBadge > 0
            ? amicauxBadge
            : ch.id === 'convocations' && convocationsBadge && convocationsBadge > 0
              ? convocationsBadge
              : ch.id === 'centre' && centreBadge
                ? centreBadge
                : null;
        const label = gameMode ? GAME_STAGE_LABELS[ch.id] ?? ch.shortLabel : ch.shortLabel;

        return (
          <PressableSpring
            key={ch.id}
            style={[styles.tab, on && styles.tabOn]}
            onPress={() => {
              if (!on) {
                prodayHaptics.tabSwitch();
                onSelect(ch.id);
              }
            }}
            scaleTo={0.97}
          >
            <ProDayText
              variant="caption"
              style={[styles.label, on ? styles.labelOn : styles.labelOff]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </ProDayText>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: on ? chipAccent : gameMode ? joueurChipBg : MATCH_SITE.elevated,
                  },
                ]}
              >
                <ProDayText variant="caption" style={styles.badgeText}>
                  {typeof badge === 'number' && badge > 9 ? '9+' : badge}
                </ProDayText>
              </View>
            ) : null}
            {on && !coachSkin ? <View style={[styles.underline, { backgroundColor: chipAccent }]} /> : null}
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
};

function createStyles(
  accent: string,
  gameMode = false,
  coachSkin = false,
  coachTokens?: CoachThemeTokens,
  playerTheme?: Pick<ResolvedPlayerThemeColors, 'accent' | 'accentSoft' | 'surface'>,
) {
  const coachSurface = coachTokens?.surface ?? '#1C1C1E';
  const coachElevated = coachTokens?.elevated ?? '#2C2C2E';
  const joueurChipBg = playerTheme?.surface ?? PLAYER_DARK.surface;
  const joueurChipBorder = '#2A2A38';
  const joueurChipOnBg = playerTheme?.accentSoft ?? PLAYER_DARK.accentSoft;
  const joueurChipOnBorder = playerTheme?.accent ?? PLAYER_DARK.accent;
  const joueurAccent = playerTheme?.accent ?? PLAYER_DARK.accent;

  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: gameMode || coachSkin ? 52 : 48,
      borderBottomWidth: coachSkin || gameMode ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: MATCH_SITE.border,
      backgroundColor: 'transparent',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: gameMode ? spacing.xs : 0,
      gap: gameMode || coachSkin ? 8 : 2,
      alignItems: 'center',
    },
    tab: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: gameMode ? 8 : 10,
      paddingHorizontal: gameMode ? spacing.lg : spacing.md,
      borderBottomWidth: gameMode || coachSkin ? 0 : 2,
      borderBottomColor: 'transparent',
      borderRadius: gameMode || coachSkin ? 18 : 0,
      borderWidth: gameMode ? 1 : 0,
      borderColor: gameMode ? joueurChipBorder : 'transparent',
      backgroundColor: coachSkin ? coachSurface : gameMode ? joueurChipBg : 'transparent',
      minHeight: gameMode ? 36 : undefined,
    },
    tabOn: {
      backgroundColor: gameMode
        ? joueurChipOnBg
        : coachSkin
          ? coachElevated
          : MATCH_SITE.soft,
      borderColor: gameMode ? joueurChipOnBorder : gameMode ? joueurChipBorder : 'transparent',
    },
    label: {
      fontWeight: '800',
      fontSize: gameMode ? 11 : 12,
      letterSpacing: gameMode ? 0.3 : 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    labelOn: {
      color: gameMode ? joueurAccent : accent,
    },
    labelOff: {
      color: gameMode ? PLAYER_DARK.textMuted : MATCH_SITE.muted,
    },
    badge: {
      minWidth: 18,
      height: 16,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },
    badgeText: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 9,
      letterSpacing: 0.4,
    },
    underline: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: 0,
      height: 2,
    },
  });
}
