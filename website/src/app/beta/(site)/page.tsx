import { redirect } from "next/navigation";
import { BETA_LANDING_PATH } from "@/lib/betaAccess";
import { getBetaSession } from "@/lib/getBetaSession";

/**
 * Hub bêta `/beta`.
 * Avec session cookie → programme.
 * Sans session → le layout affiche BetaAccessDenied (lien liste d'attente).
 */
export default async function BetaHubPage() {
  const session = await getBetaSession();
  if (!session) return null;
  redirect(BETA_LANDING_PATH);
}
