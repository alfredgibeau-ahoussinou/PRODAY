import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachActionRow,
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
} from './coachPortalUi';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import { coachObjectivesService } from '../../services/coachObjectives.service';
import { privacyGrantsService } from '../../services/privacyGrants.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { CoachSeasonObjective } from '../../models/CoachSeasonObjective';
import type { PrivacyAccessGrant } from '../../models/Privacy';
import type { WellnessSignals } from '../../models/SmartTactics';
import { canAccessSensitiveResource, mapUserRoleToPrivacyActor } from '../../utils/privacyAccess';
import type { PlayerLoadSignals } from '../../utils/playerLoadAlerts';
import { CoachAnalyseFormePanel } from './CoachAnalyseFormePanel';
import {
  formatCoachRating,
  normalizeCoachRatings,
} from '../../utils/coachEvaluationRatings';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useCoachThemedStyles } from '../../features/coach/shell/coachThemeStyles';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { CoachPane } from './CoachScreenHeader';

export const CoachPerformanceChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  members,
  events,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [evals, setEvals] = useState<CoachPlayerEvaluation[]>([]);
  const [objectives, setObjectives] = useState<CoachSeasonObjective[]>([]);
  const [grants, setGrants] = useState<PrivacyAccessGrant[]>([]);
  const [wellnessByUid, setWellnessByUid] = useState<Record<string, WellnessSignals>>({});
  const [playerUid, setPlayerUid] = useState(members[0]?.uid ?? '');
  const [overall, setOverall] = useState('');
  const [evalNotes, setEvalNotes] = useState('');
  const [visiblePlayer, setVisiblePlayer] = useState(true);
  const [objTitle, setObjTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) return;
    const [e, o, g, w] = await Promise.all([
      coachEvaluationsService.listForClub(clubId),
      coachObjectivesService.listForClub(clubId),
      privacyGrantsService.listForGrantee(profile.uid).catch(() => [] as PrivacyAccessGrant[]),
      wellnessCheckinsService.listLatestForClub(clubId).catch(() => ({})),
    ]);
    setEvals(e);
    setObjectives(o);
    setGrants(g);
    setWellnessByUid(w);
  }, [clubId, profile.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!playerUid && members[0]) setPlayerUid(members[0].uid);
  }, [members, playerUid]);

  const selectedPlayer = members.find((m) => m.uid === playerUid);

  const playerTimeline = useMemo(() => {
    const fromEvals = evals
      .filter((e) => e.player_uid === playerUid)
      .map((e) => {
        const normalized = normalizeCoachRatings(e.ratings);
        const label = normalized.overall != null
          ? `Éval ${formatCoachRating(normalized.overall)}`
          : 'Éval coach';
        return {
          id: e.id,
          label,
          at: e.created_at,
        };
      });
    const fromSheets = events.flatMap((ev) => {
      const st = ev.player_match_stats?.[playerUid];
      if (!st) return [];
      return [
        {
          id: `${ev.id}_${playerUid}`,
          label: `${ev.title}: ${st.goals ?? 0}B · note ${st.rating ?? '—'}`,
          at: ev.starts_at,
        },
      ];
    });
    return [...fromEvals, ...fromSheets].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);
  }, [evals, events, playerUid]);

  const injuryCards = useMemo(() => {
    const actorRole = mapUserRoleToPrivacyActor(profile.role);
    return members.slice(0, 12).map((m) => {
      const playerGrants = grants.filter((g) => g.owner_uid === m.uid);
      const allowed = canAccessSensitiveResource({
        actor_uid: profile.uid,
        actor_role: actorRole,
        owner_uid: m.uid,
        resource_type: 'medical_document',
        resource_id: playerGrants[0]?.resource_id ?? 'any',
        grants: playerGrants,
      });
      return { player: m, allowed };
    });
  }, [members, grants, profile.uid, profile.role]);

  const formBoard = useMemo(() => {
    const actorRole = mapUserRoleToPrivacyActor(profile.role);
    return members.slice(0, 12).map((m) => {
      const playerGrants = grants.filter((g) => g.owner_uid === m.uid);
      const allowed = canAccessSensitiveResource({
        actor_uid: profile.uid,
        actor_role: actorRole,
        owner_uid: m.uid,
        resource_type: 'personal_document',
        resource_id: playerGrants.find((g) => g.scope === 'all_personal')?.resource_id ?? 'form',
        grants: playerGrants,
      });
      const signals = wellnessByUid[m.uid];
      return { player: m, allowed, signals };
    });
  }, [members, grants, wellnessByUid, profile.uid, profile.role]);

  const loadSignals = useMemo((): PlayerLoadSignals[] => {
    const weekAgo = Date.now() - 7 * 24 * 3600_000;
    return members.slice(0, 20).map((m) => {
      const recent = events.filter(
        (e) =>
          e.starts_at.getTime() >= weekAgo &&
          e.starts_at.getTime() <= Date.now() &&
          (e.invitee_uids.includes(m.uid) || Boolean(e.player_match_stats?.[m.uid])),
      );
      const matchEvents = recent.filter(
        (e) =>
          e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament',
      );
      const trainings = recent.filter((e) => e.event_type === 'training');
      const minutes = matchEvents.reduce(
        (sum, e) => sum + (e.player_match_stats?.[m.uid]?.minutes_played ?? 0),
        0,
      );
      const lastMatch = [...matchEvents].sort(
        (a, b) => b.starts_at.getTime() - a.starts_at.getTime(),
      )[0];
      const wellness = wellnessByUid[m.uid];
      return {
        uid: m.uid,
        displayName: m.display_name,
        matchesLast7d: matchEvents.length,
        minutesLast7d: minutes,
        trainingsLast7d: trainings.length,
        declaredFatigue: wellness?.fatigue ?? null,
        daysSinceLastMatch: lastMatch
          ? Math.floor((Date.now() - lastMatch.starts_at.getTime()) / 86400000)
          : null,
      };
    });
  }, [members, events, wellnessByUid]);

  const saveEval = async () => {
    if (!clubId || !selectedPlayer) return;
    if (!evalNotes.trim() && !overall.trim()) {
      Alert.alert('Évaluation vide', 'Ajoutez une note globale ou un commentaire.');
      return;
    }
    setSaving(true);
    try {
      await coachEvaluationsService.create(profile.uid, profile.display_name, {
        club_id: clubId,
        player_uid: selectedPlayer.uid,
        player_name: selectedPlayer.display_name,
        context: 'season',
        ratings: overall.trim()
          ? normalizeCoachRatings({ overall: parseFloat(overall.replace(',', '.')) })
          : {},
        notes: evalNotes.trim() || undefined,
        visible_to_player: visiblePlayer,
        visible_to_parent: false,
      });
      setEvalNotes('');
      setOverall('');
      await load();
      onRefresh();
      Alert.alert('OK', t('coach.portal.performance.evalSaved'));
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible');
    } finally {
      setSaving(false);
    }
  };

  const saveObjective = async () => {
    if (!clubId || !objTitle.trim()) return;
    setSaving(true);
    try {
      await coachObjectivesService.create(profile.uid, {
        club_id: clubId,
        scope: 'team',
        title: objTitle.trim(),
        progress: 0,
      });
      setObjTitle('');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible');
    } finally {
      setSaving(false);
    }
  };

  const bumpProgress = async (id: string, progress: number) => {
    try {
      await coachObjectivesService.setProgress(id, progress);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible');
    }
  };

  if (!clubId) {
    return (
      <CoachPane title={getCoachPageIdentity('forme').title}>
        <CoachChapterScroll>
          <CoachEmptyState
            title={t('coach.portal.effectif.noClub')}
            body={t('coach.portal.effectif.noClubBody')}
          />
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  return (
    <CoachPane title={getCoachPageIdentity('forme').title}>
    <CoachChapterScroll>
      <CoachAnalyseFormePanel
        loadSignals={loadSignals}
        wellnessByUid={wellnessByUid}
        onOpenPlayer={(uid) => setPlayerUid(uid)}
        onOpenTraining={() => {
          if (shellNav) shellNav.requestNav('smart_tactics');
          else nav.openDashboard('smart_tactics');
        }}
      />

      <PressableSpring
        onPress={() => tabNav.openMatchs({ homeTab: 'stats' })}
        scaleTo={0.96}
        haptic
      >
        <CoachSectionCard
          kicker="Saison"
          title={t('coach.portal.performance.seasonStats')}
          body={t('coach.portal.performance.seasonStatsBody')}
        >
          <ProDayText variant="caption" style={styles.link}>
            Ouvrir les stats →
          </ProDayText>
        </CoachSectionCard>
      </PressableSpring>

      <CoachSectionCard
        kicker="Confidentialité"
        title="Check-ins détaillés"
        body="Données individuelles visibles uniquement avec accord du joueur."
      >
        {formBoard.map(({ player, allowed, signals }) => (
          <View key={`form_${player.uid}`} style={styles.listRow}>
            <ProDayText variant="caption" style={styles.listName} numberOfLines={1}>
              {player.display_name}
            </ProDayText>
            {allowed && signals ? (
              <ProDayText variant="caption" style={styles.listValue}>
                {signals.wellness_score != null
                  ? `Score ${Math.round(signals.wellness_score)}`
                  : `Fatigue ${signals.fatigue ?? '—'}`}
              </ProDayText>
            ) : (
              <ProDayText variant="caption" style={styles.listMuted}>
                Confidentiel
              </ProDayText>
            )}
          </View>
        ))}
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Évaluation"
        title={t('coach.portal.performance.eval')}
        body="Note globale et commentaire — visibles ou non pour le joueur."
      >
        <View style={styles.chipRow}>
          {members.slice(0, 10).map((m) => {
            const on = playerUid === m.uid;
            return (
              <PressableSpring
                key={m.uid}
                onPress={() => setPlayerUid(m.uid)}
                scaleTo={0.96}
                style={[styles.chip, on && styles.chipOn]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.chipText, on ? styles.chipTextOn : styles.chipTextOff]}
                >
                  {m.display_name.split(' ')[0]}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          value={overall}
          onChangeText={setOverall}
          keyboardType="number-pad"
          placeholder={t('coach.portal.performance.overall')}
          placeholderTextColor={tokens.muted}
        />
        <TextInput
          style={[styles.input, styles.multi]}
          value={evalNotes}
          onChangeText={setEvalNotes}
          multiline
          placeholder={t('coach.portal.performance.evalNotes')}
          placeholderTextColor={tokens.muted}
        />
        <View style={styles.switchRow}>
          <ProDayText variant="caption" style={styles.listMuted}>
            {t('coach.portal.performance.visiblePlayer')}
          </ProDayText>
          <Switch
            value={visiblePlayer}
            onValueChange={setVisiblePlayer}
            trackColor={{ false: tokens.border, true: tokens.soft }}
            thumbColor={visiblePlayer ? tokens.accent : tokens.elevated}
          />
        </View>
        <CoachActionRow
          primary={t('coach.portal.performance.saveEval')}
          onPrimary={() => {
            if (!saving && selectedPlayer) void saveEval();
          }}
        />
        {evals.slice(0, 5).map((e) => {
          const normalized = normalizeCoachRatings(e.ratings);
          const scoreLabel = normalized.overall != null ? formatCoachRating(normalized.overall) : '—';
          return (
            <ProDayText key={e.id} variant="caption" style={styles.listMuted}>
              {e.player_name} · {scoreLabel}
            </ProDayText>
          );
        })}
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Parcours"
        title={t('coach.portal.performance.timeline')}
        body={selectedPlayer ? `Fil de ${selectedPlayer.display_name}` : undefined}
      >
        {playerTimeline.length === 0 ? (
          <ProDayText variant="caption" style={styles.listMuted}>
            {t('coach.portal.performance.timelineEmpty')}
          </ProDayText>
        ) : (
          playerTimeline.map((row) => (
            <View key={row.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <ProDayText variant="caption" style={styles.listName}>
                {row.label}
              </ProDayText>
            </View>
          ))
        )}
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Saison"
        title={t('coach.portal.performance.objectives')}
        body="Objectifs d’équipe et progression."
      >
        <TextInput
          style={styles.input}
          value={objTitle}
          onChangeText={setObjTitle}
          placeholder={t('coach.portal.performance.objPlaceholder')}
          placeholderTextColor={tokens.muted}
        />
        <CoachActionRow
          primary={t('coach.portal.performance.addObjective')}
          onPrimary={() => {
            if (!saving) void saveObjective();
          }}
        />
        {objectives.map((o) => (
          <View key={o.id} style={styles.listRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <ProDayText variant="caption" style={styles.listName}>
                {o.title}
              </ProDayText>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, o.progress)}%` }]} />
              </View>
              <ProDayText variant="caption" style={styles.listMuted}>
                {o.progress}%
              </ProDayText>
            </View>
            <PressableSpring
              onPress={() => void bumpProgress(o.id, Math.min(100, o.progress + 10))}
              scaleTo={0.96}
              haptic
              style={styles.bumpBtn}
            >
              <ProDayText variant="caption" style={styles.link}>
                +10%
              </ProDayText>
            </PressableSpring>
          </View>
        ))}
      </CoachSectionCard>

      <CoachSectionCard
        kicker="Accès"
        title={t('coach.portal.performance.injury')}
        body={t('coach.portal.performance.injuryBody')}
      >
        {injuryCards.map(({ player, allowed }) => (
          <View key={player.uid} style={styles.listRow}>
            <ProDayText variant="caption" style={styles.listName}>
              {player.display_name}
            </ProDayText>
            <ProDayText
              variant="caption"
              style={allowed ? styles.listMuted : styles.link}
            >
              {allowed
                ? t('coach.portal.performance.injuryGranted')
                : t('coach.portal.performance.injuryAsk')}
            </ProDayText>
          </View>
        ))}
      </CoachSectionCard>
    </CoachChapterScroll>
    </CoachPane>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: tokens.isLight ? tokens.surface : 'rgba(255,255,255,0.02)',
  },
  chipOn: {
    borderColor: tokens.accent,
    backgroundColor: tokens.soft,
  },
  chipText: { fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: tokens.accent },
  chipTextOff: { color: tokens.muted },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    borderRadius: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: tokens.foreground,
    backgroundColor: tokens.isLight ? tokens.surface : 'rgba(255,255,255,0.03)',
    marginTop: 6,
  },
  multi: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 8,
    marginBottom: 4,
  },
  link: { color: tokens.accent, fontWeight: '800' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border,
  },
  listName: { color: tokens.foreground, fontWeight: '700', flex: 1 },
  listValue: { color: tokens.accent, fontWeight: '700' },
  listMuted: { color: tokens.muted },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.accent,
  },
  progressTrack: {
    height: 3,
    backgroundColor: tokens.border,
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.accent,
  },
  bumpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    backgroundColor: tokens.isLight ? tokens.surface : 'transparent',
  },
  });
}
