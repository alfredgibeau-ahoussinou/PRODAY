import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  SmartMetricChip,
  SmartTacticsChapterScroll,
  SmartTacticsEmpty,
  SMART_PITCH,
  type SmartTacticsChapterProps,
} from './smartTacticsUi';
import { SmartPlayerCard } from './SmartPlayerCard';
import { MatchReadinessRing } from './MatchReadinessRing';
import { SmartTacticsBoard, compactBoardStarters, padStartersForBoard } from './SmartTacticsBoard';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { smartTacticsService } from '../../services/smartTactics.service';
import { teamEventsService } from '../../services/teamEvents.service';
import type {
  TacticalBoardSlot,
  LiveTagKind,
  MatchPhase,
  TacticalPlan,
  AiMatchPreparation,
} from '../../models/SmartTactics';
import {
  DEFAULT_TEAM_INSTRUCTIONS,
  INDIVIDUAL_SKILL_LABELS,
  LIVE_TAG_LABELS,
  TRAINING_BLOCK_LABELS,
} from '../../models/SmartTactics';
import {
  boardSlotsToEventLineup,
  eventLineupToBoardSlots,
  pickLineupTargetEvent,
} from '../../utils/tacticalBoardSync';
import { analyzeSquadForm } from '../../utils/smartTacticsEngine';
import { radius, spacing } from '../../theme/designTokens';
import { Icon } from '../ui/Icon';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';

export const SmartDashboardChapter: React.FC<SmartTacticsChapterProps> = ({
  profile,
  events,
  members,
  wellnessByUid,
  onOpenChapter,
  onHydratePlan,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const hasClub = Boolean(profile.profile.club_id);
  const dash = useMemo(
    () => smartTacticsService.buildDashboard(members, events, wellnessByUid),
    [members, events, wellnessByUid],
  );
  const nextMatch = useMemo(() => pickLineupTargetEvent(events), [events]);
  const topCard = dash.suggested_xi[0];
  const hasLineup = Boolean(nextMatch?.lineup && nextMatch.lineup.slots.length > 0);
  const [applyingXi, setApplyingXi] = useState(false);

  const openGestion = () => {
    if (shellNav) shellNav.requestNav('gestion');
    else nav.openDashboard('gestion');
  };
  const openMatchs = () => {
    if (shellNav) shellNav.requestNav('match_center');
    else nav.openMatchs();
  };

  const applySuggestedXi = async () => {
    const clubId = profile.profile.club_id;
    if (!clubId || dash.suggested_xi.length === 0) return;
    setApplyingXi(true);
    try {
      const prep = await smartTacticsService.prepareMatchWithAi({
        club_id: clubId,
        members,
        events,
        opponent_name: nextMatch?.live_state?.opponent_name ?? nextMatch?.title,
        wellnessByUid,
        event_id: nextMatch?.id,
      });
      const plan = smartTacticsService.buildPlanFromPrep({
        prep,
        members,
        club_id: clubId,
        created_by: profile.uid,
        event_id: nextMatch?.id,
        opponent_name: nextMatch?.live_state?.opponent_name ?? nextMatch?.title,
      });
      onHydratePlan?.(plan);
      onOpenChapter('board');
    } finally {
      setApplyingXi(false);
    }
  };

  if (!hasClub) {
    return (
      <SmartTacticsChapterScroll>
        <SmartTacticsEmpty
          title={t('smartTactics.empty.club')}
          body={t('smartTactics.empty.clubBody')}
          cta={t('smartTactics.cta.gestion')}
          onPress={openGestion}
        />
      </SmartTacticsChapterScroll>
    );
  }

  return (
    <SmartTacticsChapterScroll>
      <ProDaySurface variant="module" style={[styles.mission, { borderColor: colors.border }]}>
        <ProDayText variant="caption" muted style={styles.missionKicker}>
          {t('smartTactics.flow.mission')}
        </ProDayText>
        <ProDayText variant="section">
          {nextMatch
            ? nextMatch.title
            : t('smartTactics.match.noneTitle')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {nextMatch
            ? hasLineup
              ? t('smartTactics.match.hasLineup')
              : t('smartTactics.match.needLineup')
            : t('smartTactics.match.noneBody')}
        </ProDayText>
        <View style={styles.missionActions}>
          <PressableSpring
            onPress={() => onOpenChapter('board')}
            scaleTo={0.96}
            haptic
            style={styles.primaryCta}
          >
            <ProDayText variant="body" style={styles.ctaText}>
              {hasLineup ? t('smartTactics.cta.editXi') : t('smartTactics.cta.composeXi')}
            </ProDayText>
          </PressableSpring>
          {!nextMatch ? (
            <PressableSpring onPress={openMatchs} scaleTo={0.96} haptic style={styles.secondaryCta}>
              <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
                {t('smartTactics.cta.openMatchs')}
              </ProDayText>
            </PressableSpring>
          ) : (
            <PressableSpring
              onPress={() => onOpenChapter('cards')}
              scaleTo={0.96}
              haptic
              style={styles.secondaryCta}
            >
              <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
                {t('smartTactics.cta.seeSquad')}
              </ProDayText>
            </PressableSpring>
          )}
        </View>
      </ProDaySurface>

      <View style={styles.metrics}>
        <SmartMetricChip label={t('smartTactics.metric.morale')} value={`${dash.morale}`} tone="warm" />
        <SmartMetricChip
          label={t('smartTactics.metric.attendance')}
          value={`${dash.attendance_rate}%`}
          tone="good"
        />
        <SmartMetricChip
          label={t('smartTactics.metric.load')}
          value={`${dash.weekly_workload}`}
          tone={dash.weekly_workload > 70 ? 'warn' : 'neutral'}
        />
      </View>

      {topCard ? (
        <View style={styles.ringRow}>
          <MatchReadinessRing potential={topCard.overall} readinessPct={topCard.readiness_pct} />
          <View style={{ flex: 1, gap: 6 }}>
            <ProDayText variant="section">{t('smartTactics.readiness.title')}</ProDayText>
            <ProDayText variant="caption" muted>
              {t('smartTactics.readiness.body', {
                potential: topCard.overall,
                ready: topCard.readiness_pct,
              })}
            </ProDayText>
            <PressableSpring onPress={() => onOpenChapter('cards')} scaleTo={0.96} haptic>
              <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
                {t('smartTactics.cta.seeSquad')} →
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      ) : (
        <SmartTacticsEmpty
          title={t('smartTactics.empty.roster')}
          body={t('smartTactics.empty.rosterBody')}
          cta={t('smartTactics.cta.gestion')}
          onPress={openGestion}
        />
      )}

      <Section title={t('smartTactics.section.suggestedXi')}>
        <View style={styles.cardGrid}>
          {dash.suggested_xi.slice(0, 6).map((c) => (
            <View key={c.uid} style={styles.cardHalf}>
              <SmartPlayerCard card={c} compact />
            </View>
          ))}
        </View>
        {dash.suggested_xi.length > 0 ? (
          <PressableSpring
            onPress={() => void applySuggestedXi()}
            scaleTo={0.96}
            haptic
            style={styles.link}
            disabled={applyingXi}
          >
            <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
              {applyingXi
                ? 'Composition IA…'
                : `${t('smartTactics.cta.applyOnBoard')} →`}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </Section>

      <Section title={t('smartTactics.section.alerts')}>
        {dash.ai_alerts.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('smartTactics.alerts.none')}
          </ProDayText>
        ) : (
          dash.ai_alerts.map((a) => (
            <ProDaySurface key={a} variant="module" style={[styles.alert, { borderColor: colors.border }]}>
              <Icon name="warning" size={14} color={SMART_PITCH.warm} />
              <ProDayText variant="caption" style={{ flex: 1 }}>
                {a}
              </ProDayText>
            </ProDaySurface>
          ))
        )}
      </Section>

      {(dash.in_form.length > 0 || dash.fatigued.length > 0) && (
        <WidgetRow
          title={t('smartTactics.section.inForm')}
          cards={dash.in_form}
          riskTitle={t('smartTactics.section.fatigued')}
          risk={dash.fatigued}
        />
      )}

      <Section title={t('smartTactics.section.upcoming')}>
        {dash.upcoming_match_titles.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('smartTactics.match.noneBody')}
          </ProDayText>
        ) : (
          dash.upcoming_match_titles.map((title) => (
            <ProDayText key={title} variant="caption" style={styles.bullet}>
              • {title}
            </ProDayText>
          ))
        )}
        <PressableSpring onPress={openMatchs} scaleTo={0.96} haptic style={styles.link}>
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
            {t('smartTactics.cta.openMatchs')} →
          </ProDayText>
        </PressableSpring>
      </Section>
    </SmartTacticsChapterScroll>
  );
};

export const SmartBoardChapter: React.FC<SmartTacticsChapterProps> = ({
  profile,
  members,
  events,
  wellnessByUid,
  hydratePlan,
  onHydratePlan,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const targetEvent = useMemo(() => pickLineupTargetEvent(events), [events]);
  const playerCards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const initial = useMemo(() => {
    if (hydratePlan?.board) {
      const starters = hydratePlan.board.slots.filter((s) => s.role === 'starter');
      const bench = hydratePlan.board.slots.filter((s) => s.role === 'sub');
      const used = new Set(hydratePlan.board.slots.map((s) => s.uid));
      const pool: TacticalBoardSlot[] = members
        .filter((m) => !used.has(m.uid))
        .map((m) => ({
          uid: m.uid,
          display_name: m.display_name,
          role: 'sub',
          position_label: m.profile.position,
        }));
      return {
        formation: hydratePlan.board.formation || '4-3-3',
        starters,
        bench,
        pool,
      };
    }
    if (targetEvent?.lineup) {
      const mapped = eventLineupToBoardSlots(targetEvent.lineup);
      const used = new Set(targetEvent.lineup.slots.map((s) => s.uid));
      const pool: TacticalBoardSlot[] = members
        .filter((m) => !used.has(m.uid))
        .map((m) => ({
          uid: m.uid,
          display_name: m.display_name,
          role: 'sub',
          position_label: m.profile.position,
        }));
      return { ...mapped, pool };
    }
    const slots: TacticalBoardSlot[] = members.map((m) => ({
      uid: m.uid,
      display_name: m.display_name,
      role: 'sub',
      position_label: m.profile.position,
    }));
    return { formation: '4-3-3', starters: [] as TacticalBoardSlot[], bench: [] as TacticalBoardSlot[], pool: slots };
  }, [members, targetEvent, hydratePlan]);

  const [formation, setFormation] = useState(initial.formation);
  const [starters, setStarters] = useState(initial.starters);
  const [bench, setBench] = useState(initial.bench);
  const [pool, setPool] = useState(initial.pool);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPrep, setAiPrep] = useState<AiMatchPreparation | null>(null);
  const [aiSeed, setAiSeed] = useState(0);
  const [instructions] = useState(DEFAULT_TEAM_INSTRUCTIONS);
  const [syncEventId, setSyncEventId] = useState<string | null>(
    hydratePlan?.event_id ?? targetEvent?.id ?? null,
  );

  const formReport = useMemo(() => analyzeSquadForm(playerCards), [playerCards]);

  React.useEffect(() => {
    setFormation(initial.formation);
    setStarters(initial.starters);
    setBench(initial.bench);
    setPool(initial.pool);
    setSyncEventId(hydratePlan?.event_id ?? targetEvent?.id ?? null);
  }, [initial, targetEvent?.id, hydratePlan?.id, hydratePlan?.event_id]);

  const matchCandidates = useMemo(
    () =>
      [...events]
        .filter(
          (e) =>
            e.event_type === 'friendly' ||
            e.event_type === 'competition' ||
            e.event_type === 'tournament',
        )
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, 6),
    [events],
  );

  const runAiCompose = async () => {
    const clubId = profile.profile.club_id;
    if (!clubId) {
      Alert.alert('Club requis', t('smartTactics.empty.club'));
      return;
    }
    if (playerCards.length < 7) {
      Alert.alert('Effectif', t('smartTactics.board.aiNeedRoster'));
      return;
    }
    setAiBusy(true);
    try {
      const syncEvent = syncEventId
        ? events.find((e) => e.id === syncEventId)
        : targetEvent;
      const opponent =
        syncEvent?.live_state?.opponent_name ?? syncEvent?.title;
      const prep = await smartTacticsService.prepareMatchWithAi({
        club_id: clubId,
        members,
        events,
        opponent_name: opponent,
        preferred_formation: formation,
        wellnessByUid,
        event_id: syncEvent?.id,
        coach_notes: `Compose le XI directement sur le board. Formation coach: ${formation}.`,
      });
      const plan = smartTacticsService.buildPlanFromPrep({
        prep,
        members,
        club_id: clubId,
        created_by: profile.uid,
        event_id: syncEvent?.id,
        opponent_name: opponent,
      });
      const xi = plan.board.slots.filter((s) => s.role === 'starter');
      const subs = plan.board.slots.filter((s) => s.role === 'sub');
      const used = new Set([...xi, ...subs].map((s) => s.uid));
      const nextPool: TacticalBoardSlot[] = members
        .filter((m) => !used.has(m.uid))
        .map((m) => ({
          uid: m.uid,
          display_name: m.display_name,
          role: 'sub' as const,
          position_label: m.profile.position,
        }));
      const nextFormation = plan.board.formation || prep.formation_recommendation || formation;
      setFormation(nextFormation);
      setStarters(padStartersForBoard(xi, nextFormation));
      setBench(subs);
      setPool(nextPool);
      setAiPrep(prep);
      setAiSeed((n) => n + 1);
      onHydratePlan?.(plan);
      Alert.alert(
        prep.source === 'mistral' ? t('smartTactics.board.aiTitleMistral') : t('smartTactics.board.aiTitleLocal'),
        prep.briefing_fr ||
          `${prep.formation_recommendation} · ${xi.length} titulaires posés`,
      );
    } catch (e) {
      Alert.alert('IA', e instanceof Error ? e.message : t('smartTactics.board.aiError'));
    } finally {
      setAiBusy(false);
    }
  };

  const save = async () => {
    const clubId = profile.profile.club_id;
    if (!clubId) {
      Alert.alert('Club requis', t('smartTactics.empty.club'));
      return;
    }
    setSaving(true);
    try {
      const lineup = boardSlotsToEventLineup(
        formation,
        compactBoardStarters(starters),
        bench,
      );
      await smartTacticsService.savePlan({
        club_id: clubId,
        title: `Plan ${formation}${syncEventId ? ` · match` : ''}`,
        created_by: profile.uid,
        event_id: syncEventId ?? undefined,
        board: {
          formation,
          slots: [...compactBoardStarters(starters), ...bench],
          is_custom_formation: !formation.match(/^\d(-\d)+$/),
        },
        instructions,
      });
      if (syncEventId) {
        await teamEventsService.saveLineup(syncEventId, lineup, { user: profile });
      }
      onHydratePlan?.(null);
      Alert.alert(
        'Tactique IA',
        syncEventId
          ? `${t('smartTactics.saved')} · composition synchronisée sur le match`
          : t('smartTactics.saved'),
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SmartTacticsChapterScroll>
      <View style={styles.boardHero}>
        <ProDayText variant="caption" style={[styles.missionKicker, { color: SMART_PITCH.warm }]}>
          Tactique IA
        </ProDayText>
        <ProDayText variant="section" style={{ fontWeight: '900' }}>
          {t('smartTactics.chapter.board')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {hydratePlan
            ? t('smartTactics.board.hydrated', { title: hydratePlan.title })
            : 'Terrain 3D · pose les cartes · banc de touche en bas'}
        </ProDayText>
      </View>

      <ProDaySurface variant="module" style={[styles.aiStrip, { borderColor: colors.border }]}>
        <View style={styles.aiStripTop}>
          <Icon name="tune" size={16} color={SMART_PITCH.warm} />
          <ProDayText variant="caption" style={{ flex: 1, fontWeight: '800' }}>
            {t('smartTactics.board.aiTitle')}
          </ProDayText>
          <SmartMetricChip
            label={t('smartTactics.board.aiForm')}
            value={`${formReport.avg_form}`}
            tone={formReport.avg_form >= 70 ? 'good' : formReport.avg_form >= 55 ? 'warm' : 'warn'}
          />
          <SmartMetricChip
            label={t('smartTactics.board.aiReady')}
            value={`${formReport.avg_readiness}%`}
            tone={formReport.avg_readiness >= 70 ? 'good' : 'warm'}
          />
        </View>
        <PressableSpring
          onPress={() => void runAiCompose()}
          scaleTo={0.96}
          haptic
          disabled={aiBusy}
          style={[styles.aiCta, { opacity: aiBusy ? 0.55 : 1, marginTop: 0 }]}
        >
          <ProDayText variant="body" style={styles.ctaText}>
            {aiBusy ? t('smartTactics.board.aiBusy') : t('smartTactics.board.aiCompose')}
          </ProDayText>
        </PressableSpring>
        {aiPrep ? (
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '700' }}>
            {aiPrep.source === 'mistral' ? 'Mistral' : 'Local'} · {aiPrep.formation_recommendation} ·{' '}
            {compactBoardStarters(starters).length} titulaires
            {aiPrep.briefing_fr ? ` — ${aiPrep.briefing_fr}` : ''}
          </ProDayText>
        ) : null}
      </ProDaySurface>

      {matchCandidates.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.missionKicker, { color: SMART_PITCH.warm }]}>
            {t('smartTactics.board.syncTitle')}
          </ProDayText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reportRow}
          >
            {matchCandidates.map((e) => {
              const on = syncEventId === e.id;
              return (
                <PressableSpring
                  key={e.id}
                  onPress={() => setSyncEventId(on ? null : e.id)}
                  scaleTo={0.96}
                  haptic
                  style={[
                    styles.syncChip,
                    {
                      borderColor: on ? SMART_PITCH.warm : colors.border,
                      backgroundColor: on ? SMART_PITCH.warmSoft : colors.surface,
                    },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    numberOfLines={1}
                    style={{ fontWeight: '800', color: on ? SMART_PITCH.warm : undefined }}
                  >
                    {e.title}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <SmartTacticsBoard
        formation={formation}
        starters={starters}
        bench={bench}
        pool={pool}
        cards={playerCards}
        seedKey={`${hydratePlan?.id ?? 'none'}|${targetEvent?.id ?? 'none'}|ai:${aiSeed}|${initial.starters.map((s) => s.uid).join(',')}`}
        onChangeFormation={setFormation}
        onStartersChange={setStarters}
        onBenchChange={setBench}
        onPoolChange={setPool}
      />

      {hydratePlan?.strategy_notes ? (
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm }}>
          {hydratePlan.strategy_notes}
        </ProDayText>
      ) : null}

      <PressableSpring
        onPress={() => void save()}
        scaleTo={0.96}
        haptic
        style={[styles.cta, { opacity: saving ? 0.6 : 1 }]}
      >
        <ProDayText variant="body" style={styles.ctaText}>
          {t('smartTactics.savePlan')}
          {syncEventId ? ` · ${t('smartTactics.board.syncMatch')}` : ''}
        </ProDayText>
      </PressableSpring>
    </SmartTacticsChapterScroll>
  );
};

export const SmartCardsChapter: React.FC<SmartTacticsChapterProps> = ({
  members,
  wellnessByUid,
  onOpenChapter,
}) => {
  const { t } = useTranslation();
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">{t('smartTactics.chapter.cards')}</ProDayText>
      <ProDayText variant="caption" muted>
        {t('smartTactics.squad.body')}
      </ProDayText>
      {cards.length === 0 ? (
        <SmartTacticsEmpty
          title={t('smartTactics.empty.roster')}
          body={t('smartTactics.empty.rosterBody')}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.futRow}
        >
          {cards.map((c) => (
            <SmartPlayerCard key={c.uid} card={c} fut />
          ))}
        </ScrollView>
      )}
      <PressableSpring onPress={() => onOpenChapter('board')} scaleTo={0.96} haptic style={styles.link}>
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          {t('smartTactics.cta.composeXi')} →
        </ProDayText>
      </PressableSpring>
    </SmartTacticsChapterScroll>
  );
};

export const SmartPrepChapter: React.FC<SmartTacticsChapterProps> = ({
  members,
  events,
  profile,
  wellnessByUid,
  onOpenChapter,
  onHydratePlan,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const next = [...events]
    .filter((e) => e.starts_at.getTime() > Date.now())
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
  const opponentName = next?.live_state?.opponent_name ?? next?.title;
  const clubId = profile.profile.club_id ?? '';

  const [prep, setPrep] = useState(() =>
    smartTacticsService.prepareMatchFromEvents(members, events, {
      opponent_name: opponentName,
      wellnessByUid,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<
    Awaited<ReturnType<typeof smartTacticsService.listReports>>
  >([]);

  React.useEffect(() => {
    setPrep(
      smartTacticsService.prepareMatchFromEvents(members, events, {
        opponent_name: opponentName,
        wellnessByUid,
      }),
    );
  }, [members, events, opponentName, wellnessByUid]);

  React.useEffect(() => {
    if (!next?.id) {
      setReports([]);
      return;
    }
    void smartTacticsService.listReports(next.id).then(setReports);
  }, [next?.id]);

  const runAi = async () => {
    if (!clubId) {
      Alert.alert('Club requis', t('smartTactics.empty.club'));
      return;
    }
    setBusy(true);
    try {
      const remote = await smartTacticsService.prepareMatchWithAi({
        club_id: clubId,
        members,
        events,
        opponent_name: opponentName,
        wellnessByUid,
        event_id: next?.id,
      });
      setPrep(remote);
      Alert.alert(
        remote.source === 'mistral' ? 'Préparation Mistral' : 'Préparation locale',
        remote.briefing_fr ||
          remote.tactical_suggestions[0] ||
          `Formation ${remote.formation_recommendation}`,
      );
    } catch (e) {
      Alert.alert('IA', e instanceof Error ? e.message : 'Préparation impossible');
    } finally {
      setBusy(false);
    }
  };

  const applyXi = () => {
    if (!clubId) {
      Alert.alert('Club requis', t('smartTactics.empty.club'));
      return;
    }
    const plan = smartTacticsService.buildPlanFromPrep({
      prep,
      members,
      club_id: clubId,
      created_by: profile.uid,
      event_id: next?.id,
      opponent_name: opponentName,
    });
    onHydratePlan?.(plan);
    onOpenChapter('board');
  };

  const makeReport = async (phase: MatchPhase) => {
    if (!next) {
      Alert.alert('Match requis', 'Planifiez un match pour générer un rapport.');
      return;
    }
    const report = smartTacticsService.generateReport(
      next,
      phase,
      profile.uid,
      members,
      wellnessByUid,
      events,
    );
    await smartTacticsService.persistReport(report);
    setReports((prev) => [report, ...prev].slice(0, 10));
    Alert.alert(report.title, report.summary);
  };

  const xiNames = prep.starting_xi_uids
    .map((id) => members.find((m) => m.uid === id)?.display_name)
    .filter(Boolean)
    .slice(0, 11);

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Préparation IA</ProDayText>
      <ProDayText variant="caption" muted>
        {opponentName
          ? `Match · ${opponentName}`
          : 'Aucun match à venir — analyse sur effectif + historique club'}
      </ProDayText>

      <View style={styles.reportRow}>
        <PressableSpring
          onPress={() => void runAi()}
          scaleTo={0.96}
          haptic
          style={[styles.cta, { opacity: busy ? 0.6 : 1 }]}
        >
          <Icon name="star-four-points" size={16} color="#0B1A12" />
          <ProDayText variant="caption" style={styles.ctaText}>
            {busy ? 'Analyse…' : 'Lancer l’IA Mistral'}
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={applyXi} scaleTo={0.96} haptic style={styles.secondaryCta}>
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
            Appliquer le XI sur le board →
          </ProDayText>
        </PressableSpring>
      </View>

      <ProDaySurface style={[styles.alert, { borderColor: colors.border }]} variant="module">
        <ProDayText variant="caption" style={{ fontWeight: '800', color: SMART_PITCH.warm }}>
          Source · {prep.source === 'mistral' ? 'Mistral cloud' : 'Moteur local'}
          {prep.fallback ? ` · ${t('smartTactics.aiFallback')}` : ''}
        </ProDayText>
        {prep.briefing_fr ? (
          <ProDayText variant="body" style={{ marginTop: 4 }}>
            {prep.briefing_fr}
          </ProDayText>
        ) : null}
      </ProDaySurface>

      <Section title="XI recommandé">
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          {prep.formation_recommendation}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {xiNames.length ? xiNames.join(' · ') : 'Effectif insuffisant'}
        </ProDayText>
      </Section>

      <Section title="Forces adverses">
        {prep.opponent.strengths.map((s) => (
          <ProDayText key={s} variant="caption" muted style={styles.bullet}>
            • {s}
          </ProDayText>
        ))}
      </Section>
      <Section title="Faiblesses">
        {prep.opponent.weaknesses.map((s) => (
          <ProDayText key={s} variant="caption" muted style={styles.bullet}>
            • {s}
          </ProDayText>
        ))}
      </Section>
      <Section title="Suggestions">
        {prep.tactical_suggestions.map((s) => (
          <ProDayText key={s} variant="caption" muted style={styles.bullet}>
            • {s}
          </ProDayText>
        ))}
      </Section>
      <Section title="Alertes physiques">
        {prep.physical_alerts.length === 0 ? (
          <ProDayText variant="caption" muted>
            Effectif prêt.
          </ProDayText>
        ) : (
          prep.physical_alerts.map((a) => (
            <ProDayText key={a} variant="caption" style={[styles.bullet, { color: SMART_PITCH.risk }]}>
              • {a}
            </ProDayText>
          ))
        )}
      </Section>

      <Section title="Rapports match">
        <View style={styles.reportRow}>
          {(['pre', 'half', 'post', 'debrief'] as MatchPhase[]).map((phase) => (
            <PressableSpring
              key={phase}
              onPress={() => void makeReport(phase)}
              scaleTo={0.96}
              haptic
              style={[styles.reportBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                {phase}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
        {reports.map((r) => (
          <ProDaySurface key={r.id} variant="module" style={[styles.block, { borderColor: colors.border }]}>
            <ProDayText variant="caption" style={{ fontWeight: '800' }}>
              {r.title}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {r.summary}
            </ProDayText>
          </ProDaySurface>
        ))}
      </Section>
    </SmartTacticsChapterScroll>
  );
};

export const SmartTrainingChapter: React.FC<SmartTacticsChapterProps> = ({
  members,
  events,
  profile,
  wellnessByUid,
}) => {
  const { colors } = useAppTheme();
  const lastMatch = [...events]
    .filter((e) => e.event_type === 'friendly' || e.event_type === 'competition')
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())[0];
  const prep = useMemo(
    () =>
      smartTacticsService.prepareMatchFromEvents(members, events, {
        opponent_name: lastMatch?.live_state?.opponent_name ?? lastMatch?.title,
        wellnessByUid,
      }),
    [members, events, lastMatch, wellnessByUid],
  );
  const session = useMemo(
    () =>
      smartTacticsService.generateTraining({
        previous_match: lastMatch,
        opponent_profile: prep.opponent,
        team_weaknesses:
          prep.opponent.weaknesses.length > 0
            ? prep.opponent.weaknesses
            : prep.physical_alerts.slice(0, 2),
        season_objectives: prep.tactical_suggestions.slice(0, 2),
      }),
    [lastMatch, prep],
  );
  const premium = profile.subscription_tier === 'pro';
  const player = members.find((m) => m.role === 'player') ?? members[0];
  const individual = useMemo(
    () => (player ? smartTacticsService.generatePlayerPlan(player, premium) : null),
    [player, premium],
  );

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Entraînement collectif</ProDayText>
      <ProDayText variant="caption" muted>
        {session.total_duration_min} min · {session.based_on.join(' · ')}
      </ProDayText>
      {session.blocks.map((b) => (
        <ProDaySurface
          key={`${b.kind}-${b.title}`}
          variant="module"
          style={[styles.block, { borderColor: colors.border }]}
        >
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
            {TRAINING_BLOCK_LABELS[b.kind]} · {b.duration_min}′
          </ProDayText>
          <ProDayText variant="body">{b.title}</ProDayText>
          <ProDayText variant="caption" muted>
            {b.focus}
          </ProDayText>
        </ProDaySurface>
      ))}

      {individual ? (
        <>
          <ProDayText variant="section" style={{ marginTop: spacing.sm }}>
            Plan individuel {premium ? 'Premium' : ''}
          </ProDayText>
          <ProDayText variant="caption" muted>
            Focus : {individual.focus.map((f) => INDIVIDUAL_SKILL_LABELS[f]).join(', ')}
          </ProDayText>
          {individual.weekly_sessions.map((s) => (
            <ProDaySurface
              key={`${s.day}-${s.title}`}
              variant="module"
              style={[styles.block, { borderColor: colors.border }]}
            >
              <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                {s.day} · {s.duration_min}′
              </ProDayText>
              <ProDayText variant="body">{s.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {s.drills.join(' · ')}
              </ProDayText>
            </ProDaySurface>
          ))}
        </>
      ) : null}
    </SmartTacticsChapterScroll>
  );
};

export const SmartDevelopmentChapter: React.FC<SmartTacticsChapterProps> = ({
  members,
  wellnessByUid,
}) => {
  const { colors } = useAppTheme();
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid).slice(0, 8),
    [members, wellnessByUid],
  );
  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Développement joueur</ProDayText>
      <ProDayText variant="caption" muted>
        Forces, faiblesses, objectifs, XP et badges — évolutifs match après match.
      </ProDayText>
      {cards.map((c) => {
        const xp = c.progress * 12 + c.form;
        const level = Math.max(1, Math.floor(xp / 100) + 1);
        return (
          <ProDaySurface key={c.uid} variant="module" style={[styles.block, { borderColor: colors.border }]}>
            <View style={styles.devHead}>
              <ProDayText variant="body" style={{ fontWeight: '800', flex: 1 }}>
                {c.display_name}
              </ProDayText>
              <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
                Niv. {level} · {xp} XP
              </ProDayText>
            </View>
            <ProDayText variant="caption" muted>
              Forces : readiness {c.readiness_pct}% · forme {c.form}
            </ProDayText>
            <ProDayText variant="caption" muted>
              Objectif semaine : maintenir Ready ≥ 75% · Challenge : +3 matches
            </ProDayText>
            <ProDayText variant="caption" style={{ color: SMART_PITCH.warm }}>
              Badges : {(c.badges.length ? c.badges : ['Prospect']).join(' · ')}
            </ProDayText>
          </ProDaySurface>
        );
      })}
    </SmartTacticsChapterScroll>
  );
};

export const SmartVideoChapter: React.FC<SmartTacticsChapterProps> = ({ profile, events }) => {
  const { colors } = useAppTheme();
  const [jobs, setJobs] = useState<string[]>([]);

  const queue = async (source: 'smartphone' | 'tripod') => {
    const job = await smartTacticsService.queueVideoJob({
      uploader_uid: profile.uid,
      club_id: profile.profile.club_id,
      event_id: events[0]?.id,
      source,
    });
    setJobs((prev) => [`${job.id} · ${source} · ${job.status}`, ...prev].slice(0, 6));
    Alert.alert(
      'Analyse vidéo (VO)',
      'Job cloud créé. Pipeline : queued → processing → ready. Sans média uploadé, des clips stubs sont générés ; ajoutez une URL storage pour enrichir.',
    );
    // Poll briefly for cloud worker status
    for (const delay of [1500, 3500, 6000]) {
      await new Promise((r) => setTimeout(r, delay));
      const fresh = await smartTacticsService.getVideoJob(job.id);
      if (!fresh) break;
      setJobs((prev) => {
        const rest = prev.filter((line) => !line.startsWith(job.id));
        const clips = fresh.highlight_clip_ids?.length
          ? ` · ${fresh.highlight_clip_ids.length} clips`
          : '';
        return [`${fresh.id} · ${source} · ${fresh.status}${clips}`, ...rest].slice(0, 6);
      });
      if (fresh.status === 'ready' || fresh.status === 'failed') break;
    }
  };

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Analyse vidéo</ProDayText>
      <ProDayText variant="caption" muted>
        Smartphone, tablette, Veo ou caméra compatible · cloud · highlights auto. Matériel jamais
        obligatoire.
      </ProDayText>
      <View style={styles.reportRow}>
        <PressableSpring onPress={() => void queue('smartphone')} scaleTo={0.96} haptic style={styles.cta}>
          <Icon name="camera" size={16} color="#0B1A12" />
          <ProDayText variant="caption" style={styles.ctaText}>
            Smartphone
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={() => void queue('tripod')} scaleTo={0.96} haptic style={styles.cta}>
          <Icon name="videocam" size={16} color="#0B1A12" />
          <ProDayText variant="caption" style={styles.ctaText}>
            Trépied
          </ProDayText>
        </PressableSpring>
      </View>
      {jobs.map((j) => (
        <ProDaySurface key={j} variant="module" style={[styles.block, { borderColor: colors.border }]}>
          <ProDayText variant="caption">{j}</ProDayText>
        </ProDaySurface>
      ))}
    </SmartTacticsChapterScroll>
  );
};

export const SmartLiveChapter: React.FC<SmartTacticsChapterProps> = ({ profile, events }) => {
  const { colors } = useAppTheme();
  const liveEvent =
    events.find((e) => e.live_state?.status === 'live' || e.live_state?.status === 'halftime') ??
    events.find((e) => e.starts_at.getTime() > Date.now() - 3 * 60 * 60 * 1000);
  const [tags, setTags] = useState<string[]>([]);
  const analytics = liveEvent ? smartTacticsService.analyticsForEvent(liveEvent) : null;

  const tag = async (kind: LiveTagKind) => {
    if (!liveEvent) {
      Alert.alert('Match', 'Aucun match live — ouvrez un événement Matchs.');
      return;
    }
    const created = await smartTacticsService.addLiveTag({
      event_id: liveEvent.id,
      kind,
      minute: liveEvent.live_state?.minute ?? 0,
      created_by: profile.uid,
      sync_to_event: true,
      actor: profile,
    });
    setTags((prev) => [
      `${LIVE_TAG_LABELS[kind]} ′${created.minute} · clip ${created.clip_id}`,
      ...prev,
    ]);
  };

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Tagging live</ProDayText>
      <ProDayText variant="caption" muted>
        Chaque tag génère un clip pour l’analyse VO.
      </ProDayText>
      <View style={styles.tagGrid}>
        {(Object.keys(LIVE_TAG_LABELS) as LiveTagKind[]).map((kind) => (
          <PressableSpring
            key={kind}
            onPress={() => void tag(kind)}
            scaleTo={0.95}
            haptic
            style={[styles.tagBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <ProDayText variant="caption" style={{ fontWeight: '900', color: SMART_PITCH.warm }}>
              {LIVE_TAG_LABELS[kind]}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>
      {analytics ? (
        <Section title="Analytics match">
          <View style={styles.metrics}>
            <SmartMetricChip label="Buts" value={`${analytics.goals}`} tone="good" />
            <SmartMetricChip label="Passes D." value={`${analytics.assists}`} tone="warm" />
            <SmartMetricChip label="Minutes" value={`${analytics.minutes}`} />
          </View>
          <ProDayText variant="caption" muted>
            Heatmaps & distance : prêts côté architecture (CV / providers futurs).
          </ProDayText>
        </Section>
      ) : null}
      {tags.map((line) => (
        <ProDayText key={line} variant="caption" style={styles.bullet}>
          • {line}
        </ProDayText>
      ))}
    </SmartTacticsChapterScroll>
  );
};

export const SmartHistoryChapter: React.FC<SmartTacticsChapterProps> = ({
  profile,
  events,
  onOpenChapter,
  onHydratePlan,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<TacticalPlan[]>([]);
  const [reports, setReports] = useState<
    Awaited<ReturnType<typeof smartTacticsService.listReports>>
  >([]);
  const clubId = profile.profile.club_id;
  const focusEvent = pickLineupTargetEvent(events) ?? events[0];

  React.useEffect(() => {
    if (!clubId) return;
    void smartTacticsService.listPlans(clubId).then(setPlans);
  }, [clubId]);

  React.useEffect(() => {
    if (!focusEvent?.id) return;
    void smartTacticsService.listReports(focusEvent.id).then(setReports);
  }, [focusEvent?.id]);

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">{t('smartTactics.chapter.history')}</ProDayText>
      <ProDayText variant="caption" muted>
        {t('smartTactics.history.body')}
      </ProDayText>
      {plans.length === 0 ? (
        <ProDayText variant="caption" muted>
          {t('smartTactics.history.empty')}
        </ProDayText>
      ) : (
        plans.map((p) => (
          <PressableSpring
            key={p.id}
            onPress={() => {
              onHydratePlan?.(p);
              onOpenChapter('board');
            }}
            scaleTo={0.98}
            haptic
          >
            <ProDaySurface variant="module" style={[styles.block, { borderColor: colors.border }]}>
              <ProDayText variant="body">{p.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {p.board.formation} · {t('smartTactics.history.openBoard')}
              </ProDayText>
            </ProDaySurface>
          </PressableSpring>
        ))
      )}

      <Section title="Rapports IA">
        {reports.length === 0 ? (
          <ProDayText variant="caption" muted>
            Aucun rapport — générez-en depuis Préparation IA.
          </ProDayText>
        ) : (
          reports.map((r) => (
            <ProDaySurface key={r.id} variant="module" style={[styles.block, { borderColor: colors.border }]}>
              <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                {r.title}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {r.summary}
              </ProDayText>
            </ProDaySurface>
          ))
        )}
        <PressableSpring onPress={() => onOpenChapter('prep')} scaleTo={0.96} haptic style={styles.link}>
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
            Ouvrir Préparation IA →
          </ProDayText>
        </PressableSpring>
      </Section>

      <Section title={t('smartTactics.section.upcoming')}>
        {events.slice(0, 6).map((e) => (
          <ProDayText key={e.id} variant="caption" muted style={styles.bullet}>
            • {e.title}
          </ProDayText>
        ))}
      </Section>
    </SmartTacticsChapterScroll>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ProDayText variant="section">{title}</ProDayText>
      {children}
    </View>
  );
}

function WidgetRow({
  title,
  cards,
  riskTitle,
  risk,
}: {
  title: string;
  cards: import('../../models/SmartTactics').SmartPlayerCardData[];
  riskTitle: string;
  risk: import('../../models/SmartTactics').SmartPlayerCardData[];
}) {
  return (
    <View style={styles.section}>
      <ProDayText variant="section">{title}</ProDayText>
      <View style={styles.cardGrid}>
        {cards.slice(0, 2).map((c) => (
          <View key={c.uid} style={styles.cardHalf}>
            <SmartPlayerCard card={c} compact />
          </View>
        ))}
      </View>
      <ProDayText variant="section">{riskTitle}</ProDayText>
      <View style={styles.cardGrid}>
        {risk.slice(0, 2).map((c) => (
          <View key={c.uid} style={styles.cardHalf}>
            <SmartPlayerCard card={c} compact />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mission: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  missionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '800',
    fontSize: 10,
  },
  missionActions: { gap: 8, marginTop: 6 },
  primaryCta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SMART_PITCH.warm,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  secondaryCta: { alignSelf: 'flex-start' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardHalf: { width: '48%', flexGrow: 1 },
  cardStack: { gap: spacing.sm },
  futRow: { gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.md },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  bullet: { lineHeight: 18 },
  section: { gap: 6, marginTop: 4 },
  link: { marginTop: 4 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SMART_PITCH.warm,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  ctaText: { color: '#0B1A12', fontWeight: '900' },
  boardHero: { gap: 4 },
  aiStrip: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 10,
  },
  aiStripTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  aiCta: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SMART_PITCH.warm,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  syncChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 200,
  },
  block: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  reportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reportBtn: {
    flexGrow: 1,
    minWidth: '22%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagBtn: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  devHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
