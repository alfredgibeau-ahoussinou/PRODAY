export type LegalDocumentId = 'privacy' | 'terms';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
}

export {
  LEGAL_META,
  flattenSectionParagraphs,
} from './legal/fr';

import {
  LEGAL_META,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
  flattenSectionParagraphs,
} from './legal/fr';

export const LEGAL_CONTACT_EMAIL = LEGAL_META.contactEmail;

function toAppDocument(
  id: LegalDocumentId,
  title: string,
  intro: string,
  sections: typeof PRIVACY_SECTIONS,
): LegalDocument {
  return {
    id,
    title,
    updatedAt: LEGAL_META.updatedAt,
    intro,
    sections: sections.map((section) => ({
      title: section.title,
      paragraphs: flattenSectionParagraphs(section),
    })),
  };
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: toAppDocument('privacy', 'Politique de confidentialité', PRIVACY_INTRO, PRIVACY_SECTIONS),
  terms: toAppDocument('terms', 'Conditions générales d’utilisation', TERMS_INTRO, TERMS_SECTIONS),
};

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  return LEGAL_DOCUMENTS[id];
}

export function legalWebUrl(id: LegalDocumentId): string {
  const path = id === 'privacy' ? LEGAL_META.privacyPath : LEGAL_META.termsPath;
  return `${LEGAL_META.siteUrl}${path}`;
}

export function legalPdfUrl(id: LegalDocumentId): string {
  const path = id === 'privacy' ? LEGAL_META.pdf.privacy : LEGAL_META.pdf.terms;
  return `${LEGAL_META.siteUrl}${path}`;
}
