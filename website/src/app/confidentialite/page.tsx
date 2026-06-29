import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { PRIVACY_POLICY, LEGAL_META } from "@/content/legal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité ProDay — données collectées, RGPD, droits des utilisateurs et contact.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentView
      doc={PRIVACY_POLICY}
      pathname={ROUTES.privacy}
      kicker="LÉGAL"
      pdfHref={LEGAL_META.pdf.privacy}
    />
  );
}
