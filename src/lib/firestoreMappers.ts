import type {
  User,
  UserRole,
  VerificationStatus,
  GeoPoint,
  WorkExperience,
  DiplomaRecord,
  ProfileReview,
} from '../models/User';
import type { RecruitmentPost } from '../models/Player';

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

export function recruitmentPostFromFirestore(
  id: string,
  data: Record<string, unknown>
): RecruitmentPost {
  return {
    id,
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
