import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { timingSafeEqual } from 'crypto';
import { generateBetaAccessToken } from './betaAccessToken';
import { BETA_ROLE_LABELS, isBetaRoleId } from './betaWaitlistEmail';
import {
  markRejectEmailSent,
  markWelcomeEmailSent,
  sendBetaRejectEmailToEntry,
  sendBetaWelcomeEmailToEntry,
} from './betaWaitlistMail';
import {
  broadcastIosPreAnnouncement,
  executeIosBetaLaunch,
  sendEngagementRound,
  sendIosPreAnnouncementAfterSignup,
} from './betaIosCampaign';
import { resolveBetaWaitlistStatus } from './betaWaitlistStatus';
import { isIosBetaLaunched } from './betaIosCampaignConstants';
import { configStr } from './runtimeConfig';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday75.netlify.app',
];

const WEBSITE_ADMIN_ACTOR = 'website-admin';
const MAX_LIST = 200;
const MAX_BULK = 50;
const MAX_NOTE_LENGTH = 500;

type AdminAction =
  | 'list'
  | 'approve'
  | 'reject'
  | 'resend'
  | 'bulk_approve'
  | 'broadcast_ios_pre_announcement'
  | 'trigger_ios_launch'
  | 'send_engagement_round';

function setCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.get('Origin') ?? '';
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app'))
  ) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
  return req.method === 'OPTIONS';
}

function getConfiguredSecret(): string | null {
  return (
    configStr('beta', 'website_admin_secret', [
      'BETA_WEBSITE_ADMIN_SECRET',
      'BETA_ADMIN_API_SECRET',
    ]) ?? null
  );
}

function extractProvidedSecret(req: functions.https.Request): string {
  const headerSecret = String(req.get('X-Admin-Secret') ?? '').trim();
  if (headerSecret) return headerSecret;

  const auth = String(req.get('Authorization') ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function assertWebsiteAdmin(req: functions.https.Request): void {
  const expected = getConfiguredSecret();
  if (!expected) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Secret admin site non configuré (BETA_WEBSITE_ADMIN_SECRET)',
    );
  }
  const provided = extractProvidedSecret(req);
  if (!secretsMatch(provided, expected)) {
    throw new functions.https.HttpsError('permission-denied', 'Secret invalide');
  }
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function resolveAccessToken(data: admin.firestore.DocumentData): string {
  const existing =
    typeof data.access_token === 'string' && data.access_token.trim()
      ? data.access_token.trim()
      : '';
  return existing || generateBetaAccessToken();
}

function resolveRoleLabel(data: admin.firestore.DocumentData): string {
  if (typeof data.role_label === 'string' && data.role_label.trim()) {
    return data.role_label.trim();
  }
  const role = String(data.role ?? 'player');
  return isBetaRoleId(role) ? BETA_ROLE_LABELS[role] : role;
}

function resolveDisplayName(data: admin.firestore.DocumentData): string | undefined {
  const candidates = [data.name, data.full_name, data.display_name];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return undefined;
}

function normalizeAdminNote(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, MAX_NOTE_LENGTH);
  return trimmed || undefined;
}

async function listWaitlist(db: admin.firestore.Firestore) {
  let snap: admin.firestore.QuerySnapshot;
  try {
    snap = await db
      .collection('beta_waitlist')
      .orderBy('created_at', 'desc')
      .limit(MAX_LIST)
      .get();
  } catch {
    snap = await db.collection('beta_waitlist').limit(MAX_LIST).get();
  }

  const entries = snap.docs.map((doc) => {
    const data = doc.data();
    const status = resolveBetaWaitlistStatus(data);
    return {
      id: doc.id,
      email: String(data.email ?? ''),
      name: resolveDisplayName(data) ?? null,
      role: data.role ? String(data.role) : undefined,
      role_label: resolveRoleLabel(data),
      status,
      welcome_email_sent: data.welcome_email_sent === true,
      reject_email_sent: data.reject_email_sent === true,
      confirmation_email_sent: data.confirmation_email_sent === true,
      admin_note: typeof data.admin_note === 'string' ? data.admin_note : null,
      referral_code: typeof data.referral_code === 'string' ? data.referral_code : null,
      created_at: toIso(data.created_at),
      approved_at: toIso(data.approved_at),
      rejected_at: toIso(data.rejected_at),
    };
  });

  entries.sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === 'pending').length,
    approved: entries.filter((e) => e.status === 'approved').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
  };

  return { ok: true, entries, counts };
}

async function approveEntry(
  db: admin.firestore.Firestore,
  entryId: string,
  adminNote?: string,
) {
  const ref = db.collection('beta_waitlist').doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
  }
  const entry = snap.data()!;
  const status = resolveBetaWaitlistStatus(entry);
  if (status === 'rejected') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Inscription refusée — réactivez manuellement si besoin',
    );
  }

  const email = String(entry.email ?? '').trim().toLowerCase();
  if (!email) {
    throw new functions.https.HttpsError('failed-precondition', 'Email manquant');
  }

  const accessToken = resolveAccessToken(entry);
  const roleLabel = resolveRoleLabel(entry);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const note = normalizeAdminNote(adminNote);

  await ref.update({
    status: 'approved',
    access_token: accessToken,
    approved_at: now,
    approved_by: WEBSITE_ADMIN_ACTOR,
    updated_at: now,
    ...(note ? { admin_note: note } : {}),
  });

  const { emailSent, emailError } = await sendBetaWelcomeEmailToEntry(
    email,
    roleLabel,
    accessToken,
  );
  if (emailSent) await markWelcomeEmailSent(ref);

  // Avant le lancement iOS : s'assurer que l'annonce date a bien été envoyée.
  if (!isIosBetaLaunched()) {
    void sendIosPreAnnouncementAfterSignup(db, ref).catch((err) => {
      console.error('[websiteBetaWaitlistAdmin] pre-announcement after approve:', err);
    });
  }

  return { ok: true, success: true, emailSent, emailError };
}

async function rejectEntry(
  db: admin.firestore.Firestore,
  entryId: string,
  adminNote?: string,
) {
  const ref = db.collection('beta_waitlist').doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
  }

  const entry = snap.data()!;
  const email = String(entry.email ?? '').trim().toLowerCase();
  const roleLabel = resolveRoleLabel(entry);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const note = normalizeAdminNote(adminNote);

  await ref.update({
    status: 'rejected',
    rejected_at: now,
    rejected_by: WEBSITE_ADMIN_ACTOR,
    updated_at: now,
    ...(note ? { admin_note: note } : {}),
  });

  let emailSent = false;
  let emailError: string | undefined;
  if (email) {
    const result = await sendBetaRejectEmailToEntry(email, roleLabel);
    emailSent = result.emailSent;
    emailError = result.emailError;
    if (emailSent) await markRejectEmailSent(ref);
  }

  return { ok: true, success: true, emailSent, emailError };
}

async function bulkApprove(
  db: admin.firestore.Firestore,
  entryIds: string[],
  adminNote?: string,
) {
  const unique = [...new Set(entryIds.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_BULK,
  );
  if (unique.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'entryIds requis');
  }

  const results: Array<{
    id: string;
    ok: boolean;
    emailSent?: boolean;
    emailError?: string;
    error?: string;
  }> = [];

  for (const id of unique) {
    try {
      const r = await approveEntry(db, id, adminNote);
      results.push({
        id,
        ok: true,
        emailSent: r.emailSent,
        emailError: r.emailError,
      });
    } catch (e) {
      const msg =
        e instanceof functions.https.HttpsError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Échec';
      results.push({ id, ok: false, error: msg });
    }
  }

  return {
    ok: true,
    success: true,
    approved: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

async function resendWelcome(db: admin.firestore.Firestore, entryId: string) {
  const ref = db.collection('beta_waitlist').doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Inscription introuvable');
  }
  const entry = snap.data()!;
  const status = resolveBetaWaitlistStatus(entry);
  if (status !== 'approved') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      "Approuvez l'inscription avant de renvoyer l'email",
    );
  }

  const email = String(entry.email ?? '').trim().toLowerCase();
  const accessToken = resolveAccessToken(entry);
  const roleLabel = resolveRoleLabel(entry);

  await ref.update({
    access_token: accessToken,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  const { emailSent, emailError } = await sendBetaWelcomeEmailToEntry(
    email,
    roleLabel,
    accessToken,
  );
  if (emailSent) await markWelcomeEmailSent(ref);

  return { ok: true, success: true, emailSent, emailError };
}

function httpsErrorStatus(code: functions.https.FunctionsErrorCode): number {
  switch (code) {
    case 'invalid-argument':
      return 400;
    case 'unauthenticated':
    case 'permission-denied':
      return 403;
    case 'not-found':
      return 404;
    case 'failed-precondition':
      return 409;
    default:
      return 500;
  }
}

/** Admin waitlist depuis le site vitrine — secret partagé (pas de Firebase Auth). */
export function createWebsiteBetaWaitlistAdminHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res)) {
      res.status(204).send('');
      return;
    }

    try {
      assertWebsiteAdmin(req);

      let action: AdminAction = 'list';
      let entryId = '';
      let entryIds: string[] = [];
      let adminNote: string | undefined;

      if (req.method === 'GET') {
        action = 'list';
      } else if (req.method === 'POST') {
        const body = (req.body ?? {}) as {
          action?: string;
          entryId?: string;
          entryIds?: string[];
          admin_note?: string;
          adminNote?: string;
          round?: number;
        };
        const raw = String(body.action ?? 'list').trim().toLowerCase();
        if (
          raw !== 'list' &&
          raw !== 'approve' &&
          raw !== 'reject' &&
          raw !== 'resend' &&
          raw !== 'bulk_approve' &&
          raw !== 'broadcast_ios_pre_announcement' &&
          raw !== 'trigger_ios_launch' &&
          raw !== 'send_engagement_round'
        ) {
          res.status(400).json({ error: 'action invalide' });
          return;
        }
        action = raw;
        entryId = String(body.entryId ?? '').trim();
        entryIds = Array.isArray(body.entryIds)
          ? body.entryIds.map((id) => String(id ?? '').trim()).filter(Boolean)
          : [];
        adminNote = normalizeAdminNote(body.admin_note ?? body.adminNote);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      if (action === 'list') {
        res.status(200).json(await listWaitlist(db));
        return;
      }

      if (action === 'broadcast_ios_pre_announcement') {
        res.status(200).json({ ok: true, ...(await broadcastIosPreAnnouncement(db)) });
        return;
      }

      if (action === 'trigger_ios_launch') {
        try {
          res.status(200).json({ ok: true, ...(await executeIosBetaLaunch(db)) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Lancement iOS impossible';
          res.status(409).json({ error: msg });
        }
        return;
      }

      if (action === 'send_engagement_round') {
        const body = (req.body ?? {}) as { round?: number };
        const stateSnap = await db.doc('beta_campaign/state').get();
        const current = (stateSnap.data()?.engagement_round as number | undefined) ?? 0;
        const round = typeof body.round === 'number' && body.round > 0 ? body.round : current + 1;
        res.status(200).json({ ok: true, round, ...(await sendEngagementRound(db, round)) });
        return;
      }

      if (action === 'bulk_approve') {
        res.status(200).json(await bulkApprove(db, entryIds, adminNote));
        return;
      }

      if (!entryId) {
        res.status(400).json({ error: 'entryId requis' });
        return;
      }

      if (action === 'approve') {
        res.status(200).json(await approveEntry(db, entryId, adminNote));
        return;
      }
      if (action === 'reject') {
        res.status(200).json(await rejectEntry(db, entryId, adminNote));
        return;
      }
      res.status(200).json(await resendWelcome(db, entryId));
    } catch (e) {
      if (e instanceof functions.https.HttpsError) {
        res.status(httpsErrorStatus(e.code)).json({ error: e.message });
        return;
      }
      console.error('[websiteBetaWaitlistAdmin]', e);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}
