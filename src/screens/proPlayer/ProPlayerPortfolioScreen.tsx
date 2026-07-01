import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { LazyReelsScreen } from '../LazyReelsScreen';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { hasCoachValidatedStats } from '../../utils/proPlayerCareerMetrics';
import { buildPlayerCvHtmlFromUser } from '../../utils/pdfGenerator';
import { openPlayerCvHtml } from '../../utils/openCvHtml';

/** Onglet Portfolio — vidéos taguées et stats validées coach. */
export const ProPlayerPortfolioScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();

  const stats = profile?.profile.season_stats;
  const validated = profile ? hasCoachValidatedStats(profile) : false;

  const statsLine = useMemo(() => {
    if (!stats || stats.matches === 0) return 'Aucune stat saison renseignée.';
    return `${stats.matches} matchs · ${stats.goals} buts · ${stats.assists} passes`;
  }, [stats]);

  const handleExport = () => {
    if (!profile) return;
    const html = buildPlayerCvHtmlFromUser(profile);
    openPlayerCvHtml(html, profile.display_name);
  };

  return (
    <View style={styles.root}>
      {profile ? (
        <ProDaySurface style={styles.banner}>
          <ProDayText variant="eyebrow" muted>
            Portfolio scouting
          </ProDayText>
          <ProDayText variant="caption" muted>
            Vidéos par match · stats saison
          </ProDayText>

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statsCopy}>
              <ProDayText variant="body">{statsLine}</ProDayText>
              {validated ? (
                <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="checkmark-circle" size={14} color={colors.accent} />
                  <ProDayText variant="caption" accent>
                    Validé coach
                  </ProDayText>
                </View>
              ) : (
                <ProDayText variant="caption" muted>
                  En attente de validation coach
                </ProDayText>
              )}
            </View>
            <PressableSpring
              style={[styles.exportBtn, { borderColor: colors.border }]}
              onPress={handleExport}
              scaleTo={0.97}
              haptic
            >
              <Icon name="share" size={16} color={colors.accent} />
              <ProDayText variant="caption" accent>
                Export PDF
              </ProDayText>
            </PressableSpring>
          </View>
        </ProDaySurface>
      ) : null}
      <LazyReelsScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  statsCopy: { gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  exportBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
