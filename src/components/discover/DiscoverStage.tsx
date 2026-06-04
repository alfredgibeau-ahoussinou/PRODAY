import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { DiscoverStageHero } from './DiscoverStageHero';
import { PitchSheetChrome } from '../auth/PitchSheetChrome';
import { pitchStyles } from '../auth/pitchStyles';
import { ProDayModuleGrid } from '../ui/ProDayModuleGrid';
import { DiscoverActivityStrip } from './DiscoverActivityStrip';
import { Icon } from '../ui/Icon';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament } from '../../models/Tournament';
import type { ProDayModuleId } from '../../content/prodayModules';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

export interface DiscoverStageProps {
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  statsLabel: string;
  onSignup: () => void;
  onPress: () => void;
  onModulePress: (id: ProDayModuleId) => void;
}

/**
 * Accueil invité — même squelette que la page de connexion.
 */
export const DiscoverStage: React.FC<DiscoverStageProps> = ({
  stats,
  posts,
  tournaments,
  loading,
  statsLabel,
  onSignup,
  onPress,
  onModulePress,
}) => {
  const hasActivity = posts.length > 0 || tournaments.length > 0;

  return (
    <View style={pitchStyles.root}>
      <ScrollView
        contentContainerStyle={[
          pitchStyles.scrollContent,
          { paddingBottom: TAB_BAR_CONTENT_INSET },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DiscoverStageHero />

        <View style={pitchStyles.sheet}>
          <PitchSheetChrome />

          <Text style={pitchStyles.sheetTitle}>Le foot amateur, enfin connecté</Text>
          <Text style={pitchStyles.sheetSub}>
            Mercato, matchs, Arena et sponsors — une seule app pour votre saison.
          </Text>

          {!loading && stats ? (
            <Pressable style={styles.statsPill} onPress={onPress}>
              <View style={styles.statsDot} />
              <Text style={styles.statsPillText} numberOfLines={1}>
                {statsLabel}
              </Text>
              <Icon name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}

          <Text style={styles.modulesLabel}>Modules</Text>
          <ProDayModuleGrid
            onModulePress={onModulePress}
            liveRecruitment={Boolean(stats?.recruitment_posts_open)}
            animated={false}
            fullWidthModuleId="gestion"
          />

          <View style={styles.trust}>
            <Icon name="shield" size={18} color={colors.ink} variant="filled" />
            <Text style={styles.trustText}>
              <Text style={styles.trustBold}>Profils vérifiés</Text>
              {' — coachs et agents validés avant la messagerie complète.'}
            </Text>
          </View>

          {hasActivity || loading ? (
            <View style={styles.activity}>
              <Text style={styles.activityLabel}>Activité récente</Text>
              <DiscoverActivityStrip
                posts={posts}
                tournaments={tournaments}
                loading={loading}
                onPress={onPress}
              />
            </View>
          ) : null}

          <View style={styles.ctas}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSignup} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Créer mon compte gratuit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSignup} activeOpacity={0.6}>
              <Text style={styles.secondaryBtnText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  statsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statsPillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modulesLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  trustBold: {
    fontWeight: '800',
    color: colors.text,
  },
  activity: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  ctas: {
    marginTop: spacing.xl,
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadows.fab,
  },
  primaryBtnText: {
    color: colors.brandInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtnText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
