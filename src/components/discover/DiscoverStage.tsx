import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { DiscoverStageHero } from './DiscoverStageHero';
import { PitchSheetChrome } from '../auth/PitchSheetChrome';
import { usePitchStyles } from '../auth/pitchStyles';
import { ProDayModuleGrid } from '../ui/ProDayModuleGrid';
import { DiscoverActivityStrip } from './DiscoverActivityStrip';
import { Icon } from '../ui/Icon';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { ProDayModuleId } from '../../content/prodayModules';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';

export interface DiscoverStageProps {
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
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
  loading,
  statsLabel,
  onSignup,
  onPress,
  onModulePress,
}) => {
  const { colors: c } = useDiscoverStyles();
  const pitchStyles = usePitchStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const hasActivity = posts.length > 0;

  return (
    <ProDayScreenCanvas>
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
            Mercato, matchs et sponsors — une seule app pour votre saison.
          </Text>

          {!loading && stats ? (
            <Pressable style={styles.statsPill} onPress={onPress}>
              <View style={styles.statsDot} />
              <Text style={styles.statsPillText} numberOfLines={1}>
                {statsLabel}
              </Text>
              <Icon name="chevron-forward" size={16} color={c.textMuted} />
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
            <Icon name="shield" size={18} color={c.ink} variant="filled" />
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
    </ProDayScreenCanvas>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
    },
    statsDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.accent,
    },
    statsPillText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    modulesLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.md,
    },
    trust: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    trustText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: c.textSecondary,
      fontWeight: '500',
    },
    trustBold: {
      fontWeight: '800',
      color: c.text,
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
      color: c.textMuted,
    },
    ctas: {
      marginTop: spacing.xl,
      gap: spacing.md,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      ...shadows.fab,
    },
    primaryBtnText: {
      color: c.brandInverse,
      fontSize: 16,
      fontWeight: '800',
    },
    secondaryBtnText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      textDecorationLine: 'underline',
    },
  });
}
