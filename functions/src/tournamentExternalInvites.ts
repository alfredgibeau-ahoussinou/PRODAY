/**
 * Invitations & inscriptions externes aux tournois ProDay.
 *
 * Public HTTP (pas de compte ProDay requis) :
 *  - GET  ?tournament_id=…&token=…  → infos publiques du tournoi + état de l'invitation
 *  - POST { tournament_id, token, response, contact } → accepter / décliner
 *
 * Garde-fous :
 *  - Token obligatoire et vérifié (expiration, révocation, doublons, capacité).
 *  - Aucune donnée privée du club : uniquement les champs destinés aux invités.
 *  - Une invitation envoyée ne vaut jamais confirmation : l'inscription reste
 *    « pending_approval » tant que l'organisateur n'a pas approuvé
 *    (champ requires_approval conservé).
 *  - CORS restreint aux domaines ProDay + rate limit par IP.
 *  - Aucune création automatique de compte Firebase Auth.
 */
import * as functions from 'firebase-functions';
import type { Request, Response } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { admin } from './firebaseAdmin';

const COL = 'club_tournaments';

const ALLOWED_ORIGINS = new Set<string>([
  'https://proday75.fr',
  'https://proday75.netlify.app',
  'https://www.proday75.fr',
]);

const RATE_LIMIT_MAX = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://proday75.fr';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

function json(res: Response, status: number, body: Record<string, unknown>, origin: string | null) {
  res.set(corsHeaders(origin));
  res.status(status).json(body);
}

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0]!.trim();
  return req.ip ?? 'unknown';
}

function str(value: unknown, max = 120): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function isDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

type InviteRecord = {
  id: string;
  club_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  token: string;
  status: string;
  requires_approval: boolean;
  expires_at?: Date | null;
  note?: string;
};

/** Totaux visibles par l'invité — jamais la liste des autres clubs inscrits. */
function publicView(data: Record<string, unknown>, invite: InviteRecord | null, now: Date) {
  const status = String(data.status ?? 'draft');
  const deadline = isDate(data.registration_deadline);
  const expires = (invite?.expires_at ? isDate(invite.expires_at) : null) ?? deadline;
  const invites = Array.isArray(data.external_invites)
    ? (data.external_invites as Record<string, unknown>[]).map((i) => ({
        id: String(i.id ?? ''),
        club_name: String(i.club_name ?? ''),
        contact_name: i.contact_name ? String(i.contact_name) : undefined,
        contact_email: i.contact_email ? String(i.contact_email) : undefined,
        contact_phone: i.contact_phone ? String(i.contact_phone) : undefined,
        category: i.category ? String(i.category) : undefined,
        token: String(i.token ?? ''),
        status: String(i.status ?? 'sent'),
        requires_approval: i.requires_approval === true,
        expires_at: isDate(i.expires_at),
        note: i.note ? String(i.note) : undefined,
      }))
    : [];
  const myInvite = invite;
  const teamCount = Array.isArray(data.teams) ? data.teams.length : 0;
  const acceptedCount = invites.filter((i) => i.status === 'accepted').length;
  const capacity = typeof data.capacity === 'number' && data.capacity > 0 ? data.capacity : null;
  const remaining = capacity !== null ? Math.max(0, capacity - teamCount - acceptedCount) : null;

  return {
    tournament: {
      name: String(data.name ?? 'Tournoi'),
      category: String(data.category ?? ''),
      club_name: String(data.host_club_name ?? data.club_name ?? 'Club organisateur'),
      starts_at: isDate(data.starts_at)?.toISOString() ?? null,
      ends_at: isDate(data.ends_at)?.toISOString() ?? null,
      venue_label: data.venue_label ? String(data.venue_label) : null,
      city: data.city ? String(data.city) : null,
      capacity,
      confirmed_teams: teamCount + acceptedCount,
      remaining_capacity: remaining,
      registration_deadline: deadline?.toISOString() ?? null,
      participation_conditions: data.participation_conditions ? String(data.participation_conditions) : null,
      entry_fee_label: data.entry_fee_label ? String(data.entry_fee_label) : null,
      format: String(data.format ?? 'pools_only'),
      lifecycle: status,
      change_log: Array.isArray(data.change_log)
        ? (data.change_log as Record<string, unknown>[]).slice(-3).map((c) => ({
            at: isDate(c.at)?.toISOString() ?? null,
            label: String(c.label ?? ''),
          }))
        : [],
    },
    invitation: myInvite
      ? {
          club_name: myInvite.club_name,
          status: myInvite.status,
          requires_approval: myInvite.requires_approval,
          expires_at: expires?.toISOString() ?? null,
          expired: Boolean(expires && now.getTime() > expires.getTime()),
        }
      : null,
  };
}

function findInvite(data: Record<string, unknown>, token: string): InviteRecord | null {
  if (!Array.isArray(data.external_invites)) return null;
  for (const raw of data.external_invites as Record<string, unknown>[]) {
    if (String(raw.token ?? '') === token) {
      return {
        id: String(raw.id ?? ''),
        club_name: String(raw.club_name ?? ''),
        contact_name: raw.contact_name ? String(raw.contact_name) : undefined,
        contact_email: raw.contact_email ? String(raw.contact_email) : undefined,
        contact_phone: raw.contact_phone ? String(raw.contact_phone) : undefined,
        category: raw.category ? String(raw.category) : undefined,
        token,
        status: String(raw.status ?? 'sent'),
        requires_approval: raw.requires_approval === true,
        expires_at: isDate(raw.expires_at),
        note: raw.note ? String(raw.note) : undefined,
      };
    }
  }
  return null;
}

function invitationBlockReason(
  data: Record<string, unknown>,
  invite: InviteRecord,
  now: Date,
): string | null {
  if (invite.status === 'revoked') return 'Cette invitation a été révoquée par l’organisateur.';
  if (invite.status === 'declined') return 'Cette invitation a été déclinée.';
  if (invite.status === 'accepted') return 'Cette invitation a déjà été acceptée.';
  const expires = (invite.expires_at ? isDate(invite.expires_at) : null) ?? isDate(data.registration_deadline);
  if (expires && now.getTime() > expires.getTime()) return 'Cette invitation a expiré.';
  const lifecycle = String(data.status ?? 'draft');
  if (lifecycle === 'cancelled') return 'Ce tournoi a été annulé.';
  if (lifecycle === 'registration_closed' || lifecycle === 'ongoing' || lifecycle === 'completed') {
    return 'Les inscriptions sont fermées pour ce tournoi.';
  }
  if (lifecycle === 'draft') return 'Ce tournoi n’est pas encore ouvert aux inscriptions.';
  return null;
}

export async function handleTournamentExternalInvite(
  req: Request,
  res: Response,
  database: Firestore,
): Promise<void> {
  const origin = (req.headers.origin as string | undefined) ?? null;
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders(origin));
    res.status(204).send('');
    return;
  }

  if (rateLimited(clientIp(req))) {
    json(res, 429, { error: 'Trop de tentatives. Réessayez dans une heure.' }, origin);
    return;
  }

  const tournamentId = str(req.method === 'POST' ? req.body?.tournament_id : req.query.tournament_id, 64);
  const token = str(req.method === 'POST' ? req.body?.token : req.query.token, 80);
  if (!tournamentId || !token) {
    json(res, 400, { error: 'Lien d’invitation invalide.' }, origin);
    return;
  }

  const snap = await database.collection(COL).doc(tournamentId).get();
  if (!snap.exists) {
    json(res, 404, { error: 'Tournoi introuvable ou lien expiré.' }, origin);
    return;
  }
  const data = snap.data() ?? {};
  const now = new Date();

  if (req.method === 'GET') {
    const invite = findInvite(data, token);
    if (!invite) {
      json(res, 404, { error: 'Invitation introuvable — vérifiez le lien reçu.' }, origin);
      return;
    }
    const view = publicView(data, invite, now);
    const reason = invitationBlockReason(data, invite, now);
    json(res, 200, { ...view, can_respond: !reason, block_reason: reason }, origin);
    return;
  }

  // POST : accepter / décliner
  const response = req.body?.response === 'accepted' ? 'accepted' : req.body?.response === 'declined' ? 'declined' : null;
  if (!response) {
    json(res, 400, { error: 'Réponse invalide (accepted / declined).' }, origin);
    return;
  }

  const invite = findInvite(data, token);
  if (!invite) {
    json(res, 404, { error: 'Invitation introuvable — vérifiez le lien reçu.' }, origin);
    return;
  }
  const reason = invitationBlockReason(data, invite, now);
  if (reason) {
    json(res, 409, { error: reason }, origin);
    return;
  }

  // Doublon d'inscription : un autre token du même club déjà accepté.
  const clubName = str(req.body?.contact?.club_name, 120) || invite.club_name;
  const invites = Array.isArray(data.external_invites)
    ? (data.external_invites as Record<string, unknown>[])
    : [];
  const duplicate = invites.some(
    (i) =>
      String(i.token ?? '') !== token &&
      String(i.status ?? '') === 'accepted' &&
      String(i.club_name ?? '').trim().toLowerCase() === clubName.toLowerCase(),
  );
  if (duplicate) {
    json(res, 409, { error: 'Une inscription existe déjà pour ce club.' }, origin);
    return;
  }

  if (response === 'declined') {
    const nextInvites = invites.map((i) =>
      String(i.token ?? '') === token ? { ...i, status: 'declined', responded_at: now.toISOString(), responded_by: 'external' } : i,
    );
    await database.collection(COL).doc(tournamentId).update({
      external_invites: nextInvites,
      updated_at: FieldValue.serverTimestamp(),
    });
    json(res, 200, { ok: true, status: 'declined' }, origin);
    return;
  }

  const remainingCapacity =
    typeof data.capacity === 'number' && data.capacity > 0
      ? data.capacity -
        (Array.isArray(data.teams) ? data.teams.length : 0) -
        invites.filter((i) => String(i.status ?? '') === 'accepted').length
      : null;
  if (remainingCapacity !== null && remainingCapacity <= 0) {
    json(res, 409, { error: 'Le tournoi est complet.' }, origin);
    return;
  }

  const nextInvites = invites.map((i) =>
    String(i.token ?? '') === token
      ? {
          ...i,
          status: 'accepted',
          club_name: clubName,
          contact_name: str(req.body?.contact?.contact_name, 120) || i.contact_name || null,
          contact_email: str(req.body?.contact?.contact_email, 160) || i.contact_email || null,
          contact_phone: str(req.body?.contact?.contact_phone, 40) || i.contact_phone || null,
          category: str(req.body?.contact?.category, 60) || i.category || null,
          note: str(req.body?.contact?.note, 400) || i.note || null,
          responded_at: now.toISOString(),
          responded_by: 'external',
        }
      : i,
  );
  await database.collection(COL).doc(tournamentId).update({
    external_invites: nextInvites,
    updated_at: FieldValue.serverTimestamp(),
  });

  json(
    res,
    200,
    {
      ok: true,
      // Une invitation acceptée n'est PAS une confirmation : l'organisateur
      // doit approuver si requires_approval. Aucun compte n'est créé.
      status: invite.requires_approval ? 'pending_approval' : 'accepted',
      message: invite.requires_approval
        ? 'Votre inscription est enregistrée. L’organisateur doit encore l’approuver — il vous recontactera.'
        : 'Votre inscription est confirmée. Aucun compte ProDay n’a été créé.',
    },
    origin,
  );
}

export const tournamentExternalInvite = functions
  .region('europe-west1')
  .https.onRequest((req, res) => handleTournamentExternalInvite(req, res, admin.firestore()));
