import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
  CoachText,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { CoachSeasonStatsPanel } from './CoachSeasonStatsPanel';
import { COACH_SITE, getCoachPageIdentity } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import {
  buildCoachAiInsights,
  type CoachAiAction,
  type CoachAiActionId,
} from '../../utils/coachAiInsights';
import {
  listRecentPostMatchAnalyses,
  type PostMatchAnalysis,
} from '../../utils/coachPostMatchAnalysis';
import {
  loadCoachPitchLineup,
  normalizeCoachPitchLineup,
  type CoachPitchLineup,
} from '../../utils/coachPitchLineup';
import {
  buildRecommendedSession,
  defaultRecommendedSessionStart,
  formatRecommendedSessionNotes,
  type RecommendedTrainingSession,
} from '../../utils/coachTrainingRecommendation';
import { teamEventsService } from '../../services/teamEvents.service';
import { clubCamerasService } from '../../services/clubCameras.service';
import type { ClubMatchVideo } from '../../models/ClubCameras';
import {
  countReadyClubVideos,
  listRecentClubVideos,
} from '../../utils/coachVideoInsights';
import {
  resolveClubCoversCoachFromMembers,
  userCanManageConvocations,
} from '../../utils/clubFeatureAccess';

type Props = CoachChapterCommonProps & {
  /** Afficher le panneau stats saison sous l’hub. */
  showSeasonStats?: boolean;
};

function actionNavTarget(id: CoachAiActionId | string): CoachNavItemId | null {
  switch (id) {
    case 'join-club':
    case 'invite-roster':
      return 'gestion';
    case 'add-match-sheets':
    case 'remind-rsvp':
    case 'plan-session':
      return 'today';
    case 'complete-lineup':
      return 'equipe';
    case 'add-player-notes':
      return 'joueurs';
    case 'add-wellness':
    case 'open-forme':
      return 'forme';
    case 'open-tactics':
    case 'squad-select':
    case 'training-focus':
      return 'smart_tactics';
    case 'carpool-gap':
      return 'carpool';
    default:
      return null;
  }
}

/** Hub IA coach — synthèse honnête, stratégie et actions prioritaires. */
export const CoachAiHubChapter: React.FC<Props> = ({
  profile,
  members,
  events,
  showSeasonStats = true,
}) => {
  const shellNav = useCoachShellNav();
  const clubId = profile.profile.club_id;
  const [wellnessByUid, setWellnessByUid] = useState<Record<string, WellnessSignals>>({});
  const [evaluations, setEvaluations] = useState<CoachPlayerEvaluation[]>([]);
  const [lineup, setLineup] = useState<CoachPitchLineup | null>(null);
  const [clubVideos, setClubVideos] = useState<ClubMatchVideo[]>([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const rosterUids = useMemo(() => members.map((m) => m.uid), [members]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });

  useEffect(() => {
    if (!clubId) return;
    void wellnessCheckinsService.listLatestForClub(clubId).then(setWellnessByUid).catch(() => {});
    void coachEvaluationsService.listForClub(clubId).then(setEvaluations).catch(() => {});
    void clubCamerasService.listMatchVideos(clubId).then(setClubVideos).catch(() => setClubVideos([]));
  }, [clubId, members.length]);

  useEffect(() => {
    if (!clubId) {
      setLineup(null);
      return;
    }
    void loadCoachPitchLineup(clubId)
      .then((raw) => setLineup(raw ? normalizeCoachPitchLineup(raw, rosterUids) : null))
      .catch(() => setLineup(null));
  }, [clubId, rosterUids.join('|')]);

  const insights = useMemo(
    () =>
      buildCoachAiInsights({
        events,
        members,
        wellnessByUid,
        evaluations,
        lineup,
        hasClub: Boolean(clubId),
      }),
    [events, members, wellnessByUid, evaluations, lineup, clubId],
  );

  const openNav = useCallback(
    (id: CoachNavItemId) => {
      shellNav?.requestNav(id);
    },
    [shellNav],
  );

  const runAction = useCallback(
    (action: CoachAiAction) => {
      setActionsOpen(false);
      const target = actionNavTarget(action.id);
      if (target) openNav(target);
    },
    [openNav],
  );

  const { overview, strategy, actions } = insights;

  const postMatchAnalyses = useMemo(
    () => listRecentPostMatchAnalyses(events, members, 3, clubVideos),
    [events, members, clubVideos],
  );

  const recentVideos = useMemo(() => listRecentClubVideos(clubVideos, 4), [clubVideos]);
  const videoCount = useMemo(() => countReadyClubVideos(clubVideos), [clubVideos]);

  const recommendedSession = useMemo(
    () =>
      buildRecommendedSession({
        events,
        members,
        wellnessByUid,
        evaluations,
        lineup,
        hasClub: Boolean(clubId),
        postMatchAnalysis: postMatchAnalyses[0] ?? null,
      }),
    [events, members, wellnessByUid, evaluations, lineup, clubId, postMatchAnalyses],
  );

  const createRecommendedSession = useCallback(async () => {
    if (!canManage) {
      Alert.alert(
        'Entraînements',
        'La création de séances est réservée au coach Premium (ou couvert par un Tout inclus).',
      );
      return;
    }
    if (!clubId) {
      Alert.alert('Club requis', 'Rattachez un club pour créer une séance.');
      return;
    }
    setCreatingSession(true);
    try {
      const startsAt = defaultRecommendedSessionStart();
      const inviteeUids = members.filter((m) => m.uid !== profile.uid).map((m) => m.uid);
      const eventId = await teamEventsService.create({
        title: recommendedSession.title,
        description: recommendedSession.reason,
        event_type: 'training',
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        club_id: clubId,
        starts_at: startsAt,
        city: profile.city?.trim() || 'Paris',
        invitee_uids: inviteeUids,
        reminder_hours_before: 24,
      });
      await teamEventsService.updateSessionPlan(
        eventId,
        {
          focus: recommendedSession.focus,
          notes: formatRecommendedSessionNotes(recommendedSession),
          duration_min: recommendedSession.totalMinutes,
        },
        { user: profile },
      );
      Alert.alert(
        'Séance créée',
        `« ${recommendedSession.title} » planifiée. Retrouvez-la dans Entraînements.`,
      );
      openNav('entrainements');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setCreatingSession(false);
    }
  }, [canManage, clubId, members, profile, recommendedSession, openNav]);

  return (
    <CoachPane title={getCoachPageIdentity('coach_ia').title}>
      <CoachChapterScroll>
        <View style={styles.stack}>
          <CoachSectionCard
            kicker="Vue d’ensemble"
            title={overview.headline}
            body={overview.synthesis}
          >
            <View style={styles.metricsRow}>
              {overview.metrics.map((m, index, arr) => (
                <View
                  key={m.label}
                  style={[styles.metricCell, index < arr.length - 1 && styles.metricBorder]}
                >
                  <CoachText variant="section" style={styles.metricValue}>
                    {m.value}
                  </CoachText>
                  <CoachText variant="caption" muted numberOfLines={1}>
                    {m.label}
                  </CoachText>
                </View>
              ))}
            </View>
            {overview.emptyCta ? (
              <Pressable
                style={styles.ctaLink}
                onPress={() => {
                  const target = actionNavTarget(overview.emptyCta!.action);
                  if (target) openNav(target);
                }}
              >
                <CoachText variant="caption" accent>
                  {overview.emptyCta.label} →
                </CoachText>
              </Pressable>
            ) : null}
          </CoachSectionCard>

          <CoachSectionCard
            kicker="Stratégie recommandée"
            title={
              strategy.formation
                ? `Partir en ${strategy.formation}`
                : strategy.level === 'none'
                  ? 'Pas assez de données'
                  : 'Pistes tactiques'
            }
            body={
              strategy.formationDetail ??
              strategy.emptyHint ??
              'Basé sur tes feuilles de match, ta compo et la forme déclarée.'
            }
          >
            {strategy.playersToStart.length > 0 ? (
              <View style={styles.listBlock}>
                <CoachText variant="caption" style={styles.listLabel}>
                  À faire jouer
                </CoachText>
                {strategy.playersToStart.map((p) => (
                  <View key={p.uid} style={styles.playerLine}>
                    <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                      {p.name}
                    </CoachText>
                    <CoachText variant="caption" muted numberOfLines={2}>
                      {p.reason}
                    </CoachText>
                  </View>
                ))}
              </View>
            ) : null}

            {strategy.playersToWatch.length > 0 ? (
              <View style={styles.listBlock}>
                <CoachText variant="caption" style={styles.listLabel}>
                  À surveiller
                </CoachText>
                {strategy.playersToWatch.map((p) => (
                  <View key={p.uid} style={styles.playerLine}>
                    <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                      {p.name}
                    </CoachText>
                    <CoachText variant="caption" muted numberOfLines={2}>
                      {p.reason}
                    </CoachText>
                  </View>
                ))}
              </View>
            ) : null}

            {strategy.trainingFocus ? (
              <View style={styles.focusBox}>
                <CoachText variant="caption" muted>
                  Focus séance
                </CoachText>
                <CoachText variant="caption">{strategy.trainingFocus}</CoachText>
              </View>
            ) : null}

            <Pressable style={styles.secondaryBtn} onPress={() => openNav('smart_tactics')}>
              <Icon name="star-four-points" size={14} color={COACH_SITE.accent} />
              <CoachText variant="caption" accent>
                Ouvrir Tactique IA
              </CoachText>
            </Pressable>
          </CoachSectionCard>

          {!sessionDismissed ? (
            <RecommendedSessionCard
              session={recommendedSession}
              creating={creatingSession}
              onCreate={() => void createRecommendedSession()}
              onDismiss={() => setSessionDismissed(true)}
            />
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={() => setActionsOpen(true)}>
            <Icon name="star-four-points" size={18} color="#fff" />
            <CoachText variant="section" inverse style={styles.primaryBtnText}>
              Que dois-je faire maintenant ?
            </CoachText>
          </Pressable>

          <CoachSectionCard
            kicker="Analyse vidéo"
            title={
              videoCount > 0
                ? `${videoCount} captation${videoCount > 1 ? 's' : ''} disponible${videoCount > 1 ? 's' : ''}`
                : 'Aucune vidéo club'
            }
            body={
              videoCount > 0
                ? 'Matchs filmés liés à votre club — ouvrez Mes vidéos pour le détail.'
                : 'Aucune captation ProDay enregistrée pour votre club. Importez ou connectez une caméra depuis Mes vidéos.'
            }
          >
            {recentVideos.length > 0 ? (
              <View style={styles.videoList}>
                {recentVideos.map((v) => (
                  <Pressable
                    key={v.id}
                    style={styles.videoRow}
                    onPress={() => openNav('mes_videos')}
                  >
                    <Icon name="videocam" size={14} color={COACH_SITE.accent} />
                    <View style={styles.videoRowBody}>
                      <CoachText variant="caption" style={styles.videoTitle} numberOfLines={1}>
                        {v.title}
                      </CoachText>
                      <CoachText variant="caption" muted>
                        {v.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {v.aiReady ? ' · IA prête' : ''}
                      </CoachText>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable style={styles.secondaryBtn} onPress={() => openNav('mes_videos')}>
              <Icon name="videocam" size={14} color={COACH_SITE.accent} />
              <CoachText variant="caption" accent>
                Ouvrir Mes vidéos
              </CoachText>
            </Pressable>
          </CoachSectionCard>

          <CoachSectionCard
            kicker="Après-match"
            title={
              postMatchAnalyses.length > 0
                ? `${postMatchAnalyses.length} analyse${postMatchAnalyses.length > 1 ? 's' : ''} récente${postMatchAnalyses.length > 1 ? 's' : ''}`
                : 'Aucune feuille finalisée'
            }
            body={
              postMatchAnalyses.length > 0
                ? 'Synthèse honnête depuis feuilles de match et scores live.'
                : 'Validez une feuille de match pour générer une analyse post-match.'
            }
          >
            {postMatchAnalyses.length > 0 ? (
              <View style={styles.postMatchList}>
                {postMatchAnalyses.map((a) => (
                  <PostMatchCard
                    key={a.eventId}
                    analysis={a}
                    onOpenVideos={() => openNav('mes_videos')}
                  />
                ))}
              </View>
            ) : null}
          </CoachSectionCard>

          {actions.length > 0 ? (
            <View style={styles.previewActions}>
              {actions.slice(0, 3).map((a) => (
                <Pressable key={a.id} style={styles.previewRow} onPress={() => runAction(a)}>
                  <CoachText variant="caption" style={styles.previewTitle}>
                    {a.title}
                  </CoachText>
                  <CoachText variant="caption" muted numberOfLines={2}>
                    {a.detail}
                  </CoachText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {showSeasonStats ? (
            <View style={styles.statsBlock}>
              <CoachText variant="caption" style={styles.statsTitle}>
                Statistiques saison
              </CoachText>
              <CoachSeasonStatsPanel events={events} profile={profile} />
            </View>
          ) : null}
        </View>
      </CoachChapterScroll>

      <Modal visible={actionsOpen} animationType="slide" transparent onRequestClose={() => setActionsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionsOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <CoachText variant="section" style={styles.modalTitle}>
              Actions prioritaires
            </CoachText>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {actions.length === 0 ? (
                <CoachEmptyState
                  title="Rien d’urgent"
                  body="Continuez à alimenter le calendrier et les feuilles de match."
                  cta="Fermer"
                  onPress={() => setActionsOpen(false)}
                />
              ) : (
                actions.map((a) => (
                  <Pressable key={a.id} style={styles.actionRow} onPress={() => runAction(a)}>
                    <CoachText variant="section" style={styles.actionTitle}>
                      {a.title}
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {a.detail}
                    </CoachText>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setActionsOpen(false)}>
              <CoachText variant="caption" accent>
                Fermer
              </CoachText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </CoachPane>
  );
};

function RecommendedSessionCard({
  session,
  creating,
  onCreate,
  onDismiss,
}: {
  session: RecommendedTrainingSession;
  creating: boolean;
  onCreate: () => void;
  onDismiss: () => void;
}) {
  const confidenceLabel =
    session.dataConfidence === 'high'
      ? 'Données fiables'
      : session.dataConfidence === 'low'
        ? 'Données partielles'
        : 'Modèle générique';

  return (
    <CoachSectionCard
      kicker="Séance recommandée"
      title={session.title}
      body={session.reason}
    >
      <View style={styles.sessionMeta}>
        <CoachText variant="caption" muted>
          Focus · {session.focus}
        </CoachText>
        <CoachText variant="caption" muted>
          {confidenceLabel}
          {session.playerCount != null ? ` · ${session.playerCount} joueurs` : ''}
          {` · ${session.difficulty}`}
        </CoachText>
      </View>
      <View style={styles.sessionBlocks}>
        {session.blocks.map((block) => (
          <View key={block.label} style={styles.sessionBlockRow}>
            <CoachText variant="section" style={styles.sessionBlockMin}>
              {block.minutes}'
            </CoachText>
            <View style={styles.sessionBlockBody}>
              <CoachText variant="caption" style={styles.sessionBlockLabel}>
                {block.label}
              </CoachText>
              {block.objective ? (
                <CoachText variant="caption" muted numberOfLines={2}>
                  {block.objective}
                </CoachText>
              ) : null}
              {block.material && block.material !== '—' ? (
                <CoachText variant="caption" muted style={styles.sessionMaterial}>
                  Matériel : {block.material}
                </CoachText>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <Pressable
        style={[styles.primaryBtn, styles.sessionCreateBtn, creating && styles.sessionCreateDisabled]}
        onPress={onCreate}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Icon name="calendar" size={18} color="#fff" />
        )}
        <CoachText variant="section" inverse style={styles.primaryBtnText}>
          {creating ? 'Création…' : 'Créer la séance'}
        </CoachText>
      </Pressable>
      <Pressable style={styles.sessionDismissBtn} onPress={onDismiss}>
        <CoachText variant="caption" muted>
          Plus tard
        </CoachText>
      </Pressable>
    </CoachSectionCard>
  );
}

function PostMatchCard({
  analysis,
  onOpenVideos,
}: {
  analysis: PostMatchAnalysis;
  onOpenVideos?: () => void;
}) {
  const dateStr = analysis.date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  return (
    <View style={styles.postMatchCard}>
      <View style={styles.postMatchHead}>
        <CoachText variant="section" numberOfLines={1} style={styles.postMatchTitle}>
          {analysis.title}
        </CoachText>
        <CoachText variant="caption" muted>
          {dateStr}
          {analysis.scoreLabel ? ` · ${analysis.scoreLabel}` : ''}
        </CoachText>
      </View>
      {analysis.positives.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabel}>
            Points positifs
          </CoachText>
          {analysis.positives.map((p) => (
            <CoachText key={p} variant="caption" muted>
              + {p}
            </CoachText>
          ))}
        </View>
      ) : null}
      {analysis.improvements.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabelWarn}>
            À améliorer
          </CoachText>
          {analysis.improvements.map((p) => (
            <CoachText key={p} variant="caption" muted>
              → {p}
            </CoachText>
          ))}
        </View>
      ) : null}
      {analysis.mvp ? (
        <CoachText variant="caption" style={styles.mvpLine}>
          ⭐ {analysis.mvp.name} — {analysis.mvp.reason}
        </CoachText>
      ) : null}
      <CoachText variant="caption" muted style={styles.recLine}>
        Prochain match : {analysis.nextMatchRecommendation}
      </CoachText>
      {analysis.hasVideos && analysis.videos.length > 0 ? (
        <View style={styles.postMatchBlock}>
          <CoachText variant="caption" style={styles.postMatchLabel}>
            Analyse vidéo disponible
          </CoachText>
          {analysis.videos.map((v) => (
            <Pressable key={v.id} onPress={onOpenVideos} style={styles.videoLinkRow}>
              <CoachText variant="caption" accent numberOfLines={1}>
                {v.title}
              </CoachText>
              <CoachText variant="caption" muted>
                {v.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </CoachText>
            </Pressable>
          ))}
        </View>
      ) : (
        <CoachText variant="caption" muted style={styles.videoNote}>
          {analysis.videoNote}
        </CoachText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingBottom: spacing.xl },
  metricsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    borderRadius: 12,
    backgroundColor: COACH_SITE.elevated,
    overflow: 'hidden',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  metricBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COACH_SITE.border,
  },
  metricValue: { fontWeight: '800', fontSize: 18 },
  ctaLink: { marginTop: spacing.sm },
  listBlock: { marginTop: spacing.sm, gap: spacing.xs },
  listLabel: {
    color: COACH_SITE.accent,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  playerLine: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  playerName: { fontWeight: '700', marginBottom: 2 },
  focusBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: COACH_SITE.elevated,
    gap: 4,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: COACH_SITE.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: { fontWeight: '800', color: '#fff' },
  sessionMeta: { marginTop: spacing.sm, gap: 4 },
  sessionBlocks: { marginTop: spacing.sm, gap: spacing.xs },
  sessionBlockRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  sessionBlockMin: { fontWeight: '800', width: 36, color: COACH_SITE.accent },
  sessionBlockBody: { flex: 1, gap: 2 },
  sessionBlockLabel: { fontWeight: '700' },
  sessionMaterial: { fontSize: 10, fontStyle: 'italic' },
  sessionCreateBtn: { marginTop: spacing.md },
  sessionCreateDisabled: { opacity: 0.7 },
  sessionDismissBtn: { alignItems: 'center', paddingTop: spacing.sm },
  previewActions: { gap: spacing.xs },
  previewRow: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: COACH_SITE.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  previewTitle: { fontWeight: '700', marginBottom: 4 },
  postMatchList: { marginTop: spacing.sm, gap: spacing.sm },
  postMatchCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: COACH_SITE.elevated,
    gap: spacing.xs,
  },
  postMatchHead: { gap: 2, marginBottom: spacing.xs },
  postMatchTitle: { fontWeight: '700' },
  postMatchBlock: { gap: 2 },
  postMatchLabel: {
    color: COACH_SITE.accent,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  postMatchLabelWarn: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mvpLine: { fontWeight: '700', marginTop: spacing.xs },
  recLine: { marginTop: spacing.xs, lineHeight: 17 },
  videoNote: { fontSize: 10, fontStyle: 'italic', marginTop: 4 },
  videoList: { marginTop: spacing.sm, gap: spacing.xs },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  videoRowBody: { flex: 1, gap: 2 },
  videoTitle: { fontWeight: '700' },
  videoLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  statsBlock: { gap: spacing.sm, marginTop: spacing.sm },
  statsTitle: {
    color: COACH_SITE.muted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COACH_SITE.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '72%',
  },
  modalTitle: { fontWeight: '800', marginBottom: spacing.md },
  modalScroll: { maxHeight: 360 },
  actionRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  actionTitle: { fontWeight: '700', marginBottom: 4 },
  modalClose: { alignItems: 'center', paddingTop: spacing.md },
});
