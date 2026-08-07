import type { Metadata } from "next";
import { BetaProgrammeContent } from "@/components/beta/BetaProgrammeContent";
import { getBetaSession } from "@/lib/getBetaSession";

export const metadata: Metadata = {
  title: "Programme bêta",
  description: "Calendrier, cinq pôles et modules à tester pendant la bêta ProDay.",
  robots: { index: false, follow: false },
};

export default async function BetaProgrammePage() {
  const session = await getBetaSession();
  if (!session) return null;
  return <BetaProgrammeContent session={session} />;
}
