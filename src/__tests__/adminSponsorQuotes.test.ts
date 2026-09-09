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
});
