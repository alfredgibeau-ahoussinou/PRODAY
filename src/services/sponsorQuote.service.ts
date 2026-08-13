import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import type { SponsorQuoteRequest, SponsorQuoteRequestStatus } from '../models/SponsorQuoteRequest';

const SPONSOR_QUOTE_FUNCTION_URL = 'https://europe-west1-proday-155b0.cloudfunctions.net/submitSponsorQuoteRequest';
const SPONSOR_ADMIN_FUNCTIONS_REGION = 'europe-west1';

function parseTimestamp(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function quoteFromFirestore(id: string, data: Record<string, unknown>): SponsorQuoteRequest {
  return {
    id,
    company_name: String(data.company_name ?? ''),
    contact_email: String(data.contact_email ?? ''),
    contact_name: String(data.contact_name ?? ''),
    phone: data.phone ? String(data.phone) : undefined,
    budget: data.budget ? String(data.budget) : undefined,
    goals: Array.isArray(data.goals) ? data.goals.map(String) : undefined,
    audience: Array.isArray(data.audience) ? data.audience.map(String) : undefined,
    regions: Array.isArray(data.regions) ? data.regions.map(String) : undefined,
    sports: Array.isArray(data.sports) ? data.sports.map(String) : undefined,
    message: data.message ? String(data.message) : undefined,
    package_tier: (data.package_tier as SponsorQuoteRequest['package_tier']) ?? 'custom',
    sector: data.sector ? String(data.sector) : undefined,
    source: data.source === 'app' ? 'app' : 'website',
    sponsor_uid: data.sponsor_uid ? String(data.sponsor_uid) : undefined,
    status: (data.status as SponsorQuoteRequestStatus) ?? 'pending',
    admin_note: data.admin_note ? String(data.admin_note) : undefined,
    quote_subject: data.quote_subject ? String(data.quote_subject) : undefined,
    created_at: parseTimestamp(data.created_at) ?? new Date(),
    sent_at: parseTimestamp(data.sent_at),
    updated_at: parseTimestamp(data.updated_at),
  };
}

function sortByCreatedDesc(items: SponsorQuoteRequest[]): SponsorQuoteRequest[] {
  return [...items].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export function buildDefaultQuoteSubject(companyName: string): string {
  const name = companyName.trim() || 'votre entreprise';
  return `Votre devis ProDay Sponsor. ${name}`;
}

export function buildDefaultQuoteHtmlPreview(request: SponsorQuoteRequest): string {
  const packageLabels = {
    starter: 'Découverte (0 €)',
    territorial: 'Territorial (49 €/mois)',
    national: 'National Pro (99 €/mois)',
    custom: 'Sur-mesure',
  };
  const greeting = request.contact_name.trim() || 'Bonjour';
  const goals = request.goals?.length ? `<li>Objectifs : ${request.goals.join(', ')}</li>` : '';
  const regions = request.regions?.length ? `<li>Zones : ${request.regions.join(', ')}</li>` : '';
  const budget = request.budget ? `<li>Budget : ${request.budget}</li>` : '';

  return `<p>${greeting},</p>
<p>Merci pour votre intérêt pour <strong>ProDay Sponsor</strong>. Voici notre proposition pour <strong>${request.company_name}</strong>.</p>
<p><strong>${packageLabels[request.package_tier]}</strong></p>
<ul>${budget}${goals}${regions}</ul>
<p>Répondez à cet email pour valider ou ajuster la proposition.</p>
<p>Cordialement,<br/>L'équipe ProDay Partenaires</p>`;
}

export const sponsorQuoteService = {
  async submitQuoteRequest(input: {
    companyName: string;
    contactEmail: string;
    contactName: string;
    phone?: string;
    budget?: string;
    goals?: string[];
    audience?: string[];
    regions?: string[];
    sports?: string[];
    message?: string;
    packageTier?: SponsorQuoteRequest['package_tier'];
    sector?: string;
    source?: 'website' | 'app';
    sponsorUid?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(SPONSOR_QUOTE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-proday-client': 'proday-mobile',
          ...(process.env.EXPO_PUBLIC_PRODAY_MOBILE_API_SECRET?.trim()
            ? {
                'x-proday-mobile-key':
                  process.env.EXPO_PUBLIC_PRODAY_MOBILE_API_SECRET.trim(),
              }
            : {}),
        },
        body: JSON.stringify({
          companyName: input.companyName,
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          phone: input.phone,
          budget: input.budget,
          goals: input.goals,
          audience: input.audience,
          regions: input.regions,
          sports: input.sports,
          message: input.message,
          packageTier: input.packageTier ?? 'territorial',
          sector: input.sector,
          source: input.source ?? 'app',
          sponsorUid: input.sponsorUid,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        return { ok: false, error: data.error ?? 'Demande de devis impossible' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Connexion impossible. Réessayez plus tard' };
    }
  },

  async listForAdmin(
    statusFilter: SponsorQuoteRequestStatus | 'all' = 'pending',
    max = 50,
  ): Promise<SponsorQuoteRequest[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      if (statusFilter === 'all') {
        const q = query(
          collection(database, 'sponsor_quote_requests'),
          orderBy('created_at', 'desc'),
          limit(max),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => quoteFromFirestore(d.id, d.data() as Record<string, unknown>));
      }

      const q = query(
        collection(database, 'sponsor_quote_requests'),
        where('status', '==', statusFilter),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => quoteFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'sponsor_quote_requests'));
      const items = snap.docs.map((d) => quoteFromFirestore(d.id, d.data() as Record<string, unknown>));
      const filtered =
        statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter);
      return sortByCreatedDesc(filtered).slice(0, max);
    }
  },

  async sendQuote(input: {
    requestId: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> {
    return callFunction<
      { requestId: string; subject: string; htmlBody: string; textBody?: string },
      { success: boolean; emailSent: boolean; emailError?: string }
    >(
      'adminSendSponsorQuote',
      {
        requestId: input.requestId,
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
      },
      SPONSOR_ADMIN_FUNCTIONS_REGION,
    );
  },

  async rejectQuote(requestId: string, note?: string): Promise<{ success: boolean }> {
    return callFunction<{ requestId: string; note?: string }, { success: boolean }>(
      'adminRejectSponsorQuote',
      { requestId, note },
      SPONSOR_ADMIN_FUNCTIONS_REGION,
    );
  },
};
