import type {
  User,
  UserRole,
  VerificationStatus,
  GeoPoint,
  WorkExperience,
  DiplomaRecord,
  ProfileReview,
} from '../models/User';
import type { RecruitmentPost, Application } from '../models/Player';
import type { Tournament, TournamentAwards } from '../models/Tournament';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { SponsorOffer, ClubFundingGoal } from '../models/SponsorOffer';

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

export function userFromFirestore(uid: string, data: Record<string, unknown>): User {
  const profile = (data.profile as Record<string, unknown>) ?? {};

  return {
    uid,
    display_name: String(data.display_name ?? data.displayName ?? ''),
    email: String(data.email ?? ''),
    phone: data.phone as string | undefined,
    avatar_url: (data.avatar_url ?? data.avatarUrl) as string | undefined,
    role: (data.role as UserRole) ?? 'player',
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
      strong_foot: profile.strong_foot as User['profile']['strong_foot'],
      height_cm: profile.height_cm as number | undefined,
      weight_kg: profile.weight_kg as number | undefined,
      highlight_video_urls: profile.highlight_video_urls as string[] | undefined,
      gallery_urls: profile.gallery_urls as string[] | undefined,
      age: profile.age as number | undefined,
      years_experience: profile.years_experience as number | undefined,
      availability: profile.availability as User['profile']['availability'],
      season_stats: profile.season_stats as User['profile']['season_stats'],
      diploma: profile.diploma as string | undefined,
      license_number: profile.license_number as string | undefined,
      job_title: profile.job_title as string | undefined,
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
  };
}

export function applicationFromFirestore(
  id: string,
  data: Record<string, unknown>
): Application {
  return {
    id,
    post_id: String(data.post_id ?? ''),
    player_uid: String(data.player_uid ?? ''),
    cover_letter: String(data.cover_letter ?? ''),
    cv_pdf_url: String(data.cv_pdf_url ?? ''),
    created_at: toDate(data.created_at),
    status: (data.status as Application['status']) ?? 'PENDING',
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
  };
}

export function tournamentFromFirestore(
  id: string,
  data: Record<string, unknown>
): Tournament {
  const awards = data.awards as Record<string, string> | undefined;
  return {
    id,
    name: String(data.name ?? ''),
    organizer_id: String(data.organizer_id ?? ''),
    location: toGeoPoint(data.location) ?? { latitude: 0, longitude: 0 },
    city: String(data.city ?? ''),
    date_start: toDate(data.date_start),
    date_end: toDate(data.date_end),
    categories: (data.categories as string[]) ?? [],
    status: (data.status as Tournament['status']) ?? 'OPEN',
    subscriber_uids: (data.subscriber_uids as string[]) ?? [],
    awards: awards
      ? {
          best_player_uid: awards.best_player ?? '',
          top_scorer_uid: awards.top_scorer ?? '',
          best_goalkeeper_uid: awards.best_goalkeeper ?? '',
        }
      : undefined,
    awards_names: data.awards_names as Tournament['awards_names'],
  };
}

export function friendlyMatchFromFirestore(
  id: string,
  data: Record<string, unknown>
): FriendlyMatch {
  return {
    id,
    requester_uid: data.requester_uid as string | undefined,
    requester_club_id: String(data.requester_club_id ?? ''),
    requester_club_name: String(data.requester_club_name ?? ''),
    opponent_club_id: data.opponent_club_id as string | undefined,
    opponent_club_name: data.opponent_club_name as string | undefined,
    location: toGeoPoint(data.location),
    city: String(data.city ?? ''),
    date: toDate(data.date),
    time_label: data.time_label as string | undefined,
    category: String(data.category ?? ''),
    level: String(data.level ?? ''),
    level_type: (data.level_type as FriendlyMatch['level_type']) ?? 'loisir',
    has_pitch: Boolean(data.has_pitch),
    message: data.message as string | undefined,
    status: (data.status as FriendlyMatch['status']) ?? 'OPEN',
    created_at: toDate(data.created_at),
  };
}

export function sponsorOfferFromFirestore(
  id: string,
  data: Record<string, unknown>
): SponsorOffer {
  return {
    id,
    company_name: String(data.company_name ?? ''),
    logo_url: String(data.logo_url ?? ''),
    offer_type: (data.offer_type as SponsorOffer['offer_type']) ?? 'equipment',
    description: String(data.description ?? ''),
    value: String(data.value ?? ''),
    target_categories: (data.target_categories as string[]) ?? [],
    city: String(data.city ?? ''),
    active: data.active !== false,
    created_at: toDate(data.created_at),
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

  return {
    id,
    other_user_id: otherId,
    participant_name: names[otherId] ?? String(data.participant_name ?? 'Utilisateur'),
    last_message: String(data.last_message ?? ''),
    updated_at: toDate(data.updated_at),
    unread: unreadBy.includes(currentUid) || Boolean(data.unread),
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
