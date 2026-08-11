import type { User } from '../models/User';
import type {
  SmartPlayerCardData,
  TeamTacticsDashboard,
  WellnessSignals,
} from '../models/SmartTactics';
import { computeMatchReadiness, computeOverallPotential } from './matchReadiness';
import { buildAiMatchPreparation } from './smartTacticsEngine';
import type { TeamEvent } from '../models/TeamEvent';

export function defaultWellnessForUser(user: User): WellnessSignals {
  const availability = user.profile.availability;
  return {
    sleep_hours: 7,
    fatigue: 4,
    stress: 3,
    recovery: 7,
    wellness_score: 7,
    pain: 0,
    training_attendance_rate: 0.85,
    minutes_last_7d: 90,
    recovery_hours_since_last: 60,
    injury_recency_days: null,
    suspended: false,
    injured: availability === 'unavailable',
  };
}

export function buildSmartPlayerCard(
  user: User,
  signals?: WellnessSignals,
  opts?: { is_captain?: boolean; badges?: string[]; certifications?: string[] },
): SmartPlayerCardData {
  const potential = computeOverallPotential({
    age: user.profile.age,
    years_experience: user.profile.years_experience,
    season_matches: user.profile.season_stats?.matches,
    season_goals: user.profile.season_stats?.goals,
    season_assists: user.profile.season_stats?.assists,
    height_cm: user.profile.height_cm,
  });
  const wellness = signals ?? defaultWellnessForUser(user);
  const readiness = computeMatchReadiness(potential, wellness);
  const progress = Math.min(
    100,
    Math.round(((user.profile.season_stats?.matches ?? 0) / 20) * 100),
  );

  return {
    uid: user.uid,
    display_name: user.display_name,
    photo_url: user.avatar_url,
    position: user.profile.position,
    preferred_foot: user.profile.strong_foot,
    overall: readiness.potential,
    readiness_pct: readiness.readiness_pct,
    form: readiness.form,
    availability: readiness.availability,
    confidence: readiness.confidence,
    progress,
    contract_status: user.profile.availability === 'negotiating' ? 'En discussion' : 'Actif',
    age: user.profile.age,
    badges: opts?.badges ?? (user.is_verified ? ['Vérifié'] : []),
    certifications: opts?.certifications ?? [],
    is_captain: opts?.is_captain,
    injured: wellness.injured,
    suspended: wellness.suspended,
  };
}

export function buildTeamTacticsDashboard(input: {
  members: User[];
  events: TeamEvent[];
  wellnessByUid?: Record<string, WellnessSignals>;
  captain_uid?: string;
}): TeamTacticsDashboard {
  const cards = input.members
    .filter((m) => m.role === 'player')
    .map((m) =>
      buildSmartPlayerCard(m, input.wellnessByUid?.[m.uid], {
        is_captain: m.uid === input.captain_uid,
      }),
    );

  // Include non-player members if club roster is small / mixed roles labeled as players in profile
  const roster =
    cards.length > 0
      ? cards
      : input.members.map((m) =>
          buildSmartPlayerCard(m, input.wellnessByUid?.[m.uid], {
            is_captain: m.uid === input.captain_uid,
          }),
        );

  const prep = buildAiMatchPreparation({ cards: roster });
  const byUid = new Map(roster.map((c) => [c.uid, c]));
  const suggested_xi = prep.starting_xi_uids
    .map((id) => byUid.get(id))
    .filter(Boolean) as SmartPlayerCardData[];

  const upcoming = [...input.events]
    .filter((e) => e.starts_at.getTime() > Date.now())
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
    .slice(0, 4);

  const attendanceSamples = upcoming.slice(0, 3);
  let attendance_rate = 0.8;
  if (attendanceSamples.length > 0) {
    const rates = attendanceSamples.map((e) => {
      const invited = e.invitee_uids?.length ?? 0;
      if (invited === 0) return 0.8;
      const yes = Object.values(e.rsvps ?? {}).filter((v) => v === 'yes').length;
      return yes / invited;
    });
    attendance_rate = rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  const avgReadiness =
    roster.length === 0
      ? 70
      : roster.reduce((a, c) => a + c.readiness_pct, 0) / roster.length;
  const morale = Math.round(avgReadiness * 0.7 + attendance_rate * 100 * 0.3);
  const weekly_workload = Math.round(
    roster.reduce((a, c) => a + (100 - c.readiness_pct) * 0.4, 0) / Math.max(1, roster.length),
  );

  const ai_alerts: string[] = [
    ...prep.physical_alerts.slice(0, 3),
    ...(prep.fallback ? ['IA en mode fallback — enrichissez les données wellness & adversaire'] : []),
  ];

  return {
    suggested_xi,
    formation: prep.formation_recommendation,
    in_form: [...roster].sort((a, b) => b.form - a.form).slice(0, 4),
    fatigued: roster.filter((c) => c.readiness_pct < 60 && c.availability === 'available').slice(0, 4),
    injured: roster.filter((c) => c.injured || c.availability === 'out'),
    suspended: roster.filter((c) => c.suspended || c.availability === 'suspended'),
    at_risk: roster.filter((c) => c.availability === 'doubtful').slice(0, 4),
    upcoming_match_titles: upcoming.map((e) => e.title),
    attendance_rate: Math.round(attendance_rate * 100),
    morale: Math.min(100, morale),
    weekly_workload: Math.min(100, weekly_workload),
    ai_alerts,
    tactical_recommendations: prep.tactical_suggestions,
  };
}
