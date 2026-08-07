import type { Metadata } from "next";
import { BetaStatutContent } from "@/components/beta/BetaStatutContent";
import { TerminalPage } from "@/components/terminal";

export const metadata: Metadata = {
  title: "Statut d’inscription",
  description:
    "Suivi de ton inscription ProDay : en attente de validation, approuvé ou refusé.",
  robots: { index: false, follow: false },
};

export default function BetaStatutPage() {
  return (
    <TerminalPage>
      <BetaStatutContent />
    </TerminalPage>
  );
}
