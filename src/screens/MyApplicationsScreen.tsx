import React, { useCallback, useEffect, useState } from 'react';
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
import { colors, spacing, radius } from '../theme/designTokens';

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
  const [items, setItems] = useState<
    { application: Application; post: RecruitmentPost | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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

  return (
    <View style={styles.root}>
      <ScreenHeader title="Mes candidatures" onBack={onBack} centered />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Icon name="briefcase" size={40} color={colors.accent} />
          <Text style={styles.emptyTitle}>Aucune candidature</Text>
          <Text style={styles.emptySub}>
            Parcourez le Mercato et postulez aux annonces qui vous correspondent.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map(({ application, post }) => (
            <TouchableOpacity
              key={application.id}
              style={styles.card}
              onPress={() => post && setSelectedPostId(post.id)}
              activeOpacity={0.9}
              disabled={!post}
            >
              <View style={styles.cardTop}>
                <Text style={styles.club}>{post?.club_name ?? 'Annonce'}</Text>
                <View
                  style={[
                    styles.statusPill,
                    application.status === 'ACCEPTED' && styles.statusOk,
                    application.status === 'REJECTED' && styles.statusBad,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {STATUS_LABEL[application.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.title}>
                {post?.title || post?.position || 'Recrutement'}
              </Text>
              <Text style={styles.meta}>
                {formatTimeAgo(application.created_at)}
                {post?.city ? ` · ${post.city}` : ''}
              </Text>
              {application.cover_letter ? (
                <Text style={styles.letter} numberOfLines={2}>
                  {application.cover_letter}
                </Text>
              ) : null}
              {post ? (
                <View style={styles.ctaRow}>
                  <Text style={styles.cta}>Voir l&apos;annonce</Text>
                  <Icon name="chevron-forward" size={16} color={colors.accent} />
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  emptySub: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 280,
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  club: { fontSize: 11, fontWeight: '800', color: colors.accent, flex: 1 },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOk: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  statusBad: { backgroundColor: colors.warningBg },
  statusText: { fontSize: 10, fontWeight: '800', color: colors.text },
  title: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  letter: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  cta: { fontSize: 12, fontWeight: '800', color: colors.accent },
});
