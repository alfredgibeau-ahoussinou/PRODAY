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
import type {
  SponsorQuoteDocumentRequest,
  SponsorQuoteEvent,
  SponsorQuoteRequest,
  SponsorQuoteRequestStatus,
  SponsorQuoteThreadMessage,
} from '../models/SponsorQuoteRequest';
import {
  buildDefaultQuoteHtmlPreview,
  buildDefaultQuoteSubject,
} from '../utils/sponsorQuoteCopy';

export { buildDefaultQuoteHtmlPreview, buildDefaultQuoteSubject };

const SPONSOR_QUOTE_FUNCTION_URL =
  'https://europe-west1-proday-155b0.cloudfunctions.net/submitSponsorQuoteRequest';
const SPONSOR_ADMIN_FUNCTIONS_REGION = 'europe-west1';

function parseTimestamp(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
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
    contact_role: data.contact_role ? String(data.contact_role) : undefined,
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
    docs_pending: data.docs_pending === true,
    last_contact_at: parseTimestamp(data.last_contact_at),
    created_at: parseTimestamp(data.created_at) ?? new Date(),
    sent_at: parseTimestamp(data.sent_at),
    updated_at: parseTimestamp(data.updated_at),
  };
}

function sortByCreatedDesc(items: SponsorQuoteRequest[]): SponsorQuoteRequest[] {
  return [...items].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

function mapThread(raw: Record<string, unknown>): SponsorQuoteThreadMessage {
  return {
    id: String(raw.id ?? ''),
    author_role: (raw.author_role as SponsorQuoteThreadMessage['author_role']) ?? 'system',
    author_uid: String(raw.author_uid ?? ''),
    body: String(raw.body ?? ''),
    channel: raw.channel === 'email' ? 'email' : 'internal',
    email_sent: raw.email_sent === true,
    email_error: raw.email_error ? String(raw.email_error) : undefined,
    subject: raw.subject ? String(raw.subject) : undefined,
    created_at: parseTimestamp(raw.created_at) ?? new Date(),
  };
}

function mapDoc(raw: Record<string, unknown>): SponsorQuoteDocumentRequest {
  return {
    id: String(raw.id ?? ''),
    type: String(raw.type ?? 'other'),
    label: String(raw.label ?? raw.type ?? 'Document'),
    status: (raw.status as SponsorQuoteDocumentRequest['status']) ?? 'requested',
    file_url: raw.file_url ? String(raw.file_url) : undefined,
    file_name: raw.file_name ? String(raw.file_name) : undefined,
    requested_at: parseTimestamp(raw.requested_at) ?? new Date(),
    uploaded_at: parseTimestamp(raw.uploaded_at),
  };
}

function mapEvent(raw: Record<string, unknown>): SponsorQuoteEvent {
  return {
    id: String(raw.id ?? ''),
    type: String(raw.type ?? ''),
    actor_uid: String(raw.actor_uid ?? ''),
    actor_role: (raw.actor_role as SponsorQuoteEvent['actor_role']) ?? 'system',
    summary: String(raw.summary ?? ''),
    created_at: parseTimestamp(raw.created_at) ?? new Date(),
  };
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

  async listForSponsor(sponsorUid: string, max = 20): Promise<SponsorQuoteRequest[]> {
    if (!isFirebaseConfigured() || !sponsorUid.trim()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'sponsor_quote_requests'),
        where('sponsor_uid', '==', sponsorUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => quoteFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'sponsor_quote_requests'));
      return sortByCreatedDesc(
        snap.docs
          .map((d) => quoteFromFirestore(d.id, d.data() as Record<string, unknown>))
          .filter((q) => q.sponsor_uid === sponsorUid),
      ).slice(0, max);
    }
  },

  async getDesk(requestId: string): Promise<{
    thread: SponsorQuoteThreadMessage[];
    documents: SponsorQuoteDocumentRequest[];
    events: SponsorQuoteEvent[];
  }> {
    const res = await callFunction<
      { requestId: string },
      {
        thread: Array<Record<string, unknown>>;
        documents: Array<Record<string, unknown>>;
        events: Array<Record<string, unknown>>;
      }
    >('getSponsorQuoteDesk', { requestId }, SPONSOR_ADMIN_FUNCTIONS_REGION);
    return {
      thread: (res.thread ?? []).map(mapThread),
      documents: (res.documents ?? []).map(mapDoc),
      events: (res.events ?? []).map(mapEvent),
    };
  },

  async sendQuote(input: {
    requestId: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    allowResend?: boolean;
  }): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> {
    return callFunction(
      'adminSendSponsorQuote',
      {
        requestId: input.requestId,
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        allowResend: input.allowResend,
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

  async sendMessage(input: {
    requestId: string;
    body: string;
    subject?: string;
    sendEmail?: boolean;
  }): Promise<{ success: boolean; messageId: string; emailSent: boolean; emailError?: string }> {
    return callFunction(
      'adminSponsorQuoteMessage',
      input,
      SPONSOR_ADMIN_FUNCTIONS_REGION,
    );
  },

  async requestDocuments(input: {
    requestId: string;
    docTypes: string[];
    customLabels?: string[];
    message?: string;
    sendEmail?: boolean;
  }): Promise<{
    success: boolean;
    requestedIds: string[];
    emailSent: boolean;
    emailError?: string;
  }> {
    return callFunction('adminRequestSponsorQuoteDocs', input, SPONSOR_ADMIN_FUNCTIONS_REGION);
  },

  async fulfillDocument(input: {
    requestId: string;
    documentRequestId: string;
    fileUrl: string;
    fileName?: string;
  }): Promise<{ success: boolean }> {
    return callFunction('sponsorFulfillQuoteDoc', input, SPONSOR_ADMIN_FUNCTIONS_REGION);
  },
};
