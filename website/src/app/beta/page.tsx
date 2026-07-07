import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BetaAccessContent } from "@/components/beta/BetaAccessContent";
import { BetaAccessDenied } from "@/components/beta/BetaAccessDenied";
import { BETA_ACCESS_COOKIE, validateBetaAccessToken } from "@/lib/betaAccess";

export const metadata: Metadata = {
  title: "Bêta ProDay",
  description:
    "Programme bêta ProDay — téléchargement iOS (TestFlight) et Android (APK), pôles à tester et retours produit.",
  robots: { index: false, follow: false },
};

export default async function BetaAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: queryToken } = await searchParams;

  if (queryToken?.trim()) {
    redirect(`/api/beta/access?token=${encodeURIComponent(queryToken.trim())}`);
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(BETA_ACCESS_COOKIE)?.value;

  if (cookieToken?.trim()) {
    const session = await validateBetaAccessToken(cookieToken);
    if (session) {
      return <BetaAccessContent session={session} />;
    }
  }

  return <BetaAccessDenied />;
}
