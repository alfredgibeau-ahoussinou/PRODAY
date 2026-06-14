import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import type { RecruitmentPost, Application } from '../models/Player';
import { ApplicationReviewCard } from '../components/recruitment/ApplicationReviewCard';
import { InteractiveListItem, PressableSpring } from '../components/motion';
import { useTabNavigation } from '../context/TabNavigationContext';
import {
  recruitmentService,
  formatTimeAgo,
  canManagePostApplications,
} from '../services/recruitment.service';
import { SubscriptionLimitError } from '../services/subscription.service';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { isV3ShellEnabled } from '../config/featureFlags';
import { trackV3Event } from '../core/analytics/v3Events';
import { userStateStore } from '../core/state/userState.store';
import { flushBrainState } from '../services/brainState.service';
import { recordV3UserAction } from '../utils/recordV3Action';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { AppDetailHeader } from '../components/app';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { ProDayText } from '../components/ui/ProDayText';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { getProfileCompletion } from '../utils/profileCompletion';
import { computeProdayPulse } from '../utils/prodayPulse';
import { usersService } from '../services/users.service';
import { V3TabShell } from '../components/v3/V3TabShell';
import { V3ScreenBack } from '../components/v3/V3ScreenBack';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { useProDayBrain } from '../hooks/useProDayBrain';
import { getPostMercatoFit } from '../features/v3/engines/mercatoPostDetail.engine';

const MAX_LETTER = 600;

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
  const [applicationPulse, setApplicationPulse] = useState<Record<string, number>>({});
  const subscriptionCtx = useSubscriptionOptional();
  const { colors: c, productLine } = useThemedScreen();
  const { requireAuth } = useRequireAuth();
  const { openAuth } = useTabNavigation();

  const load = useCallback(async () => {
    setLoading(true);
    const p = await recruitmentService.getPostById(postId);
    setPost(p);
    if (profile?.uid) {
      const has = await recruitmentService.hasPlayerApplied(postId, profile.uid);
      setApplied(has);
    }
    if (p && profile && canManagePostApplications(profile, p)) {
      const apps = await recruitmentService.listApplicationsForPost(postId);
      const pulseMap: Record<string, number> = {};
      const scored = await Promise.all(
        apps.map(async (app) => {
          const user = await usersService.getById(app.player_uid);
          const score = user ? computeProdayPulse(user).score : 0;
          pulseMap[app.id] = score;
          return { app, score };
        })
      );
      scored.sort((a, b) => b.score - a.score);
      setApplicationPulse(pulseMap);
      setApplications(scored.map((s) => s.app));
    } else {
      setApplications([]);
      setApplicationPulse({});
    }
    setLoading(false);
  }, [postId, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const isManager = post && profile && canManagePostApplications(profile, post);
  const useV3Header = isV3ShellEnabled();
  const brain = useProDayBrain(profile, productLine);
  const pendingApps = useMemo(
    () => applications.filter((app) => app.status === 'PENDING').length,
    [applications]
  );
  const intelligence = useSectionIntelligence('recrutement', profile, productLine, {
    staffMode: Boolean(isManager),
    mercatoApplications: pendingApps,
    mercatoPosts: isManager ? 1 : undefined,
  });
  const mercatoFit = useMemo(() => {
    if (!useV3Header || !profile || !post || profile.role !== 'player') return null;
    return getPostMercatoFit({ profile, post, pulseScore: brain.ai.dynamicScore });
  }, [useV3Header, profile, post, brain.ai.dynamicScore]);
  const letterCount = coverLetter.trim().length;
  const letterOk = letterCount >= 20;
  const completion = profile ? getProfileCompletion(profile) : null;

  const applyTips = useMemo(
    () => [
      'Présentez votre poste et votre niveau actuel',
      'Mentionnez votre disponibilité et votre ville',
      'Restez concis — le club lit des dizaines de profils',
    ],
    [],
  );

  const handleApply = async () => {
    if (!requireAuth('Connectez-vous pour postuler à cette annonce.') || !profile) return;
    if (profile.role !== 'player') {
      Alert.alert(
        productLine === 'woman' ? 'Réservé aux joueuses' : 'Réservé aux joueurs',
        productLine === 'woman'
          ? 'Seules les joueuses peuvent postuler à une annonce.'
          : 'Seuls les joueurs peuvent postuler à une annonce.'
      );
      return;
    }
    if (!letterOk) {
      Alert.alert('Message trop court', 'Rédigez au moins 20 caractères pour vous présenter.');
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
      if (isV3ShellEnabled()) {
        trackV3Event('mercato_application_sent', { postId: post.id });
        const progression = userStateStore.get()?.progression ?? {
          xp: 0,
          level: 1,
          xpToNext: 200,
          xpProgress: 0,
          streakDays: 1,
          badges: [],
          rankLabel: 'Rookie',
        };
        userStateStore.applyAction(
          profile,
          'open_mercato',
          {
            upcomingEventsCount: 0,
            pendingConvocations: 0,
            recentMatchCount: 0,
            streakDays: 1,
            globalScore: completion?.percent ?? 50,
          },
          progression
        );
        void flushBrainState(profile.uid);
      }
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
    if (!post) return;
    setUpdatingId(app.id);
    try {
      await recruitmentService.updateApplicationStatus(app.id, status, rejectionReason);
      if (
        isV3ShellEnabled() &&
        profile &&
        canManagePostApplications(profile, post) &&
        app.status === 'PENDING' &&
        status !== 'PENDING'
      ) {
        trackV3Event('mercato_application_reviewed', {
          applicationId: app.id,
          status,
        });
        recordV3UserAction(profile, 'review_application');
      }
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    const body = (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    );
    if (useV3Header) {
      return (
        <V3TabShell
          caption="Mercato"
          title="Annonce"
          right={<V3ScreenBack onPress={onBack} />}
          intelligence={intelligence}
          flat
        >
          {body}
        </V3TabShell>
      );
    }
    return (
      <ProDayScreenCanvas flat>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      </ProDayScreenCanvas>
    );
  }

  if (!post) {
    const body = (
      <View style={styles.loader}>
        <ProDayText variant="body" muted>
          Annonce introuvable ou fermée.
        </ProDayText>
      </View>
    );
    if (useV3Header) {
      return (
        <V3TabShell
          caption="Mercato"
          title="Annonce"
          right={<V3ScreenBack onPress={onBack} />}
          intelligence={intelligence}
          flat
        >
          {body}
        </V3TabShell>
      );
    }
    return (
      <ProDayScreenCanvas flat>
        <ScreenHeader title="Annonce" onBack={onBack} />
        {body}
      </ProDayScreenCanvas>
    );
  }

  const postTitle = post.title || `Recherche ${post.position}`;
  const postSubtitle = `${post.city} · Publié ${formatTimeAgo(post.created_at)}`;

  const detailScroll = (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
        <AppDetailHeader
          caption={post.club_name}
          title={post.title || `Recherche ${post.position}`}
          subtitle={`${post.city} · Publié ${formatTimeAgo(post.created_at)}`}
          leading={
            <View style={[styles.clubAvatar, { backgroundColor: c.accentSoft }]}>
              <ProDayText variant="section" accent>
                {post.club_name.charAt(0)}
              </ProDayText>
            </View>
          }
          footer={
            <View style={styles.heroMeta}>
              <MetaChip label={post.position} />
              <MetaChip label={post.category} />
              <MetaChip label={post.level} />
            </View>
          }
        />

        {post.description ? (
          <ProDaySurface variant="elevated" style={styles.block}>
            <ProDayText variant="eyebrow" accent style={styles.blockLabel}>
              Description
            </ProDayText>
            <ProDayText variant="body" style={styles.description}>
              {post.description}
            </ProDayText>
          </ProDaySurface>
        ) : null}

        {isManager ? (
          <ProDaySurface variant="module" style={styles.block}>
            <ProDayText variant="eyebrow" accent style={styles.blockLabel}>
              Candidatures ({applications.length})
            </ProDayText>
            {applications.length === 0 ? (
              <ProDayText variant="body" muted>
                Aucune candidature pour le moment.
              </ProDayText>
            ) : (
              applications.map((app, index) => (
                <InteractiveListItem key={app.id} index={index}>
                  <ApplicationReviewCard
                    application={app}
                    pulseScore={applicationPulse[app.id]}
                    busy={updatingId === app.id}
                    onViewProfile={
                      onViewPlayer ? () => onViewPlayer(app.player_uid) : undefined
                    }
                    onMarkViewed={() => updateStatus(app, 'VIEWED')}
                    onAccept={() => updateStatus(app, 'ACCEPTED')}
                    onReject={(reason) => updateStatus(app, 'REJECTED', reason)}
                  />
                </InteractiveListItem>
              ))
            )}
          </ProDaySurface>
        ) : profile?.role === 'player' ? (
          <ProDaySurface variant="elevated" accentBar style={styles.applyBlock}>
            <ProDayText variant="eyebrow" accent>
              Postuler
            </ProDayText>
            <ProDayText variant="title" style={styles.applyTitle}>
              Votre lettre de motivation
            </ProDayText>

            {mercatoFit && useV3Header ? (
              <View style={[styles.fitBox, { backgroundColor: c.accentSoft, borderColor: c.accentMuted }]}>
                <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                  Compatibilité IA {mercatoFit.iaScore}% — {mercatoFit.fitLabel}
                </ProDayText>
              </View>
            ) : null}

            {applied ? (
              <View style={[styles.successBox, { backgroundColor: c.successBg, borderColor: c.success }]}>
                <Icon name="checkmark-circle" size={28} color={c.success} />
                <View style={styles.successCopy}>
                  <ProDayText variant="section" style={{ color: c.success }}>
                    Candidature envoyée
                  </ProDayText>
                  <ProDayText variant="body" muted>
                    Le club a reçu votre profil. Vous serez notifié en cas de réponse.
                  </ProDayText>
                </View>
              </View>
            ) : (
              <>
                {completion && completion.percent < 80 ? (
                  <View style={[styles.completionBox, { backgroundColor: c.accentSoft, borderColor: c.accentMuted }]}>
                    <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                      Profil à {completion.percent}% — complétez avant de postuler
                    </ProDayText>
                    <ProDayText variant="caption" muted>
                      {completion.missingLabels.slice(0, 3).join(' · ')}
                    </ProDayText>
                  </View>
                ) : null}
                <View style={styles.tips}>
                  {applyTips.map((tip) => (
                    <View key={tip} style={styles.tipRow}>
                      <Icon name="football" size={12} color={c.accent} variant="filled" />
                      <ProDayText variant="caption" muted style={styles.tipText}>
                        {tip}
                      </ProDayText>
                    </View>
                  ))}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: c.surfaceMuted,
                      borderColor: letterOk ? c.accentMuted : c.border,
                      color: c.text,
                    },
                  ]}
                  placeholder="Bonjour, je suis attaquant en R1, disponible dès la rentrée…"
                  placeholderTextColor={c.textMuted}
                  value={coverLetter}
                  onChangeText={setCoverLetter}
                  multiline
                  maxLength={MAX_LETTER}
                  textAlignVertical="top"
                />
                <ProDayText
                  variant="caption"
                  muted
                  style={[styles.counter, letterOk && { color: c.accent }]}
                >
                  {letterCount}/{MAX_LETTER} · min. 20 caractères
                </ProDayText>

                <TouchableOpacity
                  onPress={handleApply}
                  disabled={submitting || !letterOk}
                  activeOpacity={0.9}
                >
                  <ProDayGradient
                    kind="cta"
                    style={[styles.applyBtn, (!letterOk || submitting) && styles.applyBtnDisabled]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="football" size={18} color="#FFFFFF" variant="filled" />
                        <ProDayText variant="section" inverse style={styles.applyBtnText}>
                          Envoyer ma candidature
                        </ProDayText>
                      </>
                    )}
                  </ProDayGradient>
                </TouchableOpacity>
              </>
            )}
          </ProDaySurface>
        ) : !profile ? (
          <ProDaySurface variant="module" style={styles.guestBlock}>
            <Icon name="football" size={32} color={c.brand} variant="filled" />
            <ProDayText variant="section" style={styles.guestTitle}>
              Postuler à cette annonce
            </ProDayText>
            <ProDayText variant="body" muted style={styles.guestBody}>
              Créez un profil joueur pour envoyer votre candidature et suivre vos réponses.
            </ProDayText>
            <PressableSpring onPress={() => openAuth('login')} scaleTo={0.97} haptic>
              <ProDayGradient kind="cta" style={styles.guestCta}>
                <ProDayText variant="section" inverse style={styles.guestCtaText}>
                  Se connecter
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>
            <PressableSpring onPress={() => openAuth('signup')} scaleTo={0.98} haptic>
              <ProDayText variant="caption" accent style={styles.guestLink}>
                Créer un compte
              </ProDayText>
            </PressableSpring>
          </ProDaySurface>
        ) : null}
    </ScrollView>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption={post.club_name}
        title={postTitle}
        subtitle={postSubtitle}
        right={<V3ScreenBack onPress={onBack} />}
        intelligence={intelligence}
        flat
      >
        {detailScroll}
      </V3TabShell>
    );
  }

  return (
    <ProDayScreenCanvas flat>
      <ScreenHeader title="Annonce" onBack={onBack} />
      {detailScroll}
    </ProDayScreenCanvas>
  );
};

const MetaChip: React.FC<{ label: string }> = ({ label }) => {
  const { colors: chipColors } = useThemedScreen();
  return (
    <View style={[styles.metaChip, { backgroundColor: chipColors.surfaceMuted, borderColor: chipColors.border }]}>
      <ProDayText variant="caption" style={styles.metaChipText}>
        {label}
      </ProDayText>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  clubAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  metaChipText: { fontWeight: '700' },
  block: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  blockLabel: { marginBottom: spacing.sm },
  description: { lineHeight: 24 },
  completionBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  fitBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  applyBlock: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  applyTitle: { marginTop: 4, marginBottom: spacing.md },
  tips: { gap: spacing.xs, marginBottom: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipText: { flex: 1, lineHeight: 18 },
  input: {
    minHeight: 140,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
  },
  counter: { textAlign: 'right', marginTop: spacing.xs, marginBottom: spacing.md },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
  },
  applyBtnDisabled: { opacity: 0.55 },
  applyBtnText: { fontWeight: '800' },
  successBox: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  successCopy: { flex: 1, gap: 4 },
  guestBlock: {
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestTitle: { textAlign: 'center' },
  guestBody: { textAlign: 'center', lineHeight: 22 },
  guestCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  guestCtaText: { fontWeight: '800' },
  guestLink: { marginTop: spacing.xs, fontWeight: '700' },
});
