import type {
  User,
  UserRole,
  VerificationStatus,
  Gender,
  GeoPoint,
  WorkExperience,
  DiplomaRecord,
  ProfileReview,
} from '../models/User';
import type { ParentalSettings } from '../models/ParentalSettings';
import { normalizeAppSpace, type AppSpaceId } from '../models/AppSpace';
import { normalizeStoredProductLine } from '../models/ProductLine';
import { canonicalizeUserProductLine } from '../utils/productLineResolution';
import type { PlayerVerificationState } from '../models/User';
import type { RecruitmentPost, Application } from '../models/Player';
import type {
  ScoutReport,
  ScoutReportAttribute,
  ScoutReportRecommendation,
  ScoutReportVisibility,
} from '../models/ScoutReport';
import { legacyStatusToPipelineStage } from '../utils/clubApplicationPipeline';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type {
  Tournament,
  TournamentFixture,
  TournamentPool,
  TournamentRegistration,
  PoolStandingRow,
} from '../models/Tournament';
import type {
  Competition,
  CompetitionFixture,
  CompetitionSeason,
  CompetitionStandingsDoc,
  CompetitionTeam,
  PlayerCompetitionStats,
  CompetitionRules,
  CompetitionFixtureStatus,
} from '../models/Competition';
import { DEFAULT_COMPETITION_RULES } from '../models/Competition';
import type {
  TeamEvent,
  RsvpStatus,
  AttendanceMark,
  CarpoolSlot,
  CarpoolPassenger,
  PlayerMatchSheetStat,
  TeamEventType,
  EventLineup,
  LiveMatchAction,
  LiveActionType,
} from '../models/TeamEvent';
import { isCarpoolVehicleType } from '../models/CarpoolVehicle';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import type { StageOffer, StageApplication } from '../models/Stage';
import type { MedicalAppointment, MedicalAppointmentStatus } from '../models/MedicalAppointment';
import type { PlayerActivity, PlayerActivitySource, PlayerActivityType } from '../models/PlayerActivity';
import type { Team } from '../models/Team';
import type { Membership } from '../models/Membership';
import { PERFORMANCE_TAGS, type PerformanceTag } from '../utils/performanceTags';

function toDate(value: unknown): Date {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
}

function toGeoPoint(value: unknown): GeoPoint | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'latitude' in value &&
    'longitude' in value
  ) {
    const g = value as { latitude: number; longitude: number };
    return { latitude: g.latitude, longitude: g.longitude };
  }
  return undefined;
}

/** Firestore `profile.gender` — enum stable: men | women | minor. */
function toProfileGender(value: unknown): Gender | undefined {
  if (value === 'men' || value === 'women' || value === 'minor') return value;
  return undefined;
}

export function userFromFirestore(uid: string, data: Record<string, unknown>): User {
  const profile = (data.profile as Record<string, unknown>) ?? {};

  return {
    uid,
    display_name: String(data.display_name ?? data.displayName ?? ''),
    email: String(data.email ?? ''),
    phone: data.phone as string | undefined,
    other_contact: data.other_contact as string | undefined,
    avatar_url: (data.avatar_url ?? data.avatarUrl) as string | undefined,
    role: (data.role as UserRole) ?? 'player',
    email_verified: Boolean(data.email_verified ?? data.emailVerified ?? false),
    onboarding_documents_submitted: Boolean(
      data.onboarding_documents_submitted ?? data.onboardingDocumentsSubmitted ?? false
    ),
    is_verified: Boolean(data.is_verified ?? data.isVerified ?? false),
    verification_status:
      (data.verification_status as VerificationStatus) ??
      (data.verificationStatus as VerificationStatus) ??
      'NOT_REQUIRED',
    verification_date: data.verification_date
      ? toDate(data.verification_date)
      : undefined,
    location: toGeoPoint(data.location),
    city: data.city as string | undefined,
    department: data.department as string | undefined,
    profile: {
      position: profile.position as string | undefined,
      category: profile.category as string | undefined,
      level: profile.level as string | undefined,
      gender: toProfileGender(profile.gender),
      strong_foot: profile.strong_foot as User['profile']['strong_foot'],
      jersey_number:
        profile.jersey_number != null ? Number(profile.jersey_number) : undefined,
      height_cm: profile.height_cm as number | undefined,
      weight_kg: profile.weight_kg as number | undefined,
      highlight_video_urls: profile.highlight_video_urls as string[] | undefined,
      gallery_urls: profile.gallery_urls as string[] | undefined,
      /** Source de vérité pour les univers joueur (-13 / ado / adulte). */
      birth_date:
        typeof profile.birth_date === 'string' && profile.birth_date.trim()
          ? profile.birth_date.trim()
          : undefined,
      age: profile.age as number | undefined,
      years_experience: profile.years_experience as number | undefined,
      availability: profile.availability as User['profile']['availability'],
      season_stats: profile.season_stats as User['profile']['season_stats'],
      diploma: profile.diploma as string | undefined,
      license_number: profile.license_number as string | undefined,
      job_title: profile.job_title as string | undefined,
      medical_specialty: profile.medical_specialty as string | undefined,
      booking_enabled: profile.booking_enabled as boolean | undefined,
      cal_com_username: profile.cal_com_username as string | undefined,
      booking_url: profile.booking_url as string | undefined,
      consultation_duration_min: profile.consultation_duration_min as number | undefined,
      weekly_availability: profile.weekly_availability as User['profile']['weekly_availability'],
      specialties: profile.specialties as string[] | undefined,
      experiences: profile.experiences as WorkExperience[] | undefined,
      diplomas_list: profile.diplomas_list as DiplomaRecord[] | undefined,
      reviews: profile.reviews as ProfileReview[] | undefined,
      rating: profile.rating as number | undefined,
      bio: profile.bio as string | undefined,
      club_id: profile.club_id as string | undefined,
      achievements: profile.achievements as string[] | undefined,
    },
    documents: [],
    created_at: toDate(data.created_at ?? data.createdAt),
    updated_at: toDate(data.updated_at ?? data.updatedAt),
    last_active_at: data.last_active_at
      ? toDate(data.last_active_at)
      : undefined,
    is_active: data.is_active !== false && data.isActive !== false,
    fcm_token: data.fcm_token as string | undefined,
    notification_radius_km: data.notification_radius_km as number | undefined,
    notification_preferences: data.notification_preferences as User['notification_preferences'],
    parental_settings: data.parental_settings as ParentalSettings | undefined,
    parental_runtime: data.parental_runtime as User['parental_runtime'],
    app_space: data.app_space
      ? normalizeAppSpace(String(data.app_space))
      : undefined,
    product_line: (() => {
      const role = (data.role as UserRole) ?? 'player';
      const normalized =
        normalizeStoredProductLine(data.product_line != null ? String(data.product_line) : null) ??
        undefined;
      return normalized ? canonicalizeUserProductLine(normalized, role) : undefined;
    })(),
    player_verification: data.player_verification as PlayerVerificationState | undefined,
    player_level: data.player_level as User['player_level'],
    club_certification_verified:
      data.club_certification_verified === true
        ? true
        : data.club_certification_verified === false
          ? false
          : undefined,
    contact_privacy: data.contact_privacy as User['contact_privacy'],
    parent_of: Array.isArray(data.parent_of)
      ? (data.parent_of as unknown[]).map((id) => String(id)).filter(Boolean)
      : undefined,
    agent_launch_offer:
      data.agent_launch_offer === true
        ? true
        : data.agent_launch_offer === false
          ? false
          : undefined,
    subscription_tier:
      data.subscription_tier === 'pro' ? 'pro' : data.subscription_tier === 'free' ? 'free' : undefined,
    subscription_plan_id: data.subscription_plan_id as string | undefined,
    subscription_status: data.subscription_status as User['subscription_status'],
    subscription_period_end: data.subscription_period_end
      ? toDate(data.subscription_period_end)
      : undefined,
    sponsor_tier: data.sponsor_tier as User['sponsor_tier'],
    sponsor_territorial_approved_at: data.sponsor_territorial_approved_at
      ? toDate(data.sponsor_territorial_approved_at)
      : undefined,
    sponsor_approved: data.sponsor_approved === true ? true : data.sponsor_approved === false ? false : undefined,
    referral_code: data.referral_code ? String(data.referral_code) : undefined,
    referred_by_uid: data.referred_by_uid ? String(data.referred_by_uid) : undefined,
    referred_by_code: data.referred_by_code ? String(data.referred_by_code) : undefined,
    referral_progress:
      typeof data.referral_progress === 'number' ? data.referral_progress : undefined,
    referral_total_subscribed:
      typeof data.referral_total_subscribed === 'number'
        ? data.referral_total_subscribed
        : undefined,
    referral_rewards_earned:
      typeof data.referral_rewards_earned === 'number'
        ? data.referral_rewards_earned
        : undefined,
  };
}

export function teamFromFirestore(id: string, data: Record<string, unknown>): Team {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    name: String(data.name ?? ''),
    category: data.category as string | undefined,
    gender_scope: (data.gender_scope as Team['gender_scope']) ?? 'unspecified',
    coach_uids: (data.coach_uids as string[]) ?? [],
    season_id: data.season_id as string | undefined,
    is_default: Boolean(data.is_default),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export function membershipFromFirestore(
  id: string,
  data: Record<string, unknown>
): Membership {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: String(data.team_id ?? ''),
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    status: (data.status as Membership['status']) ?? 'pending',
    requested_at: toDate(data.requested_at),
    validated_at: data.validated_at ? toDate(data.validated_at) : undefined,
    validated_by_uid: data.validated_by_uid as string | undefined,
    invited_by_uid: data.invited_by_uid as string | undefined,
    license_number: data.license_number as string | undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export function applicationFromFirestore(
  id: string,
  data: Record<string, unknown>
): Application {
  const status = (data.status as Application['status']) ?? 'PENDING';
  const pipelineStage =
    (data.pipeline_stage as Application['pipeline_stage'] | undefined) ??
    legacyStatusToPipelineStage(status);
  return {
    id,
    post_id: String(data.post_id ?? ''),
    post_author_uid: data.post_author_uid as string | undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: data.player_name as string | undefined,
    cover_letter: String(data.cover_letter ?? ''),
    cv_pdf_url: String(data.cv_pdf_url ?? ''),
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
    status,
    pipeline_stage: pipelineStage,
    priority: data.priority as Application['priority'] | undefined,
    club_notes: data.club_notes as string | undefined,
    trial_date: data.trial_date ? toDate(data.trial_date) : undefined,
    rejection_reason: data.rejection_reason as string | undefined,
    shared_documents: Array.isArray(data.shared_documents)
      ? (data.shared_documents as Record<string, unknown>[])
          .map((row) => {
            if (!row?.url || !row?.id) return null;
            return {
              id: String(row.id),
              label: String(row.label ?? 'Document'),
              url: String(row.url),
              uploaded_by: String(row.uploaded_by ?? ''),
              created_at: row.created_at ? toDate(row.created_at) : new Date(),
              kind: row.kind as
                | 'cv'
                | 'license'
                | 'medical'
                | 'parental'
                | 'other'
                | undefined,
            };
          })
          .filter((d): d is NonNullable<typeof d> => d != null)
      : undefined,
  };
}

export function scoutReportFromFirestore(
  id: string,
  data: Record<string, unknown>
): ScoutReport {
  const attributesRaw = Array.isArray(data.attributes) ? data.attributes : [];
  const attributes: ScoutReportAttribute[] = [];
  for (const raw of attributesRaw) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const rating = typeof row.rating === 'number' ? row.rating : Number(row.rating);
    if (!row.id || !Number.isFinite(rating)) continue;
    attributes.push({
      id: String(row.id) as ScoutReportAttribute['id'],
      rating,
      ...(typeof row.note === 'string' ? { note: row.note } : {}),
    });
  }

  return {
    id,
    player_uid: String(data.player_uid ?? ''),
    author_uid: String(data.author_uid ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    match_event_id: data.match_event_id ? String(data.match_event_id) : undefined,
    application_id: data.application_id ? String(data.application_id) : undefined,
    pipeline_stage: data.pipeline_stage as ScoutReport['pipeline_stage'],
    title: String(data.title ?? 'Rapport de scouting'),
    observed_at: toDate(data.observed_at),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    attributes,
    overall_rating:
      typeof data.overall_rating === 'number' ? data.overall_rating : Number(data.overall_rating) || 0,
    recommendation: (data.recommendation as ScoutReportRecommendation) ?? 'need_more_data',
    summary: String(data.summary ?? ''),
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.map(String) : [],
    media_urls: Array.isArray(data.media_urls) ? data.media_urls.map(String) : undefined,
    visibility: (data.visibility as ScoutReportVisibility) ?? 'club',
    opportunity_score_snapshot:
      typeof data.opportunity_score_snapshot === 'number'
        ? data.opportunity_score_snapshot
        : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
  };
}

export function recruitmentPostFromFirestore(
  id: string,
  data: Record<string, unknown>
): RecruitmentPost {
  return {
    id,
    author_uid: data.author_uid as string | undefined,
    club_id: String(data.club_id ?? ''),
    club_name: String(data.club_name ?? ''),
    title: String(data.title ?? ''),
    position: String(data.position ?? ''),
    category: String(data.category ?? ''),
    level: String(data.level ?? ''),
    city: String(data.city ?? ''),
    location: toGeoPoint(data.location),
    description: String(data.description ?? ''),
    created_at: toDate(data.created_at),
    status: (data.status as RecruitmentPost['status']) ?? 'OPEN',
    target_space: data.target_space as RecruitmentPost['target_space'],
  };
}

export function teamEventFromFirestore(
  id: string,
  data: Record<string, unknown>
): TeamEvent {
  const rsvpsRaw = (data.rsvps as Record<string, string>) ?? {};
  const rsvps: Record<string, RsvpStatus> = {};
  for (const [uid, status] of Object.entries(rsvpsRaw)) {
    if (['pending', 'yes', 'no', 'maybe'].includes(status)) {
      rsvps[uid] = status as RsvpStatus;
    }
  }

  const marksRaw = (data.attendance_marks as Record<string, string>) ?? {};
  const attendance_marks: Record<string, AttendanceMark> = {};
  for (const [uid, mark] of Object.entries(marksRaw)) {
    if (['present', 'late', 'excused', 'absent'].includes(mark)) {
      attendance_marks[uid] = mark as AttendanceMark;
    }
  }

  return {
    id,
    title: String(data.title ?? ''),
    description: data.description as string | undefined,
    event_type: (data.event_type as TeamEventType) ?? 'other',
    organizer_uid: String(data.organizer_uid ?? ''),
    organizer_name: String(data.organizer_name ?? ''),
    club_id: data.club_id as string | undefined,
    club_name: data.club_name as string | undefined,
    tournament_id: data.tournament_id as string | undefined,
    friendly_match_id: data.friendly_match_id as string | undefined,
    competition_fixture_id: data.competition_fixture_id as string | undefined,
    starts_at: toDate(data.starts_at),
    ends_at: data.ends_at ? toDate(data.ends_at) : undefined,
    city: String(data.city ?? ''),
    location_label: data.location_label as string | undefined,
    invitee_uids: (data.invitee_uids as string[]) ?? [],
    rsvps,
    rsvp_notes: (data.rsvp_notes as Record<string, string> | undefined) ?? {},
    attendance_marks,
    max_participants: data.max_participants as number | undefined,
    categories: (data.categories as string[]) ?? [],
    reminder_hours_before: data.reminder_hours_before as number | undefined,
    last_reminder_at: data.last_reminder_at
      ? toDate(data.last_reminder_at)
      : undefined,
    auto_reminder_sent_at: data.auto_reminder_sent_at
      ? toDate(data.auto_reminder_sent_at)
      : undefined,
    lineup: data.lineup as EventLineup | undefined,
    live_state: mapMatchLiveState(data.live_state),
    live_actions: mapLiveActions(data.live_actions),
    player_match_stats: mapPlayerMatchStats(data.player_match_stats),
    stats_applied_at: data.stats_applied_at
      ? toDate(data.stats_applied_at)
      : undefined,
    match_report_finalized_at: data.match_report_finalized_at
      ? toDate(data.match_report_finalized_at)
      : undefined,
    event_tasks: mapEventTasks(data.event_tasks),
    session_plan: mapSessionPlan(data.session_plan),
    carpool_slots: mapCarpoolSlots(data.carpool_slots),
    carpool_messages: mapCarpoolMessages(data.carpool_messages),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function mapEventTasks(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item) => {
    const t = item as Record<string, unknown>;
    return {
      id: String(t.id ?? ''),
      kind: (t.kind as import('../models/TeamEvent').EventTaskKind) ?? 'other',
      label: String(t.label ?? ''),
      assignee_uids: (t.assignee_uids as string[]) ?? [],
      done: t.done === true,
    };
  });
}

function mapSessionPlan(raw: unknown): import('../models/CoachEvaluation').TrainingSessionPlan | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  return {
    focus: o.focus ? String(o.focus) : undefined,
    notes: o.notes ? String(o.notes) : undefined,
    duration_min: typeof o.duration_min === 'number' ? o.duration_min : undefined,
    objective_ids: Array.isArray(o.objective_ids)
      ? o.objective_ids.map(String)
      : undefined,
  };
}

function mapCarpoolTripStatus(
  raw: unknown,
): import('../models/CarpoolLiveTrip').CarpoolTripStatus | undefined {
  if (raw === 'scheduled' || raw === 'in_progress' || raw === 'completed') return raw;
  return undefined;
}

function mapCarpoolSlots(raw: unknown): CarpoolSlot[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item) => {
    const s = item as Record<string, unknown>;
    const passengersRaw = s.passengers;
    return {
      driver_uid: String(s.driver_uid ?? ''),
      driver_name: String(s.driver_name ?? ''),
      seats: typeof s.seats === 'number' ? s.seats : undefined,
      vehicle_type: isCarpoolVehicleType(s.vehicle_type) ? s.vehicle_type : undefined,
      meeting_time: s.meeting_time ? String(s.meeting_time) : undefined,
      meeting_place: s.meeting_place ? String(s.meeting_place) : undefined,
      meeting_location: toGeoPoint(s.meeting_location),
      notes: s.notes ? String(s.notes) : undefined,
      volunteered: s.volunteered === true,
      trip_status: mapCarpoolTripStatus(s.trip_status),
      passengers: Array.isArray(passengersRaw)
        ? passengersRaw.map((p): CarpoolPassenger => {
            const row = p as Record<string, unknown>;
            const status: CarpoolPassenger['status'] =
              row.status === 'pending' ||
              row.status === 'confirmed' ||
              row.status === 'rejected' ||
              row.status === 'cancelled'
                ? (row.status as CarpoolPassenger['status'])
                : undefined;
            return {
              uid: String(row.uid ?? ''),
              name: String(row.name ?? ''),
              pickup_place: row.pickup_place ? String(row.pickup_place) : undefined,
              pickup_location: toGeoPoint(row.pickup_location),
              status,
            };
          })
        : undefined,
    };
  });
}

function mapCarpoolMessages(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item) => {
    const m = item as Record<string, unknown>;
    return {
      id: String(m.id ?? ''),
      author_uid: String(m.author_uid ?? ''),
      author_name: String(m.author_name ?? ''),
      body: String(m.body ?? ''),
      created_at: toDate(m.created_at),
    };
  });
}

function mapMatchLiveState(raw: unknown): import('../models/TeamEvent').MatchLiveState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const s = raw as Record<string, unknown>;
  const status = String(s.status ?? 'scheduled');
  if (!['scheduled', 'live', 'halftime', 'finished'].includes(status)) return undefined;
  return {
    status: status as import('../models/TeamEvent').MatchLiveStatus,
    minute: typeof s.minute === 'number' ? s.minute : undefined,
    home_score: Number(s.home_score ?? 0),
    away_score: Number(s.away_score ?? 0),
    opponent_name: s.opponent_name ? String(s.opponent_name) : undefined,
    home_label: s.home_label ? String(s.home_label) : undefined,
  };
}

function mapLiveActions(raw: unknown): LiveMatchAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item, i) => {
    const a = item as Record<string, unknown>;
    return {
      id: String(a.id ?? `a${i}`),
      type: (a.type as LiveActionType) ?? 'goal',
      player_uid: String(a.player_uid ?? ''),
      player_name: String(a.player_name ?? ''),
      minute: Number(a.minute ?? 0),
      created_at: toDate(a.created_at),
    };
  });
}

function mapPlayerMatchStats(
  raw: unknown
): Record<string, PlayerMatchSheetStat> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, PlayerMatchSheetStat> = {};
  for (const [uid, value] of Object.entries(raw as Record<string, unknown>)) {
    const s = value as Record<string, unknown>;
    out[uid] = {
      uid,
      player_name: String(s.player_name ?? ''),
      minutes_played:
        typeof s.minutes_played === 'number' ? s.minutes_played : undefined,
      rating: typeof s.rating === 'number' ? s.rating : undefined,
      goals: typeof s.goals === 'number' ? s.goals : undefined,
      assists: typeof s.assists === 'number' ? s.assists : undefined,
      yellow_cards:
        typeof s.yellow_cards === 'number' ? s.yellow_cards : undefined,
      red_cards: typeof s.red_cards === 'number' ? s.red_cards : undefined,
    };
  }
  return out;
}

export function friendlyMatchFromFirestore(
  id: string,
  data: Record<string, unknown>
): FriendlyMatch {
  const rawCounter = data.counter_proposal as Record<string, unknown> | undefined;
  return {
    id,
    requester_uid: data.requester_uid as string | undefined,
    requester_club_id: String(data.requester_club_id ?? ''),
    requester_club_name: String(data.requester_club_name ?? ''),
    opponent_club_id: data.opponent_club_id as string | undefined,
    opponent_club_name: data.opponent_club_name as string | undefined,
    requester_team_id: data.requester_team_id
      ? String(data.requester_team_id)
      : undefined,
    requester_team_label: data.requester_team_label
      ? String(data.requester_team_label)
      : undefined,
    location: toGeoPoint(data.location),
    city: String(data.city ?? ''),
    date: toDate(data.date),
    time_label: data.time_label as string | undefined,
    category: String(data.category ?? ''),
    level: String(data.level ?? ''),
    level_type: (data.level_type as FriendlyMatch['level_type']) ?? 'loisir',
    match_kind: (data.match_kind as FriendlyMatch['match_kind']) ?? 'amical',
    venue_side: (data.venue_side as FriendlyMatch['venue_side']) ?? undefined,
    has_pitch: Boolean(data.has_pitch),
    message: data.message as string | undefined,
    status: (data.status as FriendlyMatch['status']) ?? 'OPEN',
    counter_proposal: rawCounter
      ? {
          proposed_by_club_id: String(rawCounter.proposed_by_club_id ?? ''),
          proposed_by_club_name: String(rawCounter.proposed_by_club_name ?? ''),
          date: toDate(rawCounter.date),
          time_label: String(rawCounter.time_label ?? ''),
          city: String(rawCounter.city ?? ''),
          venue_side: rawCounter.venue_side as FriendlyMatch['venue_side'],
          team_label: rawCounter.team_label
            ? String(rawCounter.team_label)
            : undefined,
          message: rawCounter.message ? String(rawCounter.message) : undefined,
          created_at: toDate(rawCounter.created_at),
        }
      : undefined,
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

function mapTournamentRegistration(raw: Record<string, unknown>): TournamentRegistration {
  return {
    id: String(raw.id ?? ''),
    club_id: String(raw.club_id ?? ''),
    club_name: String(raw.club_name ?? ''),
    captain_uid: String(raw.captain_uid ?? ''),
    captain_name: String(raw.captain_name ?? ''),
    player_uids: Array.isArray(raw.player_uids) ? raw.player_uids.map(String) : [],
    player_names: Array.isArray(raw.player_names) ? raw.player_names.map(String) : [],
    paid: raw.paid === true,
    registered_at: toDate(raw.registered_at),
    stripe_checkout_session_id: raw.stripe_checkout_session_id
      ? String(raw.stripe_checkout_session_id)
      : undefined,
    paid_at: raw.paid_at ? toDate(raw.paid_at) : undefined,
  };
}

function mapTournamentFixture(raw: Record<string, unknown>): TournamentFixture {
  return {
    id: String(raw.id ?? ''),
    pool_id: String(raw.pool_id ?? ''),
    home_registration_id: String(raw.home_registration_id ?? ''),
    away_registration_id: String(raw.away_registration_id ?? ''),
    home_name: String(raw.home_name ?? ''),
    away_name: String(raw.away_name ?? ''),
    home_score: typeof raw.home_score === 'number' ? raw.home_score : null,
    away_score: typeof raw.away_score === 'number' ? raw.away_score : null,
    played: raw.played === true,
  };
}

export function tournamentFromFirestore(id: string, data: Record<string, unknown>): Tournament {
  const registrations = Array.isArray(data.registrations)
    ? (data.registrations as Record<string, unknown>[]).map(mapTournamentRegistration)
    : [];
  const pools: TournamentPool[] = Array.isArray(data.pools)
    ? (data.pools as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ''),
        name: String(p.name ?? ''),
        registration_ids: Array.isArray(p.registration_ids) ? p.registration_ids.map(String) : [],
      }))
    : [];
  const fixtures = Array.isArray(data.fixtures)
    ? (data.fixtures as Record<string, unknown>[]).map(mapTournamentFixture)
    : [];
  const standingsRaw = (data.standings ?? {}) as Record<string, unknown>;
  const standings: Record<string, PoolStandingRow[]> = {};
  for (const [poolId, rows] of Object.entries(standingsRaw)) {
    standings[poolId] = Array.isArray(rows)
      ? (rows as Record<string, unknown>[]).map((r) => ({
          registration_id: String(r.registration_id ?? ''),
          club_name: String(r.club_name ?? ''),
          played: Number(r.played ?? 0),
          won: Number(r.won ?? 0),
          drawn: Number(r.drawn ?? 0),
          lost: Number(r.lost ?? 0),
          goals_for: Number(r.goals_for ?? 0),
          goals_against: Number(r.goals_against ?? 0),
          points: Number(r.points ?? 0),
        }))
      : [];
  }

  return {
    id,
    title: String(data.title ?? ''),
    description: data.description ? String(data.description) : undefined,
    city: String(data.city ?? ''),
    starts_at: toDate(data.starts_at),
    ends_at: data.ends_at ? toDate(data.ends_at) : undefined,
    max_teams: Number(data.max_teams ?? 8),
    entry_fee_cents: Number(data.entry_fee_cents ?? 0),
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    organizer_uid: String(data.organizer_uid ?? ''),
    organizer_name: String(data.organizer_name ?? ''),
    status: (data.status as Tournament['status']) ?? 'open',
    registrations,
    pools,
    fixtures,
    standings,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function mapCompetitionRules(raw: unknown): CompetitionRules {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    points_win: Number(r.points_win ?? DEFAULT_COMPETITION_RULES.points_win),
    points_draw: Number(r.points_draw ?? DEFAULT_COMPETITION_RULES.points_draw),
    points_loss: Number(r.points_loss ?? DEFAULT_COMPETITION_RULES.points_loss),
    contest_hours: Number(r.contest_hours ?? DEFAULT_COMPETITION_RULES.contest_hours),
  };
}

export function competitionFromFirestore(id: string, data: Record<string, unknown>): Competition {
  return {
    id,
    name: String(data.name ?? ''),
    format: data.format === 'cup' ? 'cup' : 'league',
    category: data.category ? String(data.category) : undefined,
    season_label: String(data.season_label ?? ''),
    organizer_uids: Array.isArray(data.organizer_uids) ? data.organizer_uids.map(String) : [],
    club_ids: Array.isArray(data.club_ids) ? data.club_ids.map(String) : [],
    rules: mapCompetitionRules(data.rules),
    created_by: String(data.created_by ?? ''),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export function competitionSeasonFromFirestore(
  id: string,
  data: Record<string, unknown>,
): CompetitionSeason {
  const statusRaw = String(data.status ?? 'draft');
  const status =
    statusRaw === 'active' || statusRaw === 'closed' ? statusRaw : 'draft';
  return {
    id,
    competition_id: String(data.competition_id ?? ''),
    competition_name: String(data.competition_name ?? ''),
    label: String(data.label ?? ''),
    starts_at: toDate(data.starts_at),
    ends_at: data.ends_at ? toDate(data.ends_at) : null,
    status,
    organizer_uids: Array.isArray(data.organizer_uids) ? data.organizer_uids.map(String) : [],
    external_provider: data.external_provider ? String(data.external_provider) : null,
    external_season_id: data.external_season_id ? String(data.external_season_id) : null,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export function competitionTeamFromFirestore(
  id: string,
  data: Record<string, unknown>,
): CompetitionTeam {
  return {
    id,
    season_id: String(data.season_id ?? ''),
    competition_id: String(data.competition_id ?? ''),
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : null,
    display_name: String(data.display_name ?? ''),
    created_at: toDate(data.created_at),
  };
}

export function competitionFixtureFromFirestore(
  id: string,
  data: Record<string, unknown>,
): CompetitionFixture {
  const status = (data.status as CompetitionFixtureStatus) ?? 'scheduled';
  return {
    id,
    season_id: String(data.season_id ?? ''),
    competition_id: String(data.competition_id ?? ''),
    matchday: Number(data.matchday ?? 1),
    home_team_id: String(data.home_team_id ?? ''),
    away_team_id: String(data.away_team_id ?? ''),
    home_name: String(data.home_name ?? ''),
    away_name: String(data.away_name ?? ''),
    kickoff_at: toDate(data.kickoff_at),
    status,
    home_score: typeof data.home_score === 'number' ? data.home_score : null,
    away_score: typeof data.away_score === 'number' ? data.away_score : null,
    team_event_id: data.team_event_id ? String(data.team_event_id) : null,
    source: data.source === 'external' ? 'external' : 'proday',
    validated_at: data.validated_at ? toDate(data.validated_at) : null,
    validated_by: data.validated_by ? String(data.validated_by) : null,
    contested_at: data.contested_at ? toDate(data.contested_at) : null,
    contested_by: data.contested_by ? String(data.contested_by) : null,
    contest_reason: data.contest_reason ? String(data.contest_reason) : null,
    contest_deadline_at: data.contest_deadline_at ? toDate(data.contest_deadline_at) : null,
    auto_potm_uid: data.auto_potm_uid ? String(data.auto_potm_uid) : null,
    auto_potm_name: data.auto_potm_name ? String(data.auto_potm_name) : null,
    ai_summary: data.ai_summary ? String(data.ai_summary) : null,
    highlight_urls: Array.isArray(data.highlight_urls)
      ? data.highlight_urls.map(String)
      : undefined,
    external_fixture_id: data.external_fixture_id ? String(data.external_fixture_id) : null,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export function competitionStandingsFromFirestore(
  id: string,
  data: Record<string, unknown>,
): CompetitionStandingsDoc {
  const rowsRaw = Array.isArray(data.rows) ? (data.rows as Record<string, unknown>[]) : [];
  return {
    id,
    season_id: String(data.season_id ?? id),
    competition_id: String(data.competition_id ?? ''),
    rows: rowsRaw.map((r) => ({
      team_id: String(r.team_id ?? ''),
      display_name: String(r.display_name ?? ''),
      played: Number(r.played ?? 0),
      won: Number(r.won ?? 0),
      drawn: Number(r.drawn ?? 0),
      lost: Number(r.lost ?? 0),
      goals_for: Number(r.goals_for ?? 0),
      goals_against: Number(r.goals_against ?? 0),
      goal_difference: Number(r.goal_difference ?? 0),
      points: Number(r.points ?? 0),
    })),
    updated_at: toDate(data.updated_at),
  };
}

export function playerCompetitionStatsFromFirestore(
  id: string,
  data: Record<string, unknown>,
): PlayerCompetitionStats {
  return {
    id,
    season_id: String(data.season_id ?? ''),
    competition_id: String(data.competition_id ?? ''),
    uid: String(data.uid ?? ''),
    display_name: String(data.display_name ?? ''),
    team_id: data.team_id ? String(data.team_id) : null,
    matches: Number(data.matches ?? 0),
    minutes: Number(data.minutes ?? 0),
    goals: Number(data.goals ?? 0),
    assists: Number(data.assists ?? 0),
    clean_sheets: Number(data.clean_sheets ?? 0),
    yellow_cards: Number(data.yellow_cards ?? 0),
    red_cards: Number(data.red_cards ?? 0),
    rating_sum: Number(data.rating_sum ?? 0),
    rating_count: Number(data.rating_count ?? 0),
    motm: Number(data.motm ?? 0),
    updated_at: toDate(data.updated_at),
  };
}

export function sponsorOfferFromFirestore(
  id: string,
  data: Record<string, unknown>
): SponsorOffer {
  return {
    id,
    sponsor_uid: data.sponsor_uid ? String(data.sponsor_uid) : undefined,
    company_name: String(data.company_name ?? ''),
    logo_url: String(data.logo_url ?? ''),
    offer_type: (data.offer_type as SponsorOffer['offer_type']) ?? 'equipment',
    description: String(data.description ?? ''),
    value: String(data.value ?? ''),
    target_categories: (data.target_categories as string[]) ?? [],
    city: String(data.city ?? ''),
    active: data.active !== false,
    created_at: toDate(data.created_at),
    views_count: data.views_count != null ? Number(data.views_count) : undefined,
    clicks_count: data.clicks_count != null ? Number(data.clicks_count) : undefined,
    leads_count: data.leads_count != null ? Number(data.leads_count) : undefined,
  };
}

export function fundingGoalFromFirestore(
  id: string,
  data: Record<string, unknown>
): ClubFundingGoal {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    title: String(data.title ?? ''),
    target_amount_eur: Number(data.target_amount_eur ?? 0),
    raised_amount_eur: Number(data.raised_amount_eur ?? 0),
    description: String(data.description ?? ''),
  };
}

export interface MessageThread {
  id: string;
  participant_name: string;
  other_user_id: string;
  last_message: string;
  updated_at: Date;
  unread: boolean;
  thread_kind?: 'standard' | 'physio_care' | 'team_group' | 'message_request';
  thread_title?: string;
  /** Demande joueur↔agent : pending jusqu'à acceptation. */
  request_status?: 'pending' | 'accepted' | 'refused' | 'cancelled';
  request_id?: string;
  request_requester_uid?: string;
  request_recipient_uid?: string;
}

export function messageThreadFromFirestore(
  id: string,
  data: Record<string, unknown>,
  currentUid: string
): MessageThread {
  const participantIds = (data.participant_ids as string[]) ?? [];
  const names = (data.participant_names as Record<string, string>) ?? {};
  const otherId =
    participantIds.find((pid) => pid !== currentUid) ??
    (id.includes('__') ? id.split('__').find((p) => p !== currentUid) : '') ??
    '';
  const unreadBy = (data.unread_by as string[]) ?? [];

  const threadKind = data.thread_kind as MessageThread['thread_kind'] | undefined;
  const threadTitle = data.thread_title ? String(data.thread_title) : undefined;
  const isTeam = threadKind === 'team_group';
  const requestStatus = data.request_status as MessageThread['request_status'] | undefined;

  return {
    id,
    other_user_id: isTeam ? '' : otherId,
    participant_name: isTeam
      ? (threadTitle ?? 'Groupe équipe')
      : (names[otherId] ?? String(data.participant_name ?? 'Utilisateur')),
    last_message: String(data.last_message ?? ''),
    updated_at: toDate(data.updated_at),
    unread: unreadBy.includes(currentUid) || Boolean(data.unread),
    thread_kind:
      threadKind === 'physio_care'
        ? 'physio_care'
        : threadKind === 'team_group'
          ? 'team_group'
          : threadKind === 'message_request'
            ? 'message_request'
            : 'standard',
    thread_title: threadTitle,
    request_status: requestStatus,
    request_id: data.request_id ? String(data.request_id) : undefined,
    request_requester_uid: data.request_requester_uid
      ? String(data.request_requester_uid)
      : undefined,
    request_recipient_uid: data.request_recipient_uid
      ? String(data.request_recipient_uid)
      : undefined,
  };
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: Date;
}

export function chatMessageFromFirestore(
  id: string,
  data: Record<string, unknown>
): ChatMessage {
  return {
    id,
    thread_id: String(data.thread_id ?? ''),
    sender_id: String(data.sender_id ?? ''),
    receiver_id: String(data.receiver_id ?? ''),
    body: String(data.body ?? ''),
    created_at: toDate(data.created_at),
  };
}

export function clubAnnouncementFromFirestore(
  id: string,
  data: Record<string, unknown>
): ClubAnnouncement {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    author_uid: String(data.author_uid ?? ''),
    author_name: String(data.author_name ?? ''),
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    created_at: toDate(data.created_at),
  };
}

export function stageOfferFromFirestore(
  id: string,
  data: Record<string, unknown>
): StageOffer {
  return {
    id,
    author_uid: String(data.author_uid ?? ''),
    club_id: String(data.club_id ?? ''),
    club_name: String(data.club_name ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    city: String(data.city ?? ''),
    category: String(data.category ?? ''),
    start_date: toDate(data.start_date),
    end_date: toDate(data.end_date),
    price_eur: data.price_eur != null ? Number(data.price_eur) : undefined,
    spots_total: Number(data.spots_total ?? 0),
    spots_taken: Number(data.spots_taken ?? 0),
    status: (data.status as StageOffer['status']) ?? 'OPEN',
    target_space: data.target_space as StageOffer['target_space'],
    created_at: toDate(data.created_at),
  };
}

export function stageApplicationFromFirestore(
  id: string,
  data: Record<string, unknown>
): StageApplication {
  return {
    id,
    stage_id: String(data.stage_id ?? ''),
    stage_author_uid: data.stage_author_uid as string | undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    message: String(data.message ?? ''),
    status: (data.status as StageApplication['status']) ?? 'PENDING',
    created_at: toDate(data.created_at),
  };
}

export function medicalAppointmentFromFirestore(
  id: string,
  data: Record<string, unknown>
): MedicalAppointment {
  return {
    id,
    physio_uid: String(data.physio_uid ?? ''),
    physio_name: String(data.physio_name ?? ''),
    patient_uid: String(data.patient_uid ?? ''),
    patient_name: String(data.patient_name ?? ''),
    specialty: data.specialty != null ? String(data.specialty) : undefined,
    start_at: toDate(data.start_at),
    end_at: toDate(data.end_at),
    duration_min: Number(data.duration_min ?? 30),
    status: (data.status as MedicalAppointmentStatus) ?? 'pending',
    consultation_type: data.consultation_type as MedicalAppointment['consultation_type'],
    meeting_link: data.meeting_link != null ? String(data.meeting_link) : undefined,
    visio_provider: data.visio_provider as MedicalAppointment['visio_provider'],
    cal_booking_uid: data.cal_booking_uid != null ? String(data.cal_booking_uid) : undefined,
    motif: data.motif != null ? String(data.motif) : undefined,
    location_label: data.location_label != null ? String(data.location_label) : undefined,
    notes: data.notes != null ? String(data.notes) : undefined,
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

export function playerActivityFromFirestore(
  id: string,
  data: Record<string, unknown>
): PlayerActivity {
  const matchResult =
    data.match_result === 'win' || data.match_result === 'draw' || data.match_result === 'loss'
      ? data.match_result
      : undefined;
  const reactionsRaw = data.reactions;
  const reactions =
    reactionsRaw && typeof reactionsRaw === 'object' && !Array.isArray(reactionsRaw)
      ? Object.fromEntries(
          Object.entries(reactionsRaw as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        )
      : undefined;
  return {
    id,
    player_uid: String(data.player_uid ?? ''),
    type: (data.type as PlayerActivityType) ?? 'training',
    date: toDate(data.date),
    duration_min: Number(data.duration_min ?? 0),
    goals: data.goals != null ? Number(data.goals) : undefined,
    assists: data.assists != null ? Number(data.assists) : undefined,
    yellow_cards: data.yellow_cards != null ? Number(data.yellow_cards) : undefined,
    red_cards: data.red_cards != null ? Number(data.red_cards) : undefined,
    minutes_played: data.minutes_played != null ? Number(data.minutes_played) : undefined,
    clean_sheet: data.clean_sheet === true ? true : data.clean_sheet === false ? false : undefined,
    match_result: matchResult,
    rating_pulse: data.rating_pulse != null ? Number(data.rating_pulse) : undefined,
    rating_self: data.rating_self != null ? Number(data.rating_self) : undefined,
    notes: data.notes != null ? String(data.notes) : undefined,
    voice_reflection_url:
      data.voice_reflection_url != null ? String(data.voice_reflection_url) : undefined,
    drills: Array.isArray(data.drills)
      ? (data.drills as unknown[]).map(String).filter(Boolean)
      : undefined,
    intensity: data.intensity != null ? Number(data.intensity) : undefined,
    video_url: data.video_url != null ? String(data.video_url) : undefined,
    thumbnail_url: data.thumbnail_url != null ? String(data.thumbnail_url) : undefined,
    analysis_status:
      data.analysis_status === 'pending_analysis' ||
      data.analysis_status === 'analyzed' ||
      data.analysis_status === 'failed'
        ? data.analysis_status
        : undefined,
    analysis_summary_fr:
      data.analysis_summary_fr != null ? String(data.analysis_summary_fr) : undefined,
    analysis_strengths: Array.isArray(data.analysis_strengths)
      ? (data.analysis_strengths as unknown[]).map(String).filter(Boolean)
      : undefined,
    analysis_improvements: Array.isArray(data.analysis_improvements)
      ? (data.analysis_improvements as unknown[]).map(String).filter(Boolean)
      : undefined,
    analysis_tactical_notes: Array.isArray(data.analysis_tactical_notes)
      ? (data.analysis_tactical_notes as unknown[]).map(String).filter(Boolean)
      : undefined,
    analysis_confidence:
      data.analysis_confidence != null ? Number(data.analysis_confidence) : undefined,
    analyzed_at: data.analyzed_at ? toDate(data.analyzed_at) : undefined,
    performance_tags: Array.isArray(data.performance_tags)
      ? (data.performance_tags as string[]).filter((t): t is PerformanceTag =>
          PERFORMANCE_TAGS.includes(t as PerformanceTag)
        )
      : undefined,
    reactions,
    source: (data.source as PlayerActivitySource) ?? 'manual',
    team_event_id: data.team_event_id != null ? String(data.team_event_id) : undefined,
    created_at: toDate(data.created_at),
  };
}

