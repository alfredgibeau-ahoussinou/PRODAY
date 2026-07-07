import { cache } from "react";
import { cookies } from "next/headers";
import {
  BETA_ACCESS_COOKIE,
  validateBetaAccessToken,
  type BetaAccessSession,
} from "@/lib/betaAccess";

/** Session bêta courante (dédupliquée par requête RSC). */
export const getBetaSession = cache(async (): Promise<BetaAccessSession | null> => {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(BETA_ACCESS_COOKIE)?.value;
  if (!cookieToken?.trim()) return null;
  return validateBetaAccessToken(cookieToken);
});
