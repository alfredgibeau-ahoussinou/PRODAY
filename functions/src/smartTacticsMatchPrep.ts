/**
 * Smart Tactics — préparation de match assistée par Mistral.
 * Retourne un JSON structuré ; le client conserve le moteur local en fallback.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import {
  MISTRAL_CHAT_MODEL,
  extractMistralChatText,
} from './mistralModels';

const db = admin.firestore();

type RosterRow = {
  uid: string;
  name: string;
  position?: string;
  readiness?: number;
  form?: number;
  availability?: string;
};

type ResultRow = { goals_for: number; goals_against: number };

type PrepRequest = {
  club_id?: string;
  event_id?: string;
  opponent_name?: string;
  preferred_formation?: string;
  roster?: RosterRow[];
  previous_results?: ResultRow[];
  coach_notes?: string;
};

type PrepResponse = {
  source: 'mistral';
  fallback: boolean;
  formation_recommendation: string;
  starting_xi_uids: string[];
  tactical_suggestions: string[];
  physical_alerts: string[];
  risk_analysis: string[];
  opponent: {
    strengths: string[];
    weaknesses: string[];
    formation_guess?: string;
    key_players: string[];
    risk_flags: string[];
    suggested_approach: string;
    data_confidence: 'low' | 'medium' | 'high';
  };
  briefing_fr: string;
};

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

function asStringArray(v: unknown, max = 6): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, max);
}

type PosGroup = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'unknown';

function positionGroup(position?: string): PosGroup {
  if (!position) return 'unknown';
  const p = position
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/gardien|goal|gk|gb/.test(p)) return 'goalkeeper';
  if (/defens|defence|back|lateral|arriere|cb|dc/.test(p)) return 'defender';
  if (/milieu|mid|meneur|relayeur|mc|md|mg/.test(p)) return 'midfielder';
  if (/attaqu|forward|ailier|buteur|striker|avant|wing/.test(p)) return 'forward';
  return 'unknown';
}

function parseFormationLines(formation: string): number[] {
  const parts = formation.split('-').map((n) => parseInt(n, 10)).filter((n) => n > 0);
  if (parts.length === 0) return [1, 4, 3, 3];
  return [1, ...parts];
}

function lineGroup(lineIndex: number, lineCount: number): PosGroup {
  if (lineIndex <= 0) return 'goalkeeper';
  if (lineIndex === 1) return 'defender';
  if (lineIndex >= lineCount - 1) return 'forward';
  return 'midfielder';
}

function fitness(row: RosterRow): number {
  return (row.readiness ?? 0) * 0.6 + (row.form ?? 0) * 0.4;
}

/** Réordonne un XI Mistral : GB → DEF → MID → ATT selon la formation. */
function orderXiByRosterPositions(
  uids: string[],
  roster: RosterRow[],
  formation: string,
): string[] {
  const byUid = new Map(roster.map((r) => [r.uid, r]));
  const remaining = uids.map((id) => byUid.get(id)).filter(Boolean) as RosterRow[];
  const lines = parseFormationLines(formation);
  const used = new Set<string>();
  const ordered: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const need = lines[lineIndex];
    const group = lineGroup(lineIndex, lines.length);
    const matches = remaining
      .filter((r) => !used.has(r.uid) && positionGroup(r.position) === group)
      .sort((a, b) => fitness(b) - fitness(a));
    const others = remaining
      .filter((r) => !used.has(r.uid) && !matches.includes(r))
      .sort((a, b) => fitness(b) - fitness(a));
    for (const row of [...matches, ...others].slice(0, need)) {
      used.add(row.uid);
      ordered.push(row.uid);
    }
  }
  for (const row of remaining) {
    if (!used.has(row.uid)) ordered.push(row.uid);
  }
  return ordered;
}

/** Complète / reconstruit un XI selon les postes de la formation. */
function fillXiByPosition(
  current: string[],
  roster: RosterRow[],
  formation: string,
): string[] {
  const lines = parseFormationLines(formation);
  const prefer = new Set(current);
  const eligible = roster.filter(
    (r) => r.availability !== 'out' && r.availability !== 'suspended',
  );
  const pools: Record<PosGroup, RosterRow[]> = {
    goalkeeper: [],
    defender: [],
    midfielder: [],
    forward: [],
    unknown: [],
  };
  for (const r of eligible) pools[positionGroup(r.position)].push(r);
  for (const g of Object.keys(pools) as PosGroup[]) {
    pools[g].sort((a, b) => {
      const pa = prefer.has(a.uid) ? 1 : 0;
      const pb = prefer.has(b.uid) ? 1 : 0;
      if (pb !== pa) return pb - pa;
      return fitness(b) - fitness(a);
    });
  }

  const used = new Set<string>();
  const rebuilt: string[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const need = lines[lineIndex];
    const group = lineGroup(lineIndex, lines.length);
    const fallbacks: PosGroup[] =
      group === 'goalkeeper'
        ? ['unknown', 'defender']
        : group === 'defender'
          ? ['unknown', 'midfielder']
          : group === 'forward'
            ? ['unknown', 'midfielder']
            : ['unknown', 'defender', 'forward'];
    for (let i = 0; i < need; i++) {
      let row = pools[group].find((r) => !used.has(r.uid));
      if (!row) {
        for (const fb of fallbacks) {
          row = pools[fb].find((r) => !used.has(r.uid));
          if (row) break;
        }
      }
      if (!row) row = eligible.find((r) => !used.has(r.uid));
      if (!row) break;
      used.add(row.uid);
      rebuilt.push(row.uid);
    }
  }
  return rebuilt;
}

function parsePrepJson(raw: string, rosterUids: string[]): PrepResponse | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const opponentRaw = (parsed.opponent as Record<string, unknown>) ?? {};
    const xi = asStringArray(parsed.starting_xi_uids, 11).filter((id) =>
      rosterUids.includes(id),
    );
    const confidence = String(opponentRaw.data_confidence ?? 'medium');
    const data_confidence =
      confidence === 'high' || confidence === 'low' || confidence === 'medium'
        ? confidence
        : 'medium';

    return {
      source: 'mistral',
      fallback: Boolean(parsed.fallback) || xi.length < 8,
      formation_recommendation: String(parsed.formation_recommendation ?? '4-3-3').trim() || '4-3-3',
      starting_xi_uids: xi,
      tactical_suggestions: asStringArray(parsed.tactical_suggestions, 6),
      physical_alerts: asStringArray(parsed.physical_alerts, 6),
      risk_analysis: asStringArray(parsed.risk_analysis, 6),
      opponent: {
        strengths: asStringArray(opponentRaw.strengths, 5),
        weaknesses: asStringArray(opponentRaw.weaknesses, 5),
        formation_guess: opponentRaw.formation_guess
          ? String(opponentRaw.formation_guess)
          : undefined,
        key_players: asStringArray(opponentRaw.key_players, 4),
        risk_flags: asStringArray(opponentRaw.risk_flags, 4),
        suggested_approach: String(opponentRaw.suggested_approach ?? '').trim() ||
          'Observer les 15 premières minutes puis ajuster.',
        data_confidence,
      },
      briefing_fr: String(parsed.briefing_fr ?? '').trim(),
    };
  } catch {
    return null;
  }
}

async function assertClubCoach(uid: string, clubId: string): Promise<void> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError('permission-denied', 'Profil introuvable.');
  const user = userSnap.data() ?? {};
  const role = String(user.role ?? '');
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const userClub = String(profile.club_id ?? user.club_id ?? '');
  const isStaff =
    role === 'coach' ||
    role === 'club' ||
    role === 'admin' ||
    role === 'staff' ||
    Boolean(user.is_admin);
  if (!isStaff) {
    throw new HttpsError('permission-denied', 'Réservé au staff coach / club.');
  }
  if (userClub && userClub !== clubId && !user.is_admin) {
    throw new HttpsError('permission-denied', 'Club non autorisé.');
  }
}

async function callMistralPrep(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_CHAT_MODEL,
      temperature: 0.35,
      max_tokens: 1600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Tu es un assistant tactique football ProDay. Réponds UNIQUEMENT en JSON valide, sans markdown. Langue: français.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[smartTacticsMatchPrep] Mistral', res.status, body.slice(0, 400));
    throw new HttpsError('internal', 'Le modèle IA a échoué. Réessayez.');
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const text = extractMistralChatText(json.choices?.[0]?.message?.content);
  if (!text) throw new HttpsError('internal', 'Réponse IA vide.');
  return text;
}

export const smartTacticsMatchPrep = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request): Promise<PrepResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }
    const data = (request.data ?? {}) as PrepRequest;
    const clubId = String(data.club_id ?? '').trim();
    if (!clubId) throw new HttpsError('invalid-argument', 'club_id requis.');

    await assertClubCoach(request.auth.uid, clubId);

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'Mistral non configuré (MISTRAL_API_KEY).',
      );
    }

    const roster = Array.isArray(data.roster) ? data.roster.slice(0, 30) : [];
    if (roster.length < 7) {
      throw new HttpsError('invalid-argument', 'Effectif trop réduit pour une préparation IA.');
    }

    const rosterUids = roster.map((r) => String(r.uid));
    const results = Array.isArray(data.previous_results)
      ? data.previous_results.slice(0, 8)
      : [];
    const opponent = String(data.opponent_name ?? 'Adversaire').slice(0, 80);
    const preferred = String(data.preferred_formation ?? '').slice(0, 20);

    const prompt = [
      `Prépare le match contre: ${opponent}.`,
      preferred ? `Formation préférée coach: ${preferred}.` : '',
      data.coach_notes ? `Notes coach: ${String(data.coach_notes).slice(0, 400)}` : '',
      `Historique scores (goals_for = nous): ${JSON.stringify(results)}`,
      `Effectif (uid, nom, poste, ready%, forme, dispo):`,
      JSON.stringify(
        roster.map((r) => ({
          uid: r.uid,
          name: r.name,
          position: r.position ?? null,
          readiness: r.readiness ?? null,
          form: r.form ?? null,
          availability: r.availability ?? null,
        })),
      ),
      `Schéma JSON strict:`,
      `{
  "formation_recommendation": "4-3-3",
  "starting_xi_uids": ["uid1", "...exactement les uid fournis, 10 ou 11, ORDRE: GB puis DEF puis MID puis ATT"],
  "tactical_suggestions": ["..."],
  "physical_alerts": ["..."],
  "risk_analysis": ["..."],
  "fallback": false,
  "briefing_fr": "briefing coach 2-4 phrases",
  "opponent": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "formation_guess": "4-4-2",
    "key_players": ["..."],
    "risk_flags": ["..."],
    "suggested_approach": "...",
    "data_confidence": "low|medium|high"
  }
}`,
      `Règles STRICTES postes + forme:`,
      `- Analyse d'abord la FORME et le readiness de CHAQUE joueur du roster.`,
      `- Compose le XI selon la formation (ex 4-3-3 = 1 GB + 4 DEF + 3 MID + 3 ATT).`,
      `- Respecte le champ position de chaque joueur (Gardien/Défenseur/Milieu/Attaquant ou équivalent).`,
      `- starting_xi_uids UNIQUEMENT parmi les uid fournis, dans l'ordre des lignes (gardien d'abord, attaquants en dernier).`,
      `- Parmi un même poste, prioriser forme puis readiness; éviter out/suspended/douteux sauf nécessité.`,
      `- briefing_fr: 3-5 phrases — synthèse forme effectif + pourquoi ce XI + approche vs adversaire.`,
      `- tactical_suggestions: inclure 1-2 points explicites sur la forme (qui est en feu / à risque).`,
      `- data_confidence low si historique vide.`,
    ]
      .filter(Boolean)
      .join('\n');

    const raw = await callMistralPrep(apiKey, prompt);
    const parsed = parsePrepJson(raw, rosterUids);
    if (!parsed) {
      throw new HttpsError('internal', 'Réponse IA illisible.');
    }

    parsed.starting_xi_uids = orderXiByRosterPositions(
      parsed.starting_xi_uids,
      roster,
      parsed.formation_recommendation,
    );

    // Completer le XI si le modèle en a renvoyé trop peu (par postes)
    if (parsed.starting_xi_uids.length < 8) {
      const filled = fillXiByPosition(
        parsed.starting_xi_uids,
        roster,
        parsed.formation_recommendation,
      );
      parsed.starting_xi_uids = filled;
      parsed.fallback = true;
    }

    return parsed;
  },
);
