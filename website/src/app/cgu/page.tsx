import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { TERMS_OF_USE } from "@/content/legal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "CGU ProDay — règles d'utilisation de l'application mobile foot amateur et semi-pro.",
};

export default function TermsPage() {
  return (
    <LegalDocumentView
      doc={TERMS_OF_USE}
      pathname={ROUTES.terms}
      kicker="LÉGAL"
    />
  );
}
