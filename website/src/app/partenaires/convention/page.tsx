import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import {
  LEGAL_META,
  SPONSOR_CONVENTION_META,
  SPONSOR_CONVENTION_PARTIES,
  SPONSOR_CONVENTION_SECTIONS,
} from "@/content/legal";

export const metadata: Metadata = {
  title: "Convention partenariat sponsor",
  description:
    "Modèle de convention de partenariat sponsor ProDay. Visibilité clubs et joueurs.",
};

const SPONSOR_DOC = {
  title: SPONSOR_CONVENTION_META.title,
  updatedAt: SPONSOR_CONVENTION_META.updatedAt,
  contact: SPONSOR_CONVENTION_META.contact,
  sections: SPONSOR_CONVENTION_SECTIONS,
};

export default function SponsorConventionPage() {
  return (
    <LegalDocumentView
      doc={SPONSOR_DOC}
      pathname="/partenaires/convention"
      kicker="PARTENAIRES"
      pdfHref={LEGAL_META.pdf.sponsor}
      parties={[...SPONSOR_CONVENTION_PARTIES]}
    />
  );
}
