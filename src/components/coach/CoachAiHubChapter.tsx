import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  const [actionsOpen, setActionsOpen] = useState(false);

  const rosterUids = useMemo(() => members.map((m) => m.uid), [members]);

  useEffect(() => {
    if (!clubId) return;
    void wellnessCheckinsService.listLatestForClub(clubId).then(setWellnessByUid).catch(() => {});
    void coachEvaluationsService.listForClub(clubId).then(setEvaluations).catch(() => {});
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
    () => listRecentPostMatchAnalyses(events, members, 3),
    [events, members],
  );

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
                ? `Formation ${strategy.formation}`
                : strategy.level === 'none'
                  ? 'Données insuffisantes'
                  : 'Suggestions tactiques'
            }
            body={
              strategy.formationDetail ??
              strategy.emptyHint ??
              'Basé sur vos feuilles de match, votre compo et la forme déclarée.'
            }
          >
            {strategy.playersToStart.length > 0 ? (
              <View style={styles.listBlock}>
                <CoachText variant="caption" style={styles.listLabel}>
                  À privilégier
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

          <Pressable style={styles.primaryBtn} onPress={() => setActionsOpen(true)}>
            <Icon name="star-four-points" size={18} color="#fff" />
            <CoachText variant="section" inverse style={styles.primaryBtnText}>
              Que dois-je faire maintenant ?
            </CoachText>
          </Pressable>

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
                  <PostMatchCard key={a.eventId} analysis={a} />
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

function PostMatchCard({ analysis }: { analysis: PostMatchAnalysis }) {
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
      <CoachText variant="caption" muted style={styles.videoNote}>
        {analysis.videoNote}
      </CoachText>
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
