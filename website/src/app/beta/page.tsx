import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BetaAccessContent } from "@/components/beta/BetaAccessContent";
import { BetaAccessDenied } from "@/components/beta/BetaAccessDenied";
import {
  BETA_ACCESS_COOKIE,
  BETA_ACCESS_COOKIE_MAX_AGE,
  validateBetaAccessToken,
} from "@/lib/betaAccess";

export const metadata: Metadata = {
  title: "Espace bêta",
  description: "Page privée réservée aux beta-testeurs ProDay invités par email.",
  robots: { index: false, follow: false },
};

async function resolveSession(
  tokenFromQuery: string | undefined,
  tokenFromCookie: string | undefined,
) {
  if (tokenFromQuery?.trim()) {
    return validateBetaAccessToken(tokenFromQuery);
  }
  if (tokenFromCookie?.trim()) {
    return validateBetaAccessToken(tokenFromCookie);
  }
  return null;
}

export default async function BetaAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: queryToken } = await searchParams;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(BETA_ACCESS_COOKIE)?.value;

  if (queryToken?.trim()) {
    const session = await validateBetaAccessToken(queryToken);
    if (session) {
      cookieStore.set(BETA_ACCESS_COOKIE, queryToken.trim(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: BETA_ACCESS_COOKIE_MAX_AGE,
        path: "/beta",
      });
      redirect("/beta");
    }
  }

  const session = await resolveSession(undefined, cookieToken);

  if (session) {
    return <BetaAccessContent session={session} />;
  }

  return <BetaAccessDenied />;
}
