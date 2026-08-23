import type { Metadata } from "next";
import { BetaAideContent } from "@/components/beta/BetaAideContent";
import { getBetaSession } from "@/lib/getBetaSession";

export const metadata: Metadata = {
  title: "Aide bêta",
  description: "FAQ beta testeur, contact support et envoi de retours ProDay.",
  robots: { index: false, follow: false },
};

export default async function BetaAidePage() {
  const session = await getBetaSession();
  if (!session) return null;
  return <BetaAideContent session={session} />;
}
