import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  PlayerMidSeasonReview,
  CreatePlayerMidSeasonReviewInput,
  CoachReviewObservations,
  PlayerSelfAssessment,
} from '../models/PlayerMidSeasonReview';

const COL = 'player_mid_season_reviews';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerMidSeasonReview {
  const sa = (data.self_assessment as Record<string, unknown>) ?? {};
  const cr = data.coach_review as Record<string, unknown> | undefined;

  const selfAssessment: PlayerSelfAssessment = {
    reflections: String(sa.reflections ?? ''),
    strengths: Array.isArray(sa.strengths) ? sa.strengths.map(String) : [],
    areas_to_improve: Array.isArray(sa.areas_to_improve) ? sa.areas_to_improve.map(String) : [],
    self_rating_mental: typeof sa.self_rating_mental === 'number' ? sa.self_rating_mental : undefined,
    self_rating_technical: typeof sa.self_rating_technical === 'number' ? sa.self_rating_technical : undefined,
    self_rating_physical: typeof sa.self_rating_physical === 'number' ? sa.self_rating_physical : undefined,
    submitted_at: sa.submitted_at ? toDate(sa.submitted_at) : undefined,
  };

  const coachReview: CoachReviewObservations | undefined = cr
    ? {
        coach_uid: String(cr.coach_uid ?? ''),
        coach_name: String(cr.coach_name ?? ''),
        general_feedback: String(cr.general_feedback ?? ''),
        confirmed_strengths: Array.isArray(cr.confirmed_strengths) ? cr.confirmed_strengths.map(String) : [],
        recommended_work_axes: Array.isArray(cr.recommended_work_axes) ? cr.recommended_work_axes.map(String) : [],
        agreed_goals: Array.isArray(cr.agreed_goals) ? cr.agreed_goals.map(String) : [],
        next_review_date: cr.next_review_date ? toDate(cr.next_review_date) : undefined,
        reviewed_at: cr.reviewed_at ? toDate(cr.reviewed_at) : undefined,
      }
    : undefined;

  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    season_label: String(data.season_label ?? ''),
    status: (data.status as PlayerMidSeasonReview['status']) ?? 'draft',
    self_assessment: selfAssessment,
    coach_review: coachReview,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const playerMidSeasonReviewsService = {
  /**
   * Sauvegarde un bilan côté joueur (brouillon ou soumis au coach).
   */
  async savePlayerReview(input: CreatePlayerMidSeasonReviewInput): Promise<PlayerMidSeasonReview> {
    const database = getDb();
    const now = new Date();
    const isDraft = input.is_draft !== false;

    const selfAssessmentPayload = {
      reflections: input.self_assessment.reflections.trim(),
      strengths: input.self_assessment.strengths,
      areas_to_improve: input.self_assessment.areas_to_improve,
      self_rating_mental: input.self_assessment.self_rating_mental ?? null,
      self_rating_technical: input.self_assessment.self_rating_technical ?? null,
      self_rating_physical: input.self_assessment.self_rating_physical ?? null,
      submitted_at: isDraft ? null : Timestamp.fromDate(now),
    };

    const payload: Record<string, unknown> = {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      player_uid: input.player_uid,
      player_name: input.player_name,
      season_label: input.season_label,
      status: isDraft ? 'draft' : 'submitted_by_player',
      self_assessment: selfAssessmentPayload,
      coach_review: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `rev_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    return {
      id,
      club_id: input.club_id,
      team_id: input.team_id,
      player_uid: input.player_uid,
      player_name: input.player_name,
      season_label: input.season_label,
      status: isDraft ? 'draft' : 'submitted_by_player',
      self_assessment: {
        ...input.self_assessment,
        submitted_at: isDraft ? undefined : now,
      },
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste l'historique des bilans pour un joueur.
   */
  async listForPlayer(playerUid: string, max = 10): Promise<PlayerMidSeasonReview[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Le coach complète sa revue sur le bilan du joueur.
   */
  async submitCoachReview(
    reviewId: string,
    observations: CoachReviewObservations,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, reviewId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    await updateDoc(ref, {
      status: 'completed_by_coach',
      coach_review: {
        coach_uid: observations.coach_uid,
        coach_name: observations.coach_name,
        general_feedback: observations.general_feedback.trim(),
        confirmed_strengths: observations.confirmed_strengths,
        recommended_work_axes: observations.recommended_work_axes,
        agreed_goals: observations.agreed_goals,
        next_review_date: observations.next_review_date
          ? Timestamp.fromDate(observations.next_review_date)
          : null,
        reviewed_at: serverTimestamp(),
      },
      updated_at: serverTimestamp(),
    });
  },
};
