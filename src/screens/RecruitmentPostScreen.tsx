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
import { colors, spacing, radius } from '../theme/designTokens';

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
      Alert.alert('Réservé aux joueurs', 'Seuls les joueurs peuvent postuler à une annonce.');
      return;
    }
    if (!coverLetter.trim()) {
      Alert.alert('Message requis', 'Rédigez une courte lettre de motivation.');
      return;
    }
    if (!post) return;

    setSubmitting(true);
    try {
      await recruitmentService.applyToPost({
        post_id: post.id,
        post_author_uid: post.author_uid ?? post.club_id,
        player_uid: profile.uid,
        player_name: profile.display_name,
        cover_letter: coverLetter.trim(),
      });
      setApplied(true);
      Alert.alert('Candidature envoyée', 'Le club pourra consulter votre profil.');
    } catch (e) {
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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loader}>
        <ScreenHeader title="Annonce" onBack={onBack} />
        <Text style={styles.missing}>Annonce introuvable ou fermée.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Annonce" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.club}>{post.club_name}</Text>
          <Text style={styles.title}>{post.title || `Recherche ${post.position}`}</Text>
          <Text style={styles.meta}>
            {post.position} · {post.category} · {post.level}
          </Text>
          <Text style={styles.meta}>
            {post.city} · {formatTimeAgo(post.created_at)}
          </Text>
        </View>

        {post.description ? (
          <>
            <Text style={styles.section}>Description</Text>
            <Text style={styles.body}>{post.description}</Text>
          </>
        ) : null}

        {isManager ? (
          <>
            <Text style={styles.section}>Candidatures ({applications.length})</Text>
            {applications.length === 0 ? (
              <Text style={styles.hint}>Aucune candidature pour le moment.</Text>
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
            <Text style={styles.section}>Postuler</Text>
            {applied ? (
              <Text style={styles.applied}>Vous avez déjà postulé à cette annonce.</Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Présentez-vous en quelques lignes…"
                  placeholderTextColor={colors.textMuted}
                  value={coverLetter}
                  onChangeText={setCoverLetter}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.applyBtn, submitting && styles.applyDisabled]}
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
          <Text style={styles.hint}>Connectez-vous pour postuler à cette annonce.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  missing: { color: colors.textMuted, marginTop: spacing.xl, fontSize: 15 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  club: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  applyBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyDisabled: { opacity: 0.6 },
  applyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  applied: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  hint: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
});
