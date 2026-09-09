import {
  SPONSOR_QUOTE_DOC_TYPE_OPTIONS,
  SPONSOR_QUOTE_PACKAGE_AMOUNTS,
  SPONSOR_QUOTE_STATUS_LABELS,
  type SponsorQuoteRequest,
} from '../models/SponsorQuoteRequest';
import {
  buildDefaultQuoteHtmlPreview,
  buildDefaultQuoteSubject,
} from '../utils/sponsorQuoteCopy';
import { resolveAdminNav, isAdminNavSectionId } from '../features/admin/navigation/adminNavConfig';
import { buildAdminWorkQueue } from '../utils/adminInsights';
import { sponsorQuoteService } from '../services/sponsorQuote.service';
import { callFunction } from '../lib/firebaseFunctions';

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: (e: unknown) =>
    e instanceof Error ? e.message : 'erreur',
}));

jest.mock('../lib/firebase', () => ({
  getDb: () => ({}),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: () => true,
}));

const mockGetDocs = jest.fn();
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...args: unknown[]) => args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: jest.fn((...args: unknown[]) => args),
  orderBy: jest.fn((...args: unknown[]) => args),
  limit: jest.fn((...args: unknown[]) => args),
  where: jest.fn((...args: unknown[]) => args),
}));

describe('Admin devis sponsors', () => {
  it('expose la section sponsor_quotes dans la nav', () => {
    expect(isAdminNavSectionId('sponsor_quotes')).toBe(true);
    expect(resolveAdminNav('devis_sponsors').section).toBe('sponsor_quotes');
    expect(resolveAdminNav('sponsor_devis').section).toBe('sponsor_quotes');
  });

  it('prépare un sujet et un HTML de devis', () => {
    const quote: SponsorQuoteRequest = {
      id: 'q1',
      company_name: 'Acme Sport',
      contact_email: 'marie@acme.test',
      contact_name: 'Marie',
      package_tier: 'territorial',
      source: 'website',
      status: 'pending',
      created_at: new Date('2026-01-01T10:00:00Z'),
      budget: '2 000 €',
      goals: ['Notoriété'],
      regions: ['IDF'],
    };
    expect(buildDefaultQuoteSubject(quote.company_name)).toContain('Acme Sport');
    const html = buildDefaultQuoteHtmlPreview(quote);
    expect(html).toContain('Marie');
    expect(html).toContain('Acme Sport');
    expect(html).toContain('Territorial');
  });

  it('expose labels statut / packages / docs', () => {
    expect(SPONSOR_QUOTE_STATUS_LABELS.pending).toBe('En attente');
    expect(SPONSOR_QUOTE_PACKAGE_AMOUNTS.national).toContain('99');
    expect(SPONSOR_QUOTE_DOC_TYPE_OPTIONS.some((d) => d.id === 'kbis')).toBe(true);
  });

  it('route la file prioritaire devis sponsor vers sponsor_quotes', () => {
    const queue = buildAdminWorkQueue({
      users: [],
      communityReels: [],
      reelReports: [],
      payments: [],
      applications: [],
      posts: [],
      sponsorQuotes: [
        {
          id: 'sq1',
          company_name: 'Beta Co',
          contact_email: 'a@b.c',
          contact_name: 'Alex',
          package_tier: 'starter',
          source: 'app',
          status: 'pending',
          created_at: new Date(),
        },
      ],
    });
    const hit = queue.find((i) => i.kind === 'quote');
    expect(hit?.targetSection).toBe('sponsor_quotes');
    expect(hit?.entityId).toBe('sq1');
  });

  it('file prioritaire Docs reçus quand has_uploaded_docs', () => {
    const queue = buildAdminWorkQueue({
      users: [],
      communityReels: [],
      reelReports: [],
      payments: [],
      applications: [],
      posts: [],
      sponsorQuotes: [
        {
          id: 'sq-docs',
          company_name: 'Transport',
          contact_email: 'hello@gocityservices.com',
          contact_name: 'Go City',
          package_tier: 'territorial',
          source: 'website',
          status: 'sent',
          has_uploaded_docs: true,
          last_doc_uploaded_at: new Date('2026-09-09T12:00:00Z'),
          created_at: new Date('2026-09-01T10:00:00Z'),
        },
      ],
    });
    const hit = queue.find((i) => i.id === 'quotedocs-sq-docs');
    expect(hit?.title).toMatch(/Docs reçus/i);
    expect(hit?.targetSection).toBe('sponsor_quotes');
    expect(hit?.entityId).toBe('sq-docs');
  });

  it('getDesk bascule sur Firestore si getSponsorQuoteDesk est absente', async () => {
    (callFunction as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('Cloud Function introuvable (région europe-west1 ou non déployée).'), {
        code: 'functions/not-found',
      }),
    );
    mockGetDocs.mockResolvedValue({ docs: [] });
    const desk = await sponsorQuoteService.getDesk('eb93d7b9');
    expect(desk).toEqual({ thread: [], documents: [], events: [] });
    expect(mockGetDocs).toHaveBeenCalled();
  });

  it('sendMessage refuse honnêtement si CF absente (pas de fake e-mail)', async () => {
    (callFunction as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('not-found'), { code: 'functions/not-found' }),
    );
    await expect(
      sponsorQuoteService.sendMessage({ requestId: 'eb93d7b9', body: 'Bonjour' }),
    ).rejects.toThrow(/introuvable|europe-west1|deploy --only functions/i);
  });

  it('requestDocuments appelle adminRequestSponsorQuoteDocs en europe-west1', async () => {
    (callFunction as jest.Mock).mockResolvedValueOnce({
      success: true,
      requestedIds: ['d1'],
      emailSent: true,
    });
    const res = await sponsorQuoteService.requestDocuments({
      requestId: 'sq-transport',
      docTypes: ['kbis'],
      sendEmail: true,
    });
    expect(res.success).toBe(true);
    expect(callFunction).toHaveBeenCalledWith(
      'adminRequestSponsorQuoteDocs',
      expect.objectContaining({ requestId: 'sq-transport', docTypes: ['kbis'], sendEmail: true }),
      'europe-west1',
    );
  });

  it('requestDocuments ne mappe pas unavailable vers hint Blaze', async () => {
    (callFunction as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('Service Cloud Functions temporairement indisponible. Réessayez dans un instant.'), {
        code: 'functions/unavailable',
      }),
    );
    try {
      await sponsorQuoteService.requestDocuments({
        requestId: 'sq-transport',
        docTypes: ['kbis'],
      });
      throw new Error('expected reject');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toMatch(/temporairement indisponible/i);
      expect((e as Error).message).not.toMatch(/Blaze/i);
    }
  });
});
