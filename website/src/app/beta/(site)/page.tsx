import { redirect } from "next/navigation";
import { BETA_LANDING_PATH } from "@/lib/betaAccess";
import { getBetaSession } from "@/lib/getBetaSession";

/** Hub legacy — les beta-testeurs avec cookie arrivent directement sur le programme. */
export default async function BetaHubPage() {
  const session = await getBetaSession();
  if (!session) return null;
  redirect(BETA_LANDING_PATH);
}
