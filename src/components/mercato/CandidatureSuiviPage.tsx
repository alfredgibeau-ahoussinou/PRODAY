import React from 'react';
import { useTranslation } from '../../context/LocaleContext';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { RecruitmentPost, Application } from '../../models/Player';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { SkeletonList, InteractiveListItem } from '../motion';
import { ListEmptyPanel } from '../ui/ListEmptyPanel';
import { useAppTheme } from '../../context/ProductLineContext';
import { formatTimeAgo, APPLICATION_STATUS_LABEL } from '../../services/recruitment.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface CandidatureSuiviPageProps {
  applicationsCount: number;
  loadingApps: boolean;
  applications: { application: Application; post: RecruitmentPost | null }[];
  onSelectPost: (id: string) => void;
  onOpenApplications: () => void;
  onGoToAnnonces: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export const CandidatureSuiviPage: React.FC<CandidatureSuiviPageProps> = ({
  applicationsCount,
  loadingApps,
  applications,
  onSelectPost,
  onOpenApplications,
  onGoToAnnonces,
  refreshing,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <ProDayText variant="body" muted style={styles.suiviSub}>
        Suivez vos réponses clubs et relancez depuis votre profil.
      </ProDayText>

      <View style={styles.tips}>
        <ProDayText variant="eyebrow" accent>
          Conseils
        </ProDayText>
        {[
          'Personnalisez chaque lettre de motivation',
          t('mercato.tracking.tip1'),
          t('mercato.tracking.tip2'),
        ].map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <Icon name="football" size={12} color={colors.accent} variant="filled" />
            <ProDayText variant="caption" muted style={styles.tipText}>
              {tip}
            </ProDayText>
          </View>
        ))}
      </View>

      {loadingApps ? (
        <SkeletonList count={3} variant="card" />
      ) : applications.length === 0 ? (
        <ListEmptyPanel
          icon="briefcase"
          title="Aucune candidature"
          subtitle="Parcourez les annonces et postulez en quelques lignes."
          primaryCta={{ label: 'Voir les annonces', onPress: onGoToAnnonces }}
        />
      ) : (
        applications.map(({ application, post }, index) => (
          <InteractiveListItem
            key={application.id}
            index={index}
            onPress={() => post && onSelectPost(post.id)}
          >
            <View
              style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.appHead}>
                <ProDayText variant="section" numberOfLines={1}>
                  {post?.club_name ?? 'Club'}
                </ProDayText>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        application.status === 'ACCEPTED'
                          ? colors.successBg
                          : application.status === 'REJECTED'
                            ? colors.warningBg
                            : colors.accentSoft,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent>
                    {APPLICATION_STATUS_LABEL[application.status]}
                  </ProDayText>
                </View>
              </View>
              <ProDayText variant="body" muted numberOfLines={1}>
                {post?.title ?? post?.position ?? 'Annonce'}
              </ProDayText>
              <ProDayText variant="caption" muted style={styles.appDate}>
                {formatTimeAgo(application.created_at)}
              </ProDayText>
            </View>
          </InteractiveListItem>
        ))
      )}

      {applicationsCount > 0 ? (
        <TouchableOpacity onPress={onOpenApplications} style={styles.linkBtn}>
          <ProDayText variant="caption" accent>
            Voir tout dans mon profil →
          </ProDayText>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  suiviSub: { marginTop: spacing.sm, marginBottom: spacing.md },
  tips: { marginBottom: spacing.lg, gap: spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipText: { flex: 1, lineHeight: 18 },
  appCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  appHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  appDate: { marginTop: 4 },
  linkBtn: { alignItems: 'center', marginTop: spacing.md },
});
