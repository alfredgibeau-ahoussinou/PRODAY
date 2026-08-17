import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Platform, View } from 'react-native';
import type { MatchChapterId } from '../../content/matchChapters';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { useTranslation } from '../../context/LocaleContext';
import { getMatchChapters } from '../../i18n/localizedChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

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
  calendrier: 'FIXTURE',
  centre: 'LIVE',
  convocations: 'CALLOUT',
  stats: 'STATS',
  amicaux: 'FRIENDLY',
  tournois: 'CUP',
  competitions: 'LEAGUE',
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
  const { t } = useTranslation();
  const chapters = useMemo(() => getMatchChapters(t), [t]);
  const styles = useMemo(
    () => createStyles(colors.accent, gameMode, coachSkin, coachTokens),
    [colors.accent, gameMode, coachSkin, coachTokens],
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
            >
              {label}
            </ProDayText>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      ch.id === 'centre' ? MATCH_SITE.live : on ? colors.accent : MATCH_SITE.elevated,
                  },
                ]}
              >
                <ProDayText variant="caption" style={styles.badgeText}>
                  {typeof badge === 'number' && badge > 9 ? '9+' : badge}
                </ProDayText>
              </View>
            ) : null}
            {on && !coachSkin ? <View style={[styles.underline, { backgroundColor: colors.accent }]} /> : null}
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
) {
  const coachSurface = coachTokens?.surface ?? '#1C1C1E';
  const coachElevated = coachTokens?.elevated ?? '#2C2C2E';

  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: gameMode || coachSkin ? 52 : 48,
      borderBottomWidth: coachSkin ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: MATCH_SITE.border,
      backgroundColor: 'transparent',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: 0,
      gap: gameMode || coachSkin ? 6 : 2,
      alignItems: 'center',
    },
    tab: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: gameMode || coachSkin ? 0 : 2,
      borderBottomColor: 'transparent',
      borderRadius: gameMode || coachSkin ? 18 : 0,
      borderWidth: gameMode ? StyleSheet.hairlineWidth : 0,
      borderColor: gameMode ? 'rgba(255,255,255,0.1)' : 'transparent',
      backgroundColor: coachSkin ? coachSurface : 'transparent',
    },
    tabOn: {
      backgroundColor: gameMode
        ? `${accent}28`
        : coachSkin
          ? coachElevated
          : MATCH_SITE.soft,
    },
    label: {
      fontWeight: '800',
      fontSize: gameMode ? 10 : 12,
      letterSpacing: gameMode ? 1.1 : 0.3,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    labelOn: { color: accent },
    labelOff: { color: MATCH_SITE.muted },
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
