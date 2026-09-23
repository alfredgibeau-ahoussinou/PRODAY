import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import type { TeamEvent, PlayerMatchSheetStat } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { getPresentInviteeUids } from '../../../models/TeamEvent';
import { getMyMatchStat } from '../../../utils/matchLive';
import { MotmVotePanel } from './MotmVotePanel';
import { CoachMatchDebriefPanel } from './CoachMatchDebriefPanel';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';
import { canManageTeamEvent } from '../../../utils/teamEventAccess';
import { formatCoachRating, formatEvaluationSourceLabel, formatEvaluationStatusLabel } from '../../../utils/coachEvaluationRatings';
import { PlayerStatsRatingModal, type PlayerStatsRatingModalMode } from '../../coach/PlayerStatsRatingModal';
import { teamEventsService } from '../../../services/teamEvents.service';
import { generateVeoAiMatchEvaluations, buildDraftStatFromProposal } from '../../../services/veoAiMatchEvaluation.service';
import { clubCamerasService } from '../../../services/clubCameras.service';
import { proSemantic, PRO_DATA_VIOLET } from '../../../theme/professionalDesign';

interface MatchHubStatsTabProps {
  event: TeamEvent;
  profile: User;
  onUpdated?: () => void;
}

export const MatchHubStatsTab: React.FC<MatchHubStatsTabProps> = ({
  event,
  profile,
  onUpdated,
}) => {
  const { colors } = useAppTheme();
  const myStat = getMyMatchStat(event, profile.uid);
  const season = profile.profile.season_stats;

  const canManage = useMemo(
    () => canManageTeamEvent(event, profile, { isAdmin: profile.is_admin || profile.role === 'club' }),
    [event, profile],
  );

  const [ratingModal, setRatingModal] = useState<{
    uid: string;
    name: string;
    stat?: PlayerMatchSheetStat;
    mode: PlayerStatsRatingModalMode;
  } | null>(null);

  const [evaluatingAi, setEvaluatingAi] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // All player entries (from player_match_stats, lineup, or invitees)
  const rows = useMemo(() => {
    const rawStats = event.player_match_stats ?? {};
    const knownUids = new Set([
      ...Object.keys(rawStats),
      ...(event.lineup?.slots.map((s) => s.uid) ?? []),
      ...event.invitee_uids,
    ]);

    const list: PlayerMatchSheetStat[] = Array.from(knownUids).map((uid) => {
      const existing = rawStats[uid];
      if (existing) return existing;
      const slot = event.lineup?.slots.find((s) => s.uid === uid);
      return {
        uid,
        player_name: slot?.display_name ?? uid,
        minutes_played: undefined,
        goals: 0,
        assists: 0,
      };
    });

    // If viewer is NOT staff, hide draft evaluations entirely
    const visibleList = canManage ? list : list.filter((s) => s.status !== 'draft');

    return visibleList.sort(
      (a, b) =>
        (b.goals ?? 0) - (a.goals ?? 0) ||
        (b.assists ?? 0) - (a.assists ?? 0) ||
        (b.rating ?? 0) - (a.rating ?? 0)
    );
  }, [event.player_match_stats, event.lineup, event.invitee_uids, canManage]);

  const draftCount = useMemo(() => {
    return Object.values(event.player_match_stats ?? {}).filter((s) => s.status === 'draft').length;
  }, [event.player_match_stats]);

  const handleSavePlayerStat = async (patch: Partial<PlayerMatchSheetStat>) => {
    if (!ratingModal || !profile) return;
    try {
      await teamEventsService.updatePlayerMatchStat(
        event.id,
        ratingModal.uid,
        patch,
        {
          user: profile,
          isAdmin: profile.is_admin || profile.role === 'club',
        },
      );
      onUpdated?.();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  };

  const handlePublishAll = async () => {
    if (!profile) return;
    setPublishing(true);
    try {
      await teamEventsService.publishMatchStatsAndRatings(event.id, {
        user: profile,
        isAdmin: profile.is_admin || profile.role === 'club',
      });
      onUpdated?.();
      Alert.alert('Publication réussie', 'Les statistiques et notes sont désormais visibles par les joueurs et le club.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setPublishing(false);
    }
  };

  const handleRunAiEvaluation = async () => {
    if (!event.club_id || !profile) return;
    setEvaluatingAi(true);
    try {
      const videos = await clubCamerasService.listMatchVideos(event.club_id);
      const matchVideo = videos.find((v) => v.event_id === event.id) ?? null;

      const mockMembers: User[] = rows.map((r) => ({
        uid: r.uid,
        display_name: r.player_name || r.uid,
        email: '',
        role: 'player',
        profile: {},
      } as User));

      const result = generateVeoAiMatchEvaluations(event, matchVideo, mockMembers);

      if (!result.has_video) {
        Alert.alert(
          'Aucune captation Veo',
          result.uncertainty_notice || 'Veuillez associer un enregistrement vidéo Veo à ce match pour générer l’évaluation automatique.',
        );
        return;
      }

      const draftMap: Record<string, PlayerMatchSheetStat> = {};
      Object.keys(result.proposals).forEach((uid) => {
        const prop = result.proposals[uid];
        const existing = event.player_match_stats?.[uid];
        draftMap[uid] = buildDraftStatFromProposal(
          prop,
          profile.uid,
          profile.display_name || 'Staff',
          existing,
        );
      });

      await teamEventsService.batchUpdatePlayerMatchStats(event.id, draftMap, {
        user: profile,
        isAdmin: profile.is_admin || profile.role === 'club',
      });
      onUpdated?.();

      const protectedMsg = result.manual_protected_count > 0
        ? ` (${result.manual_protected_count} saisie(s) manuelle(s) protégée(s))`
        : '';
      Alert.alert(
        'Propositions IA générées',
        `Les propositions de notes et statistiques ont été préparées en brouillon pour ${Object.keys(result.proposals).length} joueur(s)${protectedMsg}. Vérifiez-les avant de publier.`,
      );
    } catch (e) {
      Alert.alert('Erreur IA', e instanceof Error ? e.message : 'Évaluation IA impossible.');
    } finally {
      setEvaluatingAi(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {myStat || season ? (
        <ProDaySurface variant="accent" style={[styles.myCard, { borderColor: colors.border }]}>
          <ProDayText variant="eyebrow" accent>
            Ma fiche
          </ProDayText>
          {myStat ? (
            <View style={styles.statGrid}>
              <StatPill label="Note" value={formatCoachRating(myStat.rating)} />
              <StatPill label="Min" value={myStat.minutes_played != null ? `${myStat.minutes_played}'` : '—'} />
              <StatPill label="Buts" value={String(myStat.goals ?? 0)} />
              <StatPill label="Passes" value={String(myStat.assists ?? 0)} />
              <StatPill label="J" value={String(myStat.yellow_cards ?? 0)} />
              <StatPill label="R" value={String(myStat.red_cards ?? 0)} />
            </View>
          ) : (
            <ProDayText variant="caption" muted>
              Pas encore de feuille de match individuelle pour ce match.
            </ProDayText>
          )}
          {season ? (
            <ProDayText variant="caption" muted style={styles.seasonLine}>
              Saison : {season.matches} matchs · {season.goals} buts · {season.assists} passes
            </ProDayText>
          ) : null}
        </ProDaySurface>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <ProDayText variant="section">Feuille de match & Notes</ProDayText>
          <ProDayText variant="caption" muted>
            {canManage
              ? 'Saisie manuelle, évaluation IA Veo et publication officielle'
              : 'Statistiques et évaluations validées par le staff'}
          </ProDayText>
        </View>

        {canManage ? (
          <View style={styles.toolbarRow}>
            <Pressable
              onPress={handleRunAiEvaluation}
              disabled={evaluatingAi}
              style={[styles.aiBtn, { borderColor: PRO_DATA_VIOLET }]}
            >
              {evaluatingAi ? (
                <ActivityIndicator size="small" color={PRO_DATA_VIOLET} />
              ) : (
                <>
                  <Icon name="star-four-points" size={13} color={PRO_DATA_VIOLET} />
                  <ProDayText variant="caption" style={{ color: PRO_DATA_VIOLET, fontWeight: '700' }}>
                    Évaluation IA
                  </ProDayText>
                </>
              )}
            </Pressable>

            {draftCount > 0 ? (
              <Pressable
                onPress={handlePublishAll}
                disabled={publishing}
                style={[styles.publishBtn, { backgroundColor: colors.accent }]}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <ProDayText variant="caption" style={{ color: colors.surface, fontWeight: '700' }}>
                    Publier ({draftCount})
                  </ProDayText>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
          <Icon name="trophy" size={32} color={colors.textMuted} />
          <ProDayText variant="body" muted style={styles.emptySub}>
            Les notes et statistiques seront renseignées par le staff après ou pendant le match.
          </ProDayText>
        </ProDaySurface>
      ) : (
        <ProDaySurface variant="module" style={[styles.table, { borderColor: colors.border }]}>
          <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
            <ProDayText variant="caption" muted style={styles.colName}>
              Joueur
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              Note
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              Min
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              B
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              P
            </ProDayText>
            {canManage ? (
              <ProDayText variant="caption" muted style={styles.colAction}>
                Action
              </ProDayText>
            ) : null}
          </View>
          {rows.map((r) => {
            const isDraft = r.status === 'draft';
            const src = r.source ?? 'manual';
            const srcColor =
              src === 'ai_generated' ? PRO_DATA_VIOLET : src === 'coach_reviewed' ? proSemantic.success : colors.accent;

            return (
              <Pressable
                key={r.uid}
                onPress={() => {
                  if (canManage) {
                    setRatingModal({
                      uid: r.uid,
                      name: r.player_name || r.uid,
                      stat: r,
                      mode: 'rating',
                    });
                  }
                }}
                disabled={!canManage}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  r.uid === profile.uid && { backgroundColor: colors.accentSoft },
                ]}
              >
                <View style={styles.colNameWrap}>
                  <ProDayText variant="caption" style={styles.colNameText} numberOfLines={1}>
                    {r.player_name}
                  </ProDayText>
                  <View style={styles.tagRow}>
                    {r.source ? (
                      <View style={[styles.microBadge, { borderColor: srcColor }]}>
                        <ProDayText variant="caption" style={[styles.microBadgeText, { color: srcColor }]}>
                          {formatEvaluationSourceLabel(r.source)}
                        </ProDayText>
                      </View>
                    ) : null}
                    {isDraft ? (
                      <View style={[styles.microBadge, { borderColor: proSemantic.warning }]}>
                        <ProDayText variant="caption" style={[styles.microBadgeText, { color: proSemantic.warning }]}>
                          Brouillon
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>
                  {r.rating_explanation ? (
                    <ProDayText variant="caption" muted numberOfLines={1} style={{ fontStyle: 'italic', fontSize: 10 }}>
                      « {r.rating_explanation} »
                    </ProDayText>
                  ) : null}
                </View>

                <ProDayText variant="caption" accent style={styles.colNum}>
                  {formatCoachRating(r.rating)}
                </ProDayText>
                <ProDayText variant="caption" style={styles.colNum}>
                  {r.minutes_played != null ? `${r.minutes_played}'` : '—'}
                </ProDayText>
                <ProDayText variant="caption" style={styles.colNum}>
                  {r.goals ?? 0}
                </ProDayText>
                <ProDayText variant="caption" style={styles.colNum}>
                  {r.assists ?? 0}
                </ProDayText>

                {canManage ? (
                  <View style={styles.colActionWrap}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setRatingModal({
                          uid: r.uid,
                          name: r.player_name || r.uid,
                          stat: r,
                          mode: 'stats',
                        });
                      }}
                      style={styles.actionBtn}
                      hitSlop={6}

                      accessibilityRole="button"
                      accessibilityLabel="Options">
                      <Icon name="tune" size={13} color={colors.accent} />
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ProDaySurface>
      )}

      {ratingModal ? (
        <PlayerStatsRatingModal
          visible={ratingModal !== null}
          onClose={() => setRatingModal(null)}
          playerUid={ratingModal.uid}
          playerName={ratingModal.name}
          matchTitle={event.title}
          matchDateLabel={event.starts_at ? new Date(event.starts_at).toLocaleDateString('fr-FR') : undefined}
          initialStat={ratingModal.stat}
          initialMode={ratingModal.mode}
          onSave={handleSavePlayerStat}
        />
      ) : null}

      <CoachMatchDebriefPanel event={event} profile={profile} onUpdated={onUpdated} />

      <MotmVotePanel
        teamEventId={event.id}
        voterUid={profile.uid}
        nominees={[
          ...getPresentInviteeUids(event).map((uid) => ({
            uid,
            name:
              event.lineup?.slots.find((s) => s.uid === uid)?.display_name ??
              event.player_match_stats?.[uid]?.player_name ??
              uid,
          })),
          ...(event.lineup?.slots ?? []).map((s) => ({
            uid: s.uid,
            name: s.display_name,
          })),
        ].filter(
          (n, i, arr) => arr.findIndex((x) => x.uid === n.uid) === i
        )}
      />
    </View>
  );
};

const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.pill}>
    <ProDayText variant="section">{value}</ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  myCard: { borderWidth: 1, gap: spacing.sm },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: { alignItems: 'center', minWidth: 52 },
  seasonLine: { marginTop: spacing.xs },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  publishBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
  },
  emptySub: { textAlign: 'center' },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colName: { flex: 2, fontWeight: '700' },
  colNameWrap: { flex: 2, gap: 2 },
  colNameText: { fontWeight: '700' },
  colNum: { flex: 0.8, textAlign: 'center', fontWeight: '700' },
  colAction: { width: 32, textAlign: 'center' },
  colActionWrap: { width: 32, alignItems: 'center', justifyContent: 'center' },
  actionBtn: {
    padding: 4,
    borderRadius: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  microBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  microBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
