import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { RecruitmentPostScreen } from './RecruitmentPostScreen';
import { recruitmentService, formatTimeAgo, APPLICATION_STATUS_LABEL } from '../services/recruitment.service';
import { useAuth } from '../context/AuthContext';
import type { Application, RecruitmentPost } from '../models/Player';
import { Icon } from '../components/ui/Icon';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import { StaggerReveal } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

const STATUS_LABEL = APPLICATION_STATUS_LABEL;

interface MyApplicationsScreenProps {
  playerUid: string;
  onBack: () => void;
}

export const MyApplicationsScreen: React.FC<MyApplicationsScreenProps> = ({
  playerUid,
  onBack,
}) => {
  const { profile } = useAuth();
  const { colors: themeColors, rootStyle, productLine } = useThemedScreen();
  const useShellHeader = isSubScreenShellEnabled(profile, 'player');
  const [items, setItems] = useState<
    { application: Application; post: RecruitmentPost | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const pendingCount = useMemo(
    () => items.filter(({ application }) => application.status === 'PENDING').length,
    [items]
  );
  const intelligence = useSectionIntelligence('recrutement', profile ?? null, productLine, {
    mercatoApplications: pendingCount,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const apps = await recruitmentService.listMyApplications(playerUid);
    const withPosts = await Promise.all(
      apps.map(async (application) => ({
        application,
        post: await recruitmentService.getPostById(application.post_id),
      }))
    );
    setItems(withPosts);
    setLoading(false);
  }, [playerUid]);

  useEffect(() => {
    load();
  }, [load]);

  if (selectedPostId && profile) {
    return (
      <RecruitmentPostScreen
        postId={selectedPostId}
        profile={profile}
        onBack={() => setSelectedPostId(null)}
      />
    );
  }

  const listBody =
    loading ? (
      <ActivityIndicator color={themeColors.brand} style={styles.loader} />
    ) : items.length === 0 ? (
      <View style={styles.emptyWrap}>
        <Icon name="briefcase" size={40} color={themeColors.brand} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucune candidature</Text>
        <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
          Parcourez le Mercato et postulez aux annonces qui vous correspondent.
        </Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={styles.list}>
        {items.map(({ application, post }, index) => {
          const card = (
            <TouchableOpacity
              key={application.id}
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => post && setSelectedPostId(post.id)}
              activeOpacity={0.9}
              disabled={!post}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.club, { color: themeColors.brand }]}>
                  {post?.club_name ?? 'Annonce'}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: themeColors.surfaceMuted,
                      borderColor: themeColors.border,
                    },
                    application.status === 'ACCEPTED' && {
                      backgroundColor: themeColors.accentSoft,
                      borderColor: themeColors.brand,
                    },
                    application.status === 'REJECTED' && {
                      backgroundColor: themeColors.warningBg,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: themeColors.text }]}>
                    {STATUS_LABEL[application.status]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.title, { color: themeColors.text }]}>
                {post?.title || post?.position || 'Recrutement'}
              </Text>
              <Text style={[styles.meta, { color: themeColors.textMuted }]}>
                {formatTimeAgo(application.created_at)}
                {post?.city ? ` · ${post.city}` : ''}
              </Text>
              {application.cover_letter ? (
                <Text style={[styles.letter, { color: themeColors.textSecondary }]} numberOfLines={2}>
                  {application.cover_letter}
                </Text>
              ) : null}
              {post ? (
                <View style={styles.ctaRow}>
                  <Text style={[styles.cta, { color: themeColors.brand }]}>Voir l&apos;annonce</Text>
                  <Icon name="chevron-forward" size={16} color={themeColors.brand} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
          return useShellHeader ? (
            <StaggerReveal key={application.id} index={Math.min(index, 8)}>
              {card}
            </StaggerReveal>
          ) : (
            card
          );
        })}
      </ScrollView>
    );

  if (useShellHeader) {
    return (
      <TabScreenShell
        caption="Mercato"
        title="Mes candidatures"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} en attente de réponse`
            : `${items.length} candidature(s) envoyée(s)`
        }
        left={<ScreenBackButton onPress={onBack} />}
        
        flat
      >
        {listBody}
      </TabScreenShell>
    );
  }

  return (
    <View style={rootStyle}>
      <ScreenHeader title="Mes candidatures" onBack={onBack} centered />
      {listBody}
    </View>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 280,
  },
  list: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg, gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  club: { fontSize: 11, fontWeight: '800', flex: 1 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: 16, fontWeight: '900', marginTop: spacing.sm },
  meta: { fontSize: 12, marginTop: 4 },
  letter: { fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  cta: { fontSize: 12, fontWeight: '800' },
});
