import {
  LEGAL_META,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
  type LegalSectionContent,
} from "../../../src/content/legal/fr";

export type LegalSection = LegalSectionContent;

export type LegalDocument = {
  title: string;
  updatedAt: string;
  contact: string;
  intro?: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Politique de confidentialité",
  updatedAt: LEGAL_META.updatedAt,
  contact: LEGAL_META.contactEmail,
  intro: PRIVACY_INTRO,
  sections: PRIVACY_SECTIONS,
};

export const TERMS_OF_USE: LegalDocument = {
  title: "Conditions générales d'utilisation",
  updatedAt: LEGAL_META.updatedAt,
  contact: LEGAL_META.contactEmail,
  intro: TERMS_INTRO,
  sections: TERMS_SECTIONS,
};

export { LEGAL_META };
