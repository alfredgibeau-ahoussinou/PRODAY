import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import type { RecruitmentPost, Application } from '../models/Player';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ApplicationReviewCard } from '../components/recruitment/ApplicationReviewCard';
import {
  recruitmentService,
  formatTimeAgo,
  canManagePostApplications,
} from '../services/recruitment.service';
import { SubscriptionLimitError } from '../services/subscription.service';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';

interface RecruitmentPostScreenProps {
  postId: string;
  profile: User | null;
  onBack: () => void;
  onViewPlayer?: (playerUid: string) => void;
}

export const RecruitmentPostScreen: React.FC<RecruitmentPostScreenProps> = ({
  postId,
  profile,
  onBack,
  onViewPlayer,
}) => {
  const [post, setPost] = useState<RecruitmentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const subscriptionCtx = useSubscriptionOptional();
  const { colors: themeColors, productLine, rootStyle } = useThemedScreen();

  const load = useCallback(async () => {
    setLoading(true);
    const p = await recruitmentService.getPostById(postId);
    setPost(p);
    if (profile?.uid) {
      const has = await recruitmentService.hasPlayerApplied(postId, profile.uid);
      setApplied(has);
    }
    if (p && profile && canManagePostApplications(profile, p)) {
      setApplications(await recruitmentService.listApplicationsForPost(postId));
    } else {
      setApplications([]);
    }
    setLoading(false);
  }, [postId, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const isManager = post && profile && canManagePostApplications(profile, post);

  const handleApply = async () => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    if (profile.role !== 'player') {
      Alert.alert(
        productLine === 'woman' ? 'Réservé aux joueuses' : 'Réservé aux joueurs',
        productLine === 'woman'
          ? 'Seules les joueuses peuvent postuler à une annonce.'
          : 'Seuls les joueurs peuvent postuler à une annonce.'
      );
      return;
    }
    if (!coverLetter.trim()) {
      Alert.alert('Message requis', 'Rédigez une courte lettre de motivation.');
      return;
    }
    if (!post) return;

    setSubmitting(true);
    try {
      await recruitmentService.applyToPost(
        {
          post_id: post.id,
          post_author_uid: post.author_uid ?? post.club_id,
          player_uid: profile.uid,
          player_name: profile.display_name,
          cover_letter: coverLetter.trim(),
        },
        profile
      );
      void subscriptionCtx?.refresh();
      setApplied(true);
      Alert.alert('Candidature envoyée', 'Le club pourra consulter votre profil.');
    } catch (e) {
      if (e instanceof SubscriptionLimitError) {
        subscriptionCtx?.openUpgradeForFeature(e.feature);
        return;
      }
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (
    app: Application,
    status: Application['status'],
    rejectionReason?: string
  ) => {
    setUpdatingId(app.id);
    try {
      await recruitmentService.updateApplicationStatus(app.id, status, rejectionReason);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loader, rootStyle]}>
        <ActivityIndicator size="large" color={themeColors.brand} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.loader, rootStyle]}>
        <ScreenHeader title="Annonce" onBack={onBack} />
        <Text style={[styles.missing, { color: themeColors.textMuted }]}>
          Annonce introuvable ou fermée.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Annonce" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.club, { color: themeColors.textMuted }]}>{post.club_name}</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {post.title || `Recherche ${post.position}`}
          </Text>
          <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
            {post.position} · {post.category} · {post.level}
          </Text>
          <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
            {post.city} · {formatTimeAgo(post.created_at)}
          </Text>
        </View>

        {post.description ? (
          <>
            <Text style={[styles.section, { color: themeColors.text }]}>Description</Text>
            <Text style={[styles.body, { color: themeColors.textSecondary }]}>
              {post.description}
            </Text>
          </>
        ) : null}

        {isManager ? (
          <>
            <Text style={[styles.section, { color: themeColors.text }]}>
              Candidatures ({applications.length})
            </Text>
            {applications.length === 0 ? (
              <Text style={[styles.hint, { color: themeColors.textMuted }]}>
                Aucune candidature pour le moment.
              </Text>
            ) : (
              applications.map((app) => (
                <ApplicationReviewCard
                  key={app.id}
                  application={app}
                  busy={updatingId === app.id}
                  onViewProfile={
                    onViewPlayer ? () => onViewPlayer(app.player_uid) : undefined
                  }
                  onMarkViewed={() => updateStatus(app, 'VIEWED')}
                  onAccept={() => updateStatus(app, 'ACCEPTED')}
                  onReject={(reason) => updateStatus(app, 'REJECTED', reason)}
                />
              ))
            )}
          </>
        ) : profile?.role === 'player' ? (
          <>
            <Text style={[styles.section, { color: themeColors.text }]}>Postuler</Text>
            {applied ? (
              <Text style={[styles.applied, { color: themeColors.brand }]}>
                Vous avez déjà postulé à cette annonce.
              </Text>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  placeholder="Présentez-vous en quelques lignes…"
                  placeholderTextColor={themeColors.textMuted}
                  value={coverLetter}
                  onChangeText={setCoverLetter}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    { backgroundColor: themeColors.brand },
                    submitting && styles.applyDisabled,
                  ]}
                  onPress={handleApply}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.applyText}>Envoyer ma candidature</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        ) : !profile ? (
          <Text style={[styles.hint, { color: themeColors.textMuted }]}>
            Connectez-vous pour postuler à cette annonce.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missing: { marginTop: spacing.xl, fontSize: 15 },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  club: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  meta: { fontSize: 14, marginTop: 6 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  applyBtn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyDisabled: { opacity: 0.6 },
  applyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  applied: { fontWeight: '600', fontSize: 14 },
  hint: { fontSize: 14, lineHeight: 22 },
});
