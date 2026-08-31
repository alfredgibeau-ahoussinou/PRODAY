import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  LiveMatchTag,
  MatchTacticalReport,
  TacticalPlan,
  TeamInstructions,
  VideoAnalysisJob,
} from '../models/SmartTactics';
import { DEFAULT_TEAM_INSTRUCTIONS } from '../models/SmartTactics';
import {
  analyzeSquadForm,
  buildAiMatchPreparation,
  generateCollectiveTraining,
  generateIndividualTrainingPlan,
  generateMatchReport,
  isValidFormation,
  orderUidsByFormationPositions,
  previousResultsFromEvents,
  prepToTacticalPlan,
} from '../utils/smartTacticsEngine';
import { buildSmartPlayerCard, buildTeamTacticsDashboard } from '../utils/smartPlayerCards';
import {
  buildMatchAnalyticsFromEvent,
  createLiveMatchTag,
  createVideoAnalysisJob,
  liveTagToAction,
} from '../utils/smartTacticsVideo';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { AiMatchPreparation, MatchPhase, WellnessSignals } from '../models/SmartTactics';
import { callFunction } from '../lib/firebaseFunctions';
import { labelLocalMatchPrepBriefing } from '../utils/aiUxHonesty';
import { teamEventsService } from './teamEvents.service';

const PLANS_COL = 'smart_tactics_plans';
const REPORTS_COL = 'smart_tactics_reports';
const TAGS_COL = 'smart_tactics_live_tags';
const VIDEO_COL = 'smart_tactics_video_jobs';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapPlan(id: string, data: Record<string, unknown>): TacticalPlan {
  const board = (data.board as TacticalPlan['board']) ?? { formation: '4-3-3', slots: [] };
  return {
    id,
    club_id: String(data.club_id ?? ''),
    title: String(data.title ?? 'Plan tactique'),
    opponent_name: data.opponent_name ? String(data.opponent_name) : undefined,
    event_id: data.event_id ? String(data.event_id) : undefined,
    board,
    instructions: (data.instructions as TeamInstructions) ?? DEFAULT_TEAM_INSTRUCTIONS,
    set_pieces: Array.isArray(data.set_pieces) ? (data.set_pieces as TacticalPlan['set_pieces']) : [],
    strategy_notes: data.strategy_notes ? String(data.strategy_notes) : undefined,
    opponent_analysis: data.opponent_analysis as TacticalPlan['opponent_analysis'],
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    created_by: String(data.created_by ?? ''),
    archived: Boolean(data.archived),
  };
}

export const smartTacticsService = {
  async listPlans(clubId: string, max = 20): Promise<TacticalPlan[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, PLANS_COL),
          where('club_id', '==', clubId),
          orderBy('updated_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapPlan(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async savePlan(input: {
    club_id: string;
    title: string;
    created_by: string;
    board: TacticalPlan['board'];
    instructions?: TeamInstructions;
    opponent_name?: string;
    event_id?: string;
    strategy_notes?: string;
    set_pieces?: TacticalPlan['set_pieces'];
  }): Promise<TacticalPlan | null> {
    if (!isValidFormation(input.board.formation)) {
      throw new Error('Formation invalide');
    }
    if (!isFirebaseConfigured()) {
      const now = new Date();
      return {
        id: `local_${now.getTime()}`,
        club_id: input.club_id,
        title: input.title,
        opponent_name: input.opponent_name,
        event_id: input.event_id,
        board: input.board,
        instructions: input.instructions ?? DEFAULT_TEAM_INSTRUCTIONS,
        set_pieces: input.set_pieces ?? [],
        strategy_notes: input.strategy_notes,
        created_at: now,
        updated_at: now,
        created_by: input.created_by,
      };
    }
    const database = getDb();
    if (!database) return null;
    const ref = await addDoc(collection(database, PLANS_COL), {
      club_id: input.club_id,
      title: input.title,
      opponent_name: input.opponent_name ?? null,
      event_id: input.event_id ?? null,
      board: input.board,
      instructions: input.instructions ?? DEFAULT_TEAM_INSTRUCTIONS,
      set_pieces: input.set_pieces ?? [],
      strategy_notes: input.strategy_notes ?? null,
      created_by: input.created_by,
      archived: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return {
      id: ref.id,
      club_id: input.club_id,
      title: input.title,
      opponent_name: input.opponent_name,
      event_id: input.event_id,
      board: input.board,
      instructions: input.instructions ?? DEFAULT_TEAM_INSTRUCTIONS,
      set_pieces: input.set_pieces ?? [],
      strategy_notes: input.strategy_notes,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: input.created_by,
    };
  },

  async listReports(eventId: string, max = 10): Promise<MatchTacticalReport[]> {
    if (!isFirebaseConfigured() || !eventId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, REPORTS_COL),
          where('event_id', '==', eventId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          event_id: String(data.event_id ?? ''),
          club_id: data.club_id ? String(data.club_id) : undefined,
          phase: data.phase as MatchPhase,
          title: String(data.title ?? ''),
          summary: String(data.summary ?? ''),
          strengths: (data.strengths as string[]) ?? [],
          weaknesses: (data.weaknesses as string[]) ?? [],
          adjustments: (data.adjustments as string[]) ?? [],
          key_players: (data.key_players as string[]) ?? [],
          risks: (data.risks as string[]) ?? [],
          created_at: toDate(data.created_at),
          created_by: String(data.created_by ?? ''),
          ai_fallback: Boolean(data.ai_fallback),
        };
      });
    } catch {
      return [];
    }
  },

  async persistReport(report: MatchTacticalReport): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await addDoc(collection(database, REPORTS_COL), {
      ...report,
      created_at: serverTimestamp(),
    });
  },

  buildDashboard(members: User[], events: TeamEvent[], wellnessByUid?: Record<string, WellnessSignals>) {
    return buildTeamTacticsDashboard({ members, events, wellnessByUid });
  },

  buildCards(members: User[], wellnessByUid?: Record<string, WellnessSignals>) {
    return members.map((m) => buildSmartPlayerCard(m, wellnessByUid?.[m.uid]));
  },

  prepareMatch(
    members: User[],
    opponent_name?: string,
    preferred_formation?: string,
    wellnessByUid?: Record<string, WellnessSignals>,
    previous_results?: { goals_for: number; goals_against: number }[],
  ) {
    const cards = members.map((m) => buildSmartPlayerCard(m, wellnessByUid?.[m.uid]));
    return buildAiMatchPreparation({
      cards,
      opponent_name,
      preferred_formation,
      previous_results,
    });
  },

  /** Prep locale enrichie avec l’historique des scores du club. */
  prepareMatchFromEvents(
    members: User[],
    events: TeamEvent[],
    opts?: {
      opponent_name?: string;
      preferred_formation?: string;
      wellnessByUid?: Record<string, WellnessSignals>;
    },
  ) {
    const opponent = opts?.opponent_name;
    const previous_results = previousResultsFromEvents(events, opponent);
    return this.prepareMatch(
      members,
      opponent,
      opts?.preferred_formation,
      opts?.wellnessByUid,
      previous_results,
    );
  },

  /**
   * Préparation assistée Mistral (cloud) avec fallback local automatique.
   */
  async prepareMatchWithAi(input: {
    club_id: string;
    members: User[];
    events: TeamEvent[];
    opponent_name?: string;
    preferred_formation?: string;
    wellnessByUid?: Record<string, WellnessSignals>;
    coach_notes?: string;
    event_id?: string;
  }): Promise<AiMatchPreparation> {
    const cards = input.members.map((m) =>
      buildSmartPlayerCard(m, input.wellnessByUid?.[m.uid]),
    );
    const formReport = analyzeSquadForm(cards);
    const formNotes = [
      formReport.summary_fr,
      ...formReport.lines,
      formReport.in_form.length
        ? `En forme: ${formReport.in_form
            .slice(0, 5)
            .map((c) => `${c.display_name}(${c.form})`)
            .join(', ')}`
        : '',
      formReport.at_risk.length
        ? `À risque: ${formReport.at_risk
            .slice(0, 5)
            .map((c) => `${c.display_name}(${c.form}/${c.readiness_pct}%)`)
            .join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const local = this.prepareMatchFromEvents(input.members, input.events, {
      opponent_name: input.opponent_name,
      preferred_formation: input.preferred_formation,
      wellnessByUid: input.wellnessByUid,
    });

    const previous_results = previousResultsFromEvents(input.events, input.opponent_name);
    const coach_notes = [input.coach_notes, `Analyse forme ProDay: ${formNotes}`]
      .filter(Boolean)
      .join('\n');

    try {
      const remote = await callFunction<
        {
          club_id: string;
          event_id?: string;
          opponent_name?: string;
          preferred_formation?: string;
          coach_notes?: string;
          previous_results: { goals_for: number; goals_against: number }[];
          roster: {
            uid: string;
            name: string;
            position?: string;
            readiness?: number;
            form?: number;
            availability?: string;
          }[];
        },
        {
          source: 'mistral';
          fallback: boolean;
          formation_recommendation: string;
          starting_xi_uids: string[];
          tactical_suggestions: string[];
          physical_alerts: string[];
          risk_analysis: string[];
          briefing_fr?: string;
          opponent: AiMatchPreparation['opponent'];
        }
      >('smartTacticsMatchPrep', {
        club_id: input.club_id,
        event_id: input.event_id,
        opponent_name: input.opponent_name,
        preferred_formation: input.preferred_formation,
        coach_notes,
        previous_results,
        roster: cards.map((c) => ({
          uid: c.uid,
          name: c.display_name,
          position: c.position,
          readiness: c.readiness_pct,
          form: c.form,
          availability: c.availability,
        })),
      });

      const formation =
        remote.formation_recommendation || local.formation_recommendation;
      const xiRaw =
        remote.starting_xi_uids?.length >= 8
          ? remote.starting_xi_uids
          : local.starting_xi_uids;
      const xi = orderUidsByFormationPositions(xiRaw, cards, formation);

      return {
        opponent: remote.opponent ?? local.opponent,
        formation_recommendation: formation,
        starting_xi_uids: xi,
        tactical_suggestions: [
          formReport.summary_fr,
          ...(remote.tactical_suggestions?.length
            ? remote.tactical_suggestions
            : local.tactical_suggestions),
        ].slice(0, 8),
        physical_alerts:
          remote.physical_alerts?.length ? remote.physical_alerts : local.physical_alerts,
        risk_analysis:
          remote.risk_analysis?.length ? remote.risk_analysis : local.risk_analysis,
        fallback: Boolean(remote.fallback) && previous_results.length === 0,
        source: 'mistral',
        briefing_fr:
          remote.briefing_fr ||
          local.briefing_fr ||
          `${formReport.summary_fr} XI ${formation}.`,
      };
    } catch (e) {
      if (__DEV__) {
        console.warn('[smartTactics] prepareMatchWithAi fallback', e);
      }
      const reason = e instanceof Error ? e.message : undefined;
      return {
        ...local,
        fallback: true,
        source: 'local',
        briefing_fr: labelLocalMatchPrepBriefing(local.briefing_fr, reason),
      };
    }
  },

  buildPlanFromPrep: prepToTacticalPlan,

  generateTraining(opts: Parameters<typeof generateCollectiveTraining>[0]) {
    return generateCollectiveTraining(opts);
  },

  generatePlayerPlan(player: User, premium?: boolean) {
    return generateIndividualTrainingPlan({ player, premium });
  },

  generateReport(
    event: TeamEvent,
    phase: MatchPhase,
    author_uid: string,
    members: User[],
    wellnessByUid?: Record<string, WellnessSignals>,
    events: TeamEvent[] = [],
  ) {
    const prep = this.prepareMatchFromEvents(members, events.length ? events : [event], {
      opponent_name: event.live_state?.opponent_name,
      wellnessByUid,
    });
    return generateMatchReport({ event, phase, author_uid, prep });
  },

  analyticsForEvent(event: TeamEvent) {
    return buildMatchAnalyticsFromEvent(event);
  },

  async addLiveTag(
    input: Parameters<typeof createLiveMatchTag>[0] & {
      sync_to_event?: boolean;
      actor?: User;
    },
  ): Promise<LiveMatchTag> {
    const tag = createLiveMatchTag(input);
    if (!isFirebaseConfigured()) return tag;
    const database = getDb();
    if (!database) return tag;
    try {
      const ref = await addDoc(collection(database, TAGS_COL), {
        ...tag,
        created_at: serverTimestamp(),
      });
      const saved = { ...tag, id: ref.id };
      if (input.sync_to_event && input.actor) {
        const action = liveTagToAction(saved);
        if (action) {
          await teamEventsService
            .addLiveAction(
              input.event_id,
              {
                type: action.type,
                player_uid: action.player_uid,
                player_name: action.player_name,
                minute: action.minute,
              },
              { user: input.actor },
            )
            .catch(() => undefined);
        }
      }
      return saved;
    } catch {
      return tag;
    }
  },

  async queueVideoJob(input: Parameters<typeof createVideoAnalysisJob>[0]): Promise<VideoAnalysisJob> {
    const job = createVideoAnalysisJob(input);
    if (!isFirebaseConfigured()) return job;
    const database = getDb();
    if (!database) return job;
    try {
      const ref = await addDoc(collection(database, VIDEO_COL), {
        ...job,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return { ...job, id: ref.id };
    } catch {
      return job;
    }
  },

  async getVideoJob(jobId: string): Promise<VideoAnalysisJob | null> {
    if (!isFirebaseConfigured() || !jobId) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const snap = await getDoc(doc(database, VIDEO_COL, jobId));
      if (!snap.exists()) return null;
      const data = snap.data() as Record<string, unknown>;
      return {
        id: snap.id,
        club_id: data.club_id ? String(data.club_id) : undefined,
        event_id: data.event_id ? String(data.event_id) : undefined,
        uploader_uid: String(data.uploader_uid ?? ''),
        source: (data.source as VideoAnalysisJob['source']) ?? 'smartphone',
        local_uri: data.local_uri ? String(data.local_uri) : undefined,
        storage_path: data.storage_path ? String(data.storage_path) : undefined,
        status: (data.status as VideoAnalysisJob['status']) ?? 'queued',
        duration_sec: typeof data.duration_sec === 'number' ? data.duration_sec : undefined,
        highlight_clip_ids: Array.isArray(data.highlight_clip_ids)
          ? (data.highlight_clip_ids as string[])
          : [],
        cv_ready: Boolean(data.cv_ready),
        processing_note: data.processing_note ? String(data.processing_note) : undefined,
        created_at: toDate(data.created_at),
        updated_at: toDate(data.updated_at),
        error_message: data.error_message ? String(data.error_message) : undefined,
      };
    } catch {
      return null;
    }
  },

  async markVideoProcessing(jobId: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, VIDEO_COL, jobId), {
      status: 'processing',
      updated_at: serverTimestamp(),
    });
  },
};
