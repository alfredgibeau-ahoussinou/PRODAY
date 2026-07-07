import { BetaHubContent } from "@/components/beta/BetaHubContent";
import { getBetaSession } from "@/lib/getBetaSession";

export default async function BetaHubPage() {
  const session = await getBetaSession();
  if (!session) return null;
  return <BetaHubContent session={session} />;
}
