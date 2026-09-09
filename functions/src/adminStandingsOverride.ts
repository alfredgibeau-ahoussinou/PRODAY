/**
 * Ajustement manuel d’une ligne de classement (admin-only).
 * Écrit via Admin SDK — les rules client bloquent fff_league_standings.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

const COL = 'fff_league_standings';

type StandingRow = {
  rank: number;
  team_id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: Array<'V' | 'N' | 'D'>;
};

export type AdjustStandingInput = {
  league_id: string;
  team_id: string;
  patch: Partial<{
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    points: number;
    rank: number;
  }>;
  reason?: string | null;
};

function asInt(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
    return Math.trunc(Number(v));
  }
  return fallback;
}

function recomputeDiff(row: StandingRow): StandingRow {
  return {
    ...row,
    goal_diff: row.goals_for - row.goals_against,
  };
}

function resort(rows: StandingRow[]): StandingRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.name.localeCompare(b.name, 'fr');
  });
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function adjustLeagueStandingInFirestore(
  db: Firestore,
  adminUid: string,
  input: AdjustStandingInput,
): Promise<{ league_id: string; team_id: string; rows: number }> {
  const leagueId = String(input.league_id ?? '').trim();
  const teamId = String(input.team_id ?? '').trim();
  if (!leagueId || !teamId) {
    throw new functions.https.HttpsError('invalid-argument', 'league_id et team_id requis');
  }

  const ref = db.collection(COL).doc(leagueId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', `Ligue introuvable: ${leagueId}`);
  }

  const data = snap.data() ?? {};
  const standings = Array.isArray(data.standings) ? (data.standings as StandingRow[]) : [];
  const idx = standings.findIndex(
    (r) => String(r.team_id) === teamId || String(r.name).toLowerCase() === teamId.toLowerCase(),
  );
  if (idx < 0) {
    throw new functions.https.HttpsError('not-found', `Équipe introuvable: ${teamId}`);
  }

  const prev = standings[idx]!;
  const patch = input.patch ?? {};
  let next: StandingRow = {
    ...prev,
    name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim() : prev.name,
    played: patch.played !== undefined ? asInt(patch.played, prev.played) : prev.played,
    won: patch.won !== undefined ? asInt(patch.won, prev.won) : prev.won,
    drawn: patch.drawn !== undefined ? asInt(patch.drawn, prev.drawn) : prev.drawn,
    lost: patch.lost !== undefined ? asInt(patch.lost, prev.lost) : prev.lost,
    goals_for: patch.goals_for !== undefined ? asInt(patch.goals_for, prev.goals_for) : prev.goals_for,
    goals_against:
      patch.goals_against !== undefined
        ? asInt(patch.goals_against, prev.goals_against)
        : prev.goals_against,
    points: patch.points !== undefined ? asInt(patch.points, prev.points) : prev.points,
    form: Array.isArray(prev.form) ? prev.form : [],
  };
  next = recomputeDiff(next);

  const updated = [...standings];
  updated[idx] = next;
  const resorted =
    patch.rank !== undefined
      ? updated.map((r, i) => (i === idx ? { ...r, rank: asInt(patch.rank, r.rank) } : r))
      : resort(updated);

  await ref.set(
    {
      standings: resorted,
      source: 'admin_override',
      lastSyncAt: new Date().toISOString(),
      admin_override_at: FieldValue.serverTimestamp(),
      admin_override_by: adminUid,
      admin_override_reason: input.reason?.trim() || null,
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { league_id: leagueId, team_id: teamId, rows: resorted.length };
}
