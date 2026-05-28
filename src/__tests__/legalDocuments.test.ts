import { getLegalDocument, LEGAL_DOCUMENTS } from '../content/legalDocuments';

describe('legalDocuments', () => {
  it('expose CGU et confidentialité', () => {
    expect(LEGAL_DOCUMENTS.terms.sections.length).toBeGreaterThan(0);
    expect(LEGAL_DOCUMENTS.privacy.sections.length).toBeGreaterThan(0);
  });

  it('getLegalDocument retourne le bon document', () => {
    expect(getLegalDocument('terms').title).toMatch(/Conditions/i);
    expect(getLegalDocument('privacy').title).toMatch(/confidentialité/i);
  });
});
