import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  notifyAdminNewQuoteRequest,
  type SponsorQuotePackageTier,
  type SponsorQuoteRequestData,
} from './sponsorQuoteMail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PACKAGE_TIERS = new Set<SponsorQuotePackageTier>([
  'starter',
  'territorial',
  'national',
  'custom',
]);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday75.netlify.app',
];

const MAX_STRING = 200;
const MAX_ARRAY = 12;
const MAX_MESSAGE = 2000;

function setCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.get('Origin') ?? '';
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app'))) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, x-proday-client, x-proday-mobile-key, Authorization');
  return req.method === 'OPTIONS';
}

function trimStr(value: unknown, max = MAX_STRING): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function trimArray(value: unknown, max = MAX_ARRAY): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim().slice(0, MAX_STRING))
    .filter(Boolean)
    .slice(0, max);
}

function resolvePackageTier(value: unknown): SponsorQuotePackageTier {
  const tier = trimStr(value, 32).toLowerCase() as SponsorQuotePackageTier;
  return PACKAGE_TIERS.has(tier) ? tier : 'custom';
}

export type ParsedSponsorQuotePayload = SponsorQuoteRequestData & {
  sponsor_uid?: string;
};

export function parseSponsorQuotePayload(body: Record<string, unknown>): ParsedSponsorQuotePayload {
  const sourceRaw = trimStr(body.source, 16).toLowerCase();
  const source: 'website' | 'app' = sourceRaw === 'app' ? 'app' : 'website';

  return {
    company_name: trimStr(body.companyName ?? body.company_name),
    contact_email: trimStr(body.contactEmail ?? body.contact_email ?? body.email, 254).toLowerCase(),
    contact_name: trimStr(body.contactName ?? body.contact_name),
    contact_role: trimStr(body.contactRole ?? body.contact_role) || undefined,
    phone: trimStr(body.phone, 32) || undefined,
    budget: trimStr(body.budget) || undefined,
    goals: trimArray(body.goals),
    audience: trimArray(body.audience),
    regions: trimArray(body.regions),
    sports: trimArray(body.sports),
    message: body.message ? trimStr(body.message, MAX_MESSAGE) : undefined,
    package_tier: resolvePackageTier(body.packageTier ?? body.package_tier),
    sector: trimStr(body.sector) || undefined,
    source,
    sponsor_uid: trimStr(body.sponsorUid ?? body.sponsor_uid, 128) || undefined,
  };
}

export function validateSponsorQuotePayload(payload: ParsedSponsorQuotePayload): string | null {
  if (!payload.company_name) return 'Nom d\'entreprise requis';
  if (!payload.contact_name) return 'Nom du contact requis';
  if (!EMAIL_RE.test(payload.contact_email)) return 'Email invalide';
  return null;
}

export async function createSponsorQuoteRequest(
  db: admin.firestore.Firestore,
  payload: ParsedSponsorQuotePayload,
): Promise<{ requestId: string }> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('sponsor_quote_requests').doc();

  const data: Record<string, unknown> = {
    company_name: payload.company_name,
    contact_email: payload.contact_email,
    contact_name: payload.contact_name,
    package_tier: payload.package_tier,
    source: payload.source,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  if (payload.phone) data.phone = payload.phone;
  if (payload.contact_role) data.contact_role = payload.contact_role;
  if (payload.budget) data.budget = payload.budget;
  if (payload.goals?.length) data.goals = payload.goals;
  if (payload.audience?.length) data.audience = payload.audience;
  if (payload.regions?.length) data.regions = payload.regions;
  if (payload.sports?.length) data.sports = payload.sports;
  if (payload.message) data.message = payload.message;
  if (payload.sector) data.sector = payload.sector;
  if (payload.sponsor_uid) data.sponsor_uid = payload.sponsor_uid;

  await docRef.set(data);

  void notifyAdminNewQuoteRequest(payload, docRef.id).catch((e) =>
    console.error('[createSponsorQuoteRequest] alerte admin:', e),
  );

  return { requestId: docRef.id };
}

/** Demande de devis sponsor depuis le site vitrine ou l'app mobile. */
export function createSubmitSponsorQuoteRequestHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res)) {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const payload = parseSponsorQuotePayload(body);
    const validationError = validateSponsorQuotePayload(payload);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    try {
      const { requestId } = await createSponsorQuoteRequest(db, payload);
      res.status(200).json({
        ok: true,
        requestId,
        message: 'Demande de devis enregistrée. Notre équipe vous recontacte sous 48 h ouvrées.',
      });
    } catch (e) {
      console.error('[submitSponsorQuoteRequest]', e);
      res.status(500).json({ error: 'Enregistrement impossible' });
    }
  };
}
